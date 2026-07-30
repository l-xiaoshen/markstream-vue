import type { RenderOptions } from '@terrastruct/d2'
import { onDestroy, onMount, untrack } from 'svelte'
import { renderD2Svg } from '../../utils/rendering/d2'

interface D2RenderSnapshot {
  darkThemeId?: RenderOptions['themeID'] | null
  isDark: boolean
  signature: string
  source: string
  themeId?: RenderOptions['themeID'] | null
}

interface D2RenderJob {
  force: boolean
  generation: number
  snapshot: D2RenderSnapshot
}

interface D2RendererOptions {
  getActive: () => boolean
  getDarkThemeId: () => RenderOptions['themeID'] | null | undefined
  getDebounceMs: () => number
  getIsDark: () => boolean
  getSource: () => string
  getThemeId: () => RenderOptions['themeID'] | null | undefined
}

export class D2Renderer {
  svgMarkup = $state('')
  renderError = $state('')
  rendering = $state(false)

  #active = false
  #activeGeneration = 0
  #activeSignature = ''
  #generation = 0
  #lastCompletedSignature = ''
  #mounted = false
  #pendingJob: D2RenderJob | null = null
  #renderTimer: ReturnType<typeof setTimeout> | undefined

  constructor(private readonly options: D2RendererOptions) {
    $effect(() => {
      const snapshot = this.#createSnapshot()
      const active = this.options.getActive()
      untrack(() => {
        if (!this.#mounted)
          return
        if (!active || !snapshot.source.trim()) {
          this.suspend(!snapshot.source.trim())
          return
        }
        this.requestRender(false, snapshot)
      })
    })

    onMount(() => {
      this.#mounted = true
      this.requestRender(true)
    })

    onDestroy(() => {
      this.#mounted = false
      this.suspend()
    })
  }

  #createSnapshot(): D2RenderSnapshot {
    const source = this.options.getSource()
    const isDark = this.options.getIsDark()
    const themeId = this.options.getThemeId()
    const darkThemeId = this.options.getDarkThemeId()
    return {
      ...(darkThemeId === undefined ? {} : { darkThemeId }),
      isDark,
      signature: [source, isDark, themeId ?? '', darkThemeId ?? ''].join('\n'),
      source,
      ...(themeId === undefined ? {} : { themeId }),
    }
  }

  #clearTimer(): void {
    if (this.#renderTimer !== undefined)
      clearTimeout(this.#renderTimer)
    this.#renderTimer = undefined
  }

  #scheduleDrain(force = false): void {
    if (this.#active || this.#renderTimer !== undefined || !this.#pendingJob)
      return
    const delayMs = force ? 0 : Math.max(0, this.options.getDebounceMs())
    this.#renderTimer = setTimeout(() => {
      this.#renderTimer = undefined
      void this.#drain()
    }, delayMs)
  }

  #schedulePending(): void {
    this.#scheduleDrain(this.#pendingJob?.force ?? false)
  }

  async #drain(): Promise<void> {
    if (this.#active || !this.#pendingJob || !this.#mounted)
      return
    const job = this.#pendingJob
    this.#pendingJob = null
    this.#active = true
    this.#activeGeneration = job.generation
    this.#activeSignature = job.snapshot.signature
    this.rendering = true
    this.renderError = ''
    try {
      const markup = await renderD2Svg({
        ...(job.snapshot.darkThemeId === undefined
          ? {}
          : { darkThemeId: job.snapshot.darkThemeId }),
        isDark: job.snapshot.isDark,
        source: job.snapshot.source,
        svgClass: 'markstream-d2-root-svg',
        ...(job.snapshot.themeId === undefined
          ? {}
          : { themeId: job.snapshot.themeId }),
      })
      if (this.#mounted && job.generation === this.#generation) {
        this.svgMarkup = markup
        this.#lastCompletedSignature = job.snapshot.signature
      }
    }
    catch (error) {
      if (this.#mounted && job.generation === this.#generation) {
        this.svgMarkup = ''
        this.renderError = error instanceof Error ? error.message : String(error)
        this.#lastCompletedSignature = job.snapshot.signature
      }
    }
    finally {
      this.#active = false
      this.#activeGeneration = 0
      this.#activeSignature = ''
      this.rendering = false
      this.#schedulePending()
    }
  }

  requestRender(
    force = false,
    snapshot = this.#createSnapshot(),
  ): void {
    if (!this.#mounted || !this.options.getActive() || !snapshot.source.trim())
      return
    if (this.#pendingJob?.snapshot.signature === snapshot.signature && !force)
      return
    if (this.#pendingJob) {
      this.#pendingJob = null
      if (!this.#active)
        this.#clearTimer()
    }
    if (
      this.#active
      && snapshot.signature === this.#activeSignature
      && this.#activeGeneration === this.#generation
      && !force
    ) {
      return
    }
    if (
      !force
      && snapshot.signature === this.#lastCompletedSignature
      && (this.svgMarkup || this.renderError)
    ) {
      if (this.#active)
        this.#generation += 1
      return
    }
    this.#pendingJob = { force, generation: ++this.#generation, snapshot }
    if (force)
      this.#clearTimer()
    this.#scheduleDrain(force)
  }

  suspend(clearOutput = false): void {
    this.#generation += 1
    this.#pendingJob = null
    this.#activeSignature = ''
    this.rendering = false
    this.#clearTimer()
    if (!clearOutput)
      return
    this.svgMarkup = ''
    this.renderError = ''
    this.#lastCompletedSignature = ''
  }
}
