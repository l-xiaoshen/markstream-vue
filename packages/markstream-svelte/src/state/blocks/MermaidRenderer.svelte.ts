import type {
  MermaidBindFunctions,
  MermaidRenderRequest,
} from '../../utils/rendering/mermaid'
import { onDestroy, onMount, untrack } from 'svelte'
import { renderMermaidSvg } from '../../utils/rendering/mermaid'

interface MermaidRenderSnapshot
  extends Omit<MermaidRenderRequest, 'allowPrefix'> {
  normalizedSource: string
  profileKey: string
  signature: string
}

interface MermaidRenderJob {
  force: boolean
  generation: number
  snapshot: MermaidRenderSnapshot & { allowPrefix: boolean }
}

interface MermaidRendererOptions {
  getActive: () => boolean
  getDebounceMs: () => number
  getSnapshot: () => MermaidRenderSnapshot
}

export class MermaidRenderer {
  svgMarkup = $state('')
  renderError = $state('')
  rendering = $state(false)
  interactionVersion = $state(0)

  #active = false
  #activeGeneration = 0
  #activeSignature = ''
  #bindFunctions: MermaidBindFunctions | null = null
  #boundInteractionVersions = new WeakMap<Element, number>()
  #generation = 0
  #hasRenderedOnce = false
  #lastMissSignature = ''
  #lastRequestedSource = ''
  #lastCompletedSignature = ''
  #mounted = false
  #pendingJob: MermaidRenderJob | null = null
  #renderTimer: ReturnType<typeof setTimeout> | undefined
  #renderedCodeByProfile = new Map<string, string>()
  #svgByProfile = new Map<string, string>()

  constructor(private readonly options: MermaidRendererOptions) {
    $effect(() => {
      const snapshot = this.#createSnapshot()
      const active = this.options.getActive()
      untrack(() => {
        if (!this.#mounted)
          return
        if (!active) {
          this.suspend()
          return
        }
        if (!snapshot.source.trim()) {
          this.clear()
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

  #createSnapshot(): MermaidRenderJob['snapshot'] {
    const snapshot = this.options.getSnapshot()
    if (
      this.#lastRequestedSource
      && snapshot.source !== this.#lastRequestedSource
      && !snapshot.source.startsWith(this.#lastRequestedSource)
    ) {
      this.#hasRenderedOnce = false
    }
    this.#lastRequestedSource = snapshot.source
    return {
      ...snapshot,
      allowPrefix: !this.#hasRenderedOnce,
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
    const delay = force || !this.#pendingJob.snapshot.progressive
      ? 0
      : Math.max(0, this.options.getDebounceMs())
    this.#renderTimer = setTimeout(() => {
      this.#renderTimer = undefined
      void this.#drain()
    }, delay)
  }

  #schedulePending(): void {
    this.#scheduleDrain(this.#pendingJob?.force ?? false)
  }

  #isCurrent(job: MermaidRenderJob): boolean {
    return this.#mounted
      && job.generation === this.#generation
      && this.options.getActive()
  }

  #drain = async (): Promise<void> => {
    if (this.#active || !this.#pendingJob || !this.#mounted)
      return
    const job = this.#pendingJob
    this.#pendingJob = null
    this.#active = true
    this.#activeGeneration = job.generation
    this.#activeSignature = job.snapshot.signature
    this.rendering = true
    if (!job.snapshot.progressive)
      this.renderError = ''

    try {
      const cached = this.#svgByProfile.get(job.snapshot.profileKey)
      if (
        job.snapshot.progressive
        && (
          this.#renderedCodeByProfile.get(job.snapshot.profileKey)
          === job.snapshot.normalizedSource
        )
        && cached
      ) {
        if (this.#isCurrent(job)) {
          this.svgMarkup = cached
          this.renderError = ''
          this.#lastCompletedSignature = job.snapshot.signature
        }
        return
      }

      const result = await renderMermaidSvg(job.snapshot)
      if (!this.#isCurrent(job))
        return
      if (result.kind === 'incomplete') {
        this.renderError = ''
        this.#lastMissSignature = job.snapshot.signature
        this.#lastCompletedSignature = job.snapshot.signature
        if (cached)
          this.svgMarkup = cached
        return
      }

      this.svgMarkup = result.svgMarkup
      this.#bindFunctions = result.bindFunctions
      this.interactionVersion += 1
      this.renderError = ''
      this.#lastMissSignature = ''
      this.#lastCompletedSignature = job.snapshot.signature
      if (result.fullRender) {
        this.#hasRenderedOnce = true
        this.#renderedCodeByProfile.set(
          job.snapshot.profileKey,
          job.snapshot.normalizedSource,
        )
        this.#svgByProfile.set(job.snapshot.profileKey, result.svgMarkup)
      }
    }
    catch (error) {
      if (!this.#isCurrent(job))
        return
      if (job.snapshot.progressive) {
        this.renderError = ''
        this.#lastMissSignature = job.snapshot.signature
        this.#lastCompletedSignature = job.snapshot.signature
        const cached = this.#svgByProfile.get(job.snapshot.profileKey)
        if (cached)
          this.svgMarkup = cached
      }
      else {
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

  requestRender = (
    force = false,
    snapshot = this.#createSnapshot(),
  ): void => {
    if (!this.#mounted || !this.options.getActive())
      return
    if (!snapshot.source.trim()) {
      this.clear()
      return
    }
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
      && (
        this.svgMarkup
        || this.renderError
        || this.#lastMissSignature === snapshot.signature
      )
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

  suspend = (): void => {
    this.#generation += 1
    this.#pendingJob = null
    this.#activeSignature = ''
    this.rendering = false
    this.#clearTimer()
  }

  clear = (): void => {
    this.suspend()
    this.svgMarkup = ''
    this.renderError = ''
    this.#lastRequestedSource = ''
    this.#lastCompletedSignature = ''
    this.#lastMissSignature = ''
    this.#hasRenderedOnce = false
    this.#renderedCodeByProfile.clear()
    this.#svgByProfile.clear()
    this.#bindFunctions = null
    this.#boundInteractionVersions = new WeakMap()
  }

  bindInteractions = (element: Element | null | undefined): void => {
    if (
      !element?.querySelector('svg')
      || this.#boundInteractionVersions.get(element) === this.interactionVersion
    ) {
      return
    }
    try {
      this.#bindFunctions?.(element)
      this.#boundInteractionVersions.set(element, this.interactionVersion)
    }
    catch {
      // Mermaid interactions are optional.
    }
  }
}
