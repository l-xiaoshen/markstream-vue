import type { MonacoOptions, UseMonacoReturn } from 'stream-monaco'
import type { MonacoEditorKind } from './monacoEditorLayout'
import { onDestroy, tick, untrack } from 'svelte'
import { monacoRuntime } from '../../optional/monaco'
import { createMonacoEditorLayout } from './monacoEditorLayout'

type MonacoEditorState
  = { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ready', editorKind: MonacoEditorKind }
    | { kind: 'fallback', message: string }

interface MonacoEditorOptions {
  getCode: () => string
  getOriginalCode: () => string
  getUpdatedCode: () => string
  getLanguage: () => string
  getTheme: () => string
  getOptions: () => MonacoOptions
  getEditorKind: () => MonacoEditorKind
  getRefreshDelayMs?: (() => number) | undefined
  shouldRender: () => boolean
}

function errorMessage(error: Error): string {
  return error.message || error.name || 'Monaco editor failed to initialize.'
}

export class MonacoEditor {
  state = $state.raw<MonacoEditorState>({ kind: 'idle' })

  #activeHost: HTMLDivElement | null = null
  #activeKind: MonacoEditorKind | null = null
  #destroyed = false
  #editorLayout: ReturnType<typeof createMonacoEditorLayout>
  #generation = 0
  #helpers: UseMonacoReturn | null = null
  #host: HTMLDivElement | null = null
  #refreshing = false
  #refreshQueued = false
  #refreshTimer: ReturnType<typeof setTimeout> | undefined

  attachment(element: HTMLDivElement) {
    this.#host = element
    untrack(() => this.#scheduleRefresh(0))
    return () => {
      if (this.#host !== element)
        return
      this.#host = null
      this.#generation += 1
      this.#refreshQueued = false
      this.#clearRefreshTimer()
      this.#cleanEditor()
      this.state = { kind: 'idle' }
    }
  }

  constructor(private readonly options: MonacoEditorOptions) {
    this.#editorLayout = createMonacoEditorLayout({
      getEditorKind: () => this.#activeKind,
      getHelpers: () => this.#helpers,
      getHost: () => this.#activeHost,
      getOptions: this.options.getOptions,
      isReady: () => this.state.kind === 'ready',
    })

    $effect(() => {
      this.options.getCode()
      this.options.getOriginalCode()
      this.options.getUpdatedCode()
      this.options.getLanguage()
      this.options.getTheme()
      this.options.getOptions()
      this.options.getEditorKind()
      const refreshDelayMs = this.options.getRefreshDelayMs?.() ?? 0
      this.options.shouldRender()
      this.#scheduleRefresh(refreshDelayMs)
    })

    onDestroy(() => this.dispose())
  }

  #clearRefreshTimer(): void {
    if (this.#refreshTimer === undefined)
      return
    clearTimeout(this.#refreshTimer)
    this.#refreshTimer = undefined
  }

  #cleanEditor(): void {
    this.#editorLayout.clear()
    try {
      this.#helpers?.cleanupEditor()
    }
    catch {
      // The host may already have been removed by Svelte.
    }
    this.#activeHost = null
    this.#activeKind = null
  }

  async #createEditor(
    host: HTMLDivElement,
    kind: MonacoEditorKind,
    generation: number,
  ): Promise<void> {
    if (!this.#helpers)
      return

    this.#cleanEditor()
    host.replaceChildren()
    this.#activeHost = host
    this.#activeKind = kind
    if (kind === 'diff') {
      await this.#helpers.createDiffEditor(
        host,
        this.options.getOriginalCode(),
        this.options.getUpdatedCode() || this.options.getCode(),
        this.options.getLanguage(),
      )
    }
    else {
      await this.#helpers.createEditor(
        host,
        this.options.getCode(),
        this.options.getLanguage(),
      )
    }

    if (generation !== this.#generation || this.#destroyed)
      return
    this.state = { kind: 'ready', editorKind: kind }
    this.#editorLayout.bind(kind)
  }

  async #performRefresh(): Promise<void> {
    this.#clearRefreshTimer()
    const host = this.#host
    if (this.#destroyed)
      return
    if (typeof window === 'undefined' || !host || !this.options.shouldRender()) {
      if (this.#activeHost)
        this.#cleanEditor()
      this.state = { kind: 'idle' }
      return
    }

    const generation = ++this.#generation
    if (untrack(() => this.state.kind) !== 'ready')
      this.state = { kind: 'loading' }
    await tick()

    try {
      if (!this.#helpers) {
        const runtime = await monacoRuntime.get()
        if (!runtime)
          throw new Error('Optional dependency "stream-monaco" is not available.')
        this.#helpers = runtime.useMonaco(this.options.getOptions())
      }
      if (generation !== this.#generation || this.#destroyed || !this.#helpers)
        return

      const kind = this.options.getEditorKind()
      if (this.#activeHost !== host || this.#activeKind !== kind) {
        await this.#createEditor(host, kind, generation)
        if (generation !== this.#generation || this.#destroyed || !this.#helpers)
          return
      }

      if (kind === 'diff') {
        this.#helpers.updateDiff(
          this.options.getOriginalCode(),
          this.options.getUpdatedCode() || this.options.getCode(),
          this.options.getLanguage(),
        )
        this.#helpers.getDiffEditorView()?.updateOptions(this.options.getOptions())
        this.#helpers.refreshDiffPresentation()
      }
      else {
        this.#helpers.updateCode(this.options.getCode(), this.options.getLanguage())
        this.#helpers.getEditorView()?.updateOptions(this.options.getOptions())
      }
      await this.#helpers.setTheme(this.options.getTheme())

      if (generation !== this.#generation || this.#destroyed)
        return
      this.state = { kind: 'ready', editorKind: kind }
      this.#editorLayout.request()
    }
    catch (error) {
      if (generation !== this.#generation || this.#destroyed)
        return
      this.#cleanEditor()
      this.state = {
        kind: 'fallback',
        message: error instanceof Error ? errorMessage(error) : 'Monaco editor failed.',
      }
    }
  }

  async #refresh(): Promise<void> {
    if (this.#destroyed)
      return
    if (this.#refreshing) {
      this.#refreshQueued = true
      return
    }

    this.#refreshing = true
    try {
      await this.#performRefresh()
    }
    finally {
      this.#refreshing = false
      if (this.#refreshQueued && !this.#destroyed) {
        this.#refreshQueued = false
        this.#scheduleRefresh(0)
      }
    }
  }

  #scheduleRefresh(delayMs: number): void {
    if (this.#destroyed)
      return
    const delay = Number.isFinite(delayMs) ? Math.max(0, delayMs) : 0
    if (delay === 0) {
      this.#clearRefreshTimer()
      void this.#refresh()
      return
    }
    if (this.#refreshTimer !== undefined)
      return
    this.#refreshTimer = setTimeout(() => {
      this.#refreshTimer = undefined
      void this.#refresh()
    }, delay)
  }

  async refresh(): Promise<void> {
    await this.#refresh()
  }

  layout(): void {
    this.#editorLayout.request()
  }

  dispose(): void {
    if (this.#destroyed)
      return
    this.#destroyed = true
    this.#generation += 1
    this.#refreshQueued = false
    this.#clearRefreshTimer()
    this.#cleanEditor()
    this.#helpers = null
    this.state = { kind: 'idle' }
  }
}
