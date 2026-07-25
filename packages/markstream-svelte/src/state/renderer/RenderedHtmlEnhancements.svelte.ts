import type {
  EnhanceRenderedHtmlOptions,
  RenderedHtmlEnhancementHandle,
} from '../../enhanceRenderedHtml'
import { onDestroy, tick, untrack } from 'svelte'
import {
  disposeRenderedHtmlEnhancements,
  enhanceRenderedHtml,
} from '../../enhanceRenderedHtml'

interface RenderedHtmlEnhancementInput {
  enabled?: boolean
  options: EnhanceRenderedHtmlOptions
  revision?: number
}

interface EnhancementJob {
  generation: number
  input: RenderedHtmlEnhancementInput
}

export class RenderedHtmlEnhancements {
  #generation = 0
  #handle: RenderedHtmlEnhancementHandle | null = null
  #pendingJob: EnhancementJob | null = null
  #refreshTimer: ReturnType<typeof setTimeout> | undefined
  #refreshing = false
  #root: HTMLElement | null = null

  attachment(element: HTMLElement) {
    this.#root = element
    const input = untrack(this.getInput)
    if (input.enabled !== false)
      this.#schedule(input)
    return () => {
      if (this.#root !== element)
        return
      this.#stop()
      disposeRenderedHtmlEnhancements(element)
      this.#root = null
    }
  }

  constructor(
    private readonly getInput: () => RenderedHtmlEnhancementInput,
  ) {
    $effect(() => {
      const input = this.getInput()
      untrack(() => {
        if (input.enabled === false) {
          this.#stop()
          return
        }
        this.#schedule(input)
      })
    })

    onDestroy(() => {
      const root = this.#root
      this.#stop()
      disposeRenderedHtmlEnhancements(root)
      this.#root = null
    })
  }

  #clearTimer(): void {
    if (this.#refreshTimer === undefined)
      return
    clearTimeout(this.#refreshTimer)
    this.#refreshTimer = undefined
  }

  #stop(): void {
    this.#generation += 1
    this.#pendingJob = null
    this.#clearTimer()
    this.#handle?.dispose()
    this.#handle = null
  }

  #schedule(input: RenderedHtmlEnhancementInput): void {
    const generation = ++this.#generation
    this.#pendingJob = { generation, input }
    this.#armTimer()
  }

  #armTimer(): void {
    if (this.#refreshing || this.#refreshTimer !== undefined || !this.#pendingJob)
      return

    const delay = this.#pendingJob.input.options.final === false ? 100 : 0
    this.#refreshTimer = setTimeout(() => {
      this.#refreshTimer = undefined
      void this.#drain()
    }, delay)
  }

  async #drain(): Promise<void> {
    if (this.#refreshing || !this.#pendingJob)
      return

    const job = this.#pendingJob
    this.#pendingJob = null
    this.#refreshing = true
    try {
      await this.#refresh(job)
    }
    catch (error) {
      if (job.generation === this.#generation)
        console.warn('[markstream-svelte] Failed to enhance rendered HTML.', error)
    }
    finally {
      this.#refreshing = false
      this.#armTimer()
    }
  }

  async #refresh(job: EnhancementJob): Promise<void> {
    const root = this.#root
    if (!root || typeof window === 'undefined')
      return

    await tick()
    if (job.generation !== this.#generation || root !== this.#root)
      return

    this.#handle?.dispose()
    const nextHandle = await enhanceRenderedHtml(root, {
      ...job.input.options,
      isCancelled: () => job.generation !== this.#generation,
    })
    if (job.generation !== this.#generation || root !== this.#root) {
      nextHandle.dispose()
      return
    }
    this.#handle = nextHandle
  }
}
