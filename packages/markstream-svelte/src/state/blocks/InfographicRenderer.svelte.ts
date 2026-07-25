import type { Attachment } from 'svelte/attachments'
import type { InfographicInstance } from '../../optional/infographic'
import { onDestroy, onMount, tick, untrack } from 'svelte'
import { infographicRuntime } from '../../optional/infographic'
import { toSafeSvgMarkup } from '../../sanitizeSvg'
import { renderInfographicSource } from '../../utils/rendering/infographic'
import { clearElement } from '../../utils/richBlockDom'

interface InfographicSnapshot {
  host: HTMLDivElement
  progressive: boolean
  signature: string
  source: string
}

interface InfographicJob {
  force: boolean
  generation: number
  snapshot: InfographicSnapshot
}

interface InfographicRendererOptions {
  getActive: () => boolean
  getDebounceMs: () => number
  getFinal: () => boolean
  getIsDark: () => boolean
  getProgressive: () => boolean
  getSource: () => string
}

export class InfographicRenderer {
  renderError = $state('')
  rendering = $state(false)
  hasPreview = $state(false)
  markup = $state('')

  #active = false
  #activeGeneration = 0
  #activeSignature = ''
  #generation = 0
  #instance: InfographicInstance | null = null
  #lastCompletedSignature = ''
  #lastSuppressedSignature = ''
  #mounted = false
  #pendingJob: InfographicJob | null = null
  #renderHost = $state.raw<HTMLDivElement | null>(null)
  #renderTimer: ReturnType<typeof setTimeout> | undefined

  attachment: Attachment<HTMLDivElement> = (element) => {
    this.#renderHost = element
    return () => {
      if (this.#renderHost !== element)
        return
      this.reset()
      this.#renderHost = null
    }
  }

  constructor(private readonly options: InfographicRendererOptions) {
    $effect(() => {
      const snapshot = this.#createSnapshot()
      const active = this.options.getActive()
      untrack(() => {
        if (!this.#mounted)
          return
        if (!snapshot || !snapshot.source.trim()) {
          this.reset()
          return
        }
        if (!active) {
          this.suspend()
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
      this.reset()
    })
  }

  #createSnapshot(): InfographicSnapshot | null {
    if (!this.#renderHost)
      return null
    const source = this.options.getSource()
    const progressive = this.options.getProgressive()
    return {
      host: this.#renderHost,
      progressive,
      signature: [
        source,
        this.options.getIsDark(),
        this.options.getFinal(),
        progressive,
      ].join('\n'),
      source,
    }
  }

  #destroyInstance(target = this.#instance): void {
    try {
      target?.destroy()
    }
    catch {
      // Optional renderer cleanup is best effort.
    }
    if (target === this.#instance)
      this.#instance = null
  }

  #clearTimer(): void {
    if (this.#renderTimer !== undefined)
      clearTimeout(this.#renderTimer)
    this.#renderTimer = undefined
  }

  #scheduleDrain(force = false): void {
    if (this.#active || this.#renderTimer !== undefined || !this.#pendingJob)
      return
    const delayMs = force || !this.#pendingJob.snapshot.progressive
      ? 0
      : Math.max(0, this.options.getDebounceMs())
    this.#renderTimer = setTimeout(() => {
      this.#renderTimer = undefined
      void this.#drain()
    }, delayMs)
  }

  #schedulePending(): void {
    this.#scheduleDrain(this.#pendingJob?.force ?? false)
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

    const previousMarkup = job.snapshot.host.innerHTML
    const hadPreview = this.hasPreview
    let created: InfographicInstance | null = null
    try {
      const Renderer = await infographicRuntime.get()
      if (!Renderer)
        throw new Error('Infographic renderer is not available.')
      if (
        !this.#mounted
        || job.generation !== this.#generation
        || job.snapshot.host !== this.#renderHost
      ) {
        return
      }

      this.#destroyInstance()
      created = renderInfographicSource({
        container: job.snapshot.host,
        renderer: Renderer,
        source: job.snapshot.source,
      })
      this.#instance = created
      await tick()
      if (
        !this.#mounted
        || job.generation !== this.#generation
        || job.snapshot.host !== this.#renderHost
        || !this.options.getActive()
      ) {
        this.#destroyInstance(created)
        return
      }
      if (!job.snapshot.host.querySelector('svg') && !job.snapshot.host.childElementCount)
        throw new Error('Infographic render returned empty output.')

      this.hasPreview = true
      this.markup = job.snapshot.host.innerHTML
      this.renderError = ''
      this.#lastCompletedSignature = job.snapshot.signature
      this.#lastSuppressedSignature = ''
    }
    catch (error) {
      if (!this.#mounted || job.generation !== this.#generation)
        return
      this.#lastCompletedSignature = ''
      this.#destroyInstance(created)
      clearElement(job.snapshot.host)
      if (job.snapshot.progressive) {
        this.#lastSuppressedSignature = job.snapshot.signature
        if (hadPreview && previousMarkup) {
          job.snapshot.host.innerHTML = previousMarkup
          this.hasPreview = true
          this.markup = previousMarkup
        }
      }
      else {
        this.#lastSuppressedSignature = ''
        this.hasPreview = false
        this.markup = ''
        this.renderError = error instanceof Error ? error.message : String(error)
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
    if (!this.#mounted || !this.options.getActive() || !snapshot || !snapshot.source.trim())
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
      && (
        (snapshot.signature === this.#lastCompletedSignature && this.hasPreview)
        || snapshot.signature === this.#lastSuppressedSignature
      )
      && !this.#active
    ) {
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

  reset = (): void => {
    this.suspend()
    this.#destroyInstance()
    clearElement(this.#renderHost)
    this.hasPreview = false
    this.markup = ''
    this.renderError = ''
    this.#lastCompletedSignature = ''
    this.#lastSuppressedSignature = ''
  }

  getRenderedSvg = (): string => {
    const svg = this.#renderHost?.querySelector('svg')
    return svg ? toSafeSvgMarkup(svg.outerHTML) : ''
  }
}
