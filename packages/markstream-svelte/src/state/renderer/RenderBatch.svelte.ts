import { onDestroy, untrack } from 'svelte'

interface RenderBatchOptions {
  enabled: boolean
  final: boolean | undefined
  initialSize: number
  size: number
  delayMs: number
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback
}

function getInitialCount(total: number, options: RenderBatchOptions): number {
  const initialSize = Math.min(total, positiveInteger(options.initialSize, 40))
  return options.enabled && options.final !== false && total > initialSize
    ? initialSize
    : total
}

export class RenderBatch {
  count = $state(0)

  #timer: ReturnType<typeof setTimeout> | undefined
  #frame: number | undefined
  #generation = 0

  constructor(
    private readonly getTotal: () => number,
    private readonly getOptions: () => RenderBatchOptions,
  ) {
    this.count = getInitialCount(
      Math.max(0, untrack(this.getTotal)),
      untrack(this.getOptions),
    )

    $effect(() => {
      const total = Math.max(0, this.getTotal())
      const options = this.getOptions()
      const initialSize = Math.min(total, positiveInteger(options.initialSize, 40))
      const batchSize = positiveInteger(options.size, 80)
      const delayMs = Math.max(0, options.delayMs)
      const shouldBatch = options.enabled && options.final !== false && total > initialSize

      untrack(() => {
        this.#cancelScheduledBatch()
        if (!shouldBatch) {
          this.count = total
          return
        }

        if (this.count <= 0 || this.count > total || this.count < initialSize)
          this.count = initialSize
        this.#scheduleNext(total, batchSize, delayMs)
      })
    })

    onDestroy(this.#cancelScheduledBatch)
  }

  #cancelScheduledBatch = (): void => {
    this.#generation += 1
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    }
    if (this.#frame !== undefined && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.#frame)
      this.#frame = undefined
    }
  }

  #scheduleNext(total: number, size: number, delayMs: number): void {
    if (this.count >= total || this.#timer !== undefined || this.#frame !== undefined)
      return

    const generation = this.#generation
    const advance = () => {
      this.#timer = undefined
      this.#frame = undefined
      if (generation !== this.#generation)
        return
      this.count = Math.min(total, this.count + size)
      this.#scheduleNext(total, size, delayMs)
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.#frame = window.requestAnimationFrame(() => {
        this.#frame = undefined
        if (delayMs > 0)
          this.#timer = setTimeout(advance, delayMs)
        else
          advance()
      })
      return
    }

    this.#timer = setTimeout(advance, delayMs)
  }

  revealAll = (): void => {
    this.#cancelScheduledBatch()
    this.count = this.getTotal()
  }
}
