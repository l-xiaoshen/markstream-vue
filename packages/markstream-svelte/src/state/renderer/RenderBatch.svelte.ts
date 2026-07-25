import { onDestroy, untrack } from 'svelte'

interface RenderBatchOptions {
  enabled: boolean
  final: boolean | undefined
  initialSize: number
  size: number
  delayMs: number
  budgetMs: number
  idleTimeoutMs: number
}

interface IdleDeadlineLike {
  timeRemaining?: () => number
}

type IdleCallback = (deadline: IdleDeadlineLike) => void

interface IdleCallbackWindow {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: { timeout?: number },
  ) => number
  cancelIdleCallback?: (handle: number) => void
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
  #idle: number | undefined
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
      const budgetMs = Math.max(2, positiveInteger(options.budgetMs, 6))
      const idleTimeoutMs = Number.isFinite(options.idleTimeoutMs)
        ? Math.max(0, options.idleTimeoutMs)
        : 120
      const shouldBatch = options.enabled && options.final !== false && total > initialSize

      untrack(() => {
        this.#cancelScheduledBatch()
        if (!shouldBatch) {
          this.count = total
          return
        }

        if (this.count <= 0 || this.count > total || this.count < initialSize)
          this.count = initialSize
        this.#scheduleNext(total, batchSize, delayMs, budgetMs, idleTimeoutMs)
      })
    })

    onDestroy(() => this.#cancelScheduledBatch())
  }

  #cancelScheduledBatch(): void {
    this.#generation += 1
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    }
    if (this.#frame !== undefined && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.#frame)
      this.#frame = undefined
    }
    if (this.#idle !== undefined) {
      if (typeof window !== 'undefined')
        (window as unknown as IdleCallbackWindow).cancelIdleCallback?.(this.#idle)
      this.#idle = undefined
    }
  }

  #scheduleNext(
    total: number,
    size: number,
    delayMs: number,
    budgetMs: number,
    idleTimeoutMs: number,
  ): void {
    if (
      this.count >= total
      || this.#timer !== undefined
      || this.#frame !== undefined
      || this.#idle !== undefined
    ) {
      return
    }

    const generation = this.#generation
    // This timer callback needs lexical `this` when passed by reference.
    const advance = (deadline?: IdleDeadlineLike) => {
      this.#timer = undefined
      this.#frame = undefined
      this.#idle = undefined
      if (generation !== this.#generation)
        return

      let nextCount = this.count
      do {
        nextCount = Math.min(total, nextCount + size)
        if (!deadline || (deadline.timeRemaining?.() ?? 0) <= budgetMs * 0.5)
          break
      } while (nextCount < total)

      this.count = nextCount
      this.#scheduleNext(total, size, delayMs, budgetMs, idleTimeoutMs)
    }

    const browserWindow = typeof window !== 'undefined'
      ? window
      : undefined
    const idleCallbacks = browserWindow as unknown as IdleCallbackWindow | undefined
    if (idleCallbacks?.requestIdleCallback) {
      this.#idle = idleCallbacks.requestIdleCallback(advance, {
        timeout: idleTimeoutMs,
      })
      return
    }

    if (browserWindow && typeof browserWindow.requestAnimationFrame === 'function') {
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

  revealAll(): void {
    this.#cancelScheduledBatch()
    this.count = this.getTotal()
  }
}
