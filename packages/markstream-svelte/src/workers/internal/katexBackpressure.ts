import type {
  BackpressureOptions,
  KaTeXBackpressureDefaults,
} from '../katexWorkerTypes'
import {
  AbortRuntimeError,
  WorkerBusyTimeoutError,
} from '../../types/runtimeErrors'

export interface ResolvedBackpressureOptions extends KaTeXBackpressureDefaults {
  signal: AbortSignal | undefined
}

export interface KaTeXBackpressureController {
  getDefaults: () => KaTeXBackpressureDefaults
  notifyIfSlotAvailable: () => void
  resolveOptions: (options: BackpressureOptions) => ResolvedBackpressureOptions
  setDefaults: (options: Partial<KaTeXBackpressureDefaults>) => void
  waitForSlot: (timeout?: number, signal?: AbortSignal) => Promise<void>
}

const initialDefaults: KaTeXBackpressureDefaults = {
  timeout: 2000,
  waitTimeout: 1500,
  backoffMs: 30,
  maxRetries: 1,
}
const maxBackpressureRetries = 8

export function createKaTeXBackpressureController(
  hasAvailableSlot: () => boolean,
): KaTeXBackpressureController {
  const defaults = { ...initialDefaults }
  const drainWaiters = new Set<() => void>()

  const notifyIfSlotAvailable = () => {
    if (!hasAvailableSlot() || drainWaiters.size === 0)
      return

    const waiters = [...drainWaiters]
    drainWaiters.clear()
    for (const waiter of waiters) {
      try {
        waiter()
      }
      catch {
        // One failed waiter must not prevent the remaining waiters from draining.
      }
    }
  }

  const waitForSlot = (timeout = 2000, signal?: AbortSignal): Promise<void> => {
    if (hasAvailableSlot())
      return Promise.resolve()

    return new Promise((resolve, reject) => {
      const waiterState: {
        settled: boolean
        timer: ReturnType<typeof setTimeout> | null
      } = {
        settled: false,
        timer: null,
      }
      const callbacks: {
        onAbort: () => void
        onDrain: () => void
      } = {
        onAbort: () => {},
        onDrain: () => {},
      }

      const settle = (error?: Error) => {
        if (waiterState.settled)
          return
        waiterState.settled = true
        if (waiterState.timer)
          clearTimeout(waiterState.timer)
        drainWaiters.delete(callbacks.onDrain)
        signal?.removeEventListener('abort', callbacks.onAbort)
        if (error)
          reject(error)
        else
          resolve()
      }
      callbacks.onDrain = () => settle()
      callbacks.onAbort = () => settle(new AbortRuntimeError())

      drainWaiters.add(callbacks.onDrain)
      waiterState.timer = setTimeout(
        () => settle(new WorkerBusyTimeoutError()),
        timeout,
      )
      if (signal?.aborted)
        callbacks.onAbort()
      else
        signal?.addEventListener('abort', callbacks.onAbort, { once: true })
      queueMicrotask(notifyIfSlotAvailable)
    })
  }

  return {
    getDefaults: () => ({ ...defaults }),
    notifyIfSlotAvailable,
    resolveOptions: (options) => {
      const rawMaxRetries = options.maxRetries ?? defaults.maxRetries
      const maxRetries = Number.isFinite(rawMaxRetries)
        ? Math.max(
            0,
            Math.min(
              Math.floor(rawMaxRetries),
              maxBackpressureRetries,
            ),
          )
        : defaults.maxRetries

      return {
        timeout: options.timeout ?? defaults.timeout,
        waitTimeout: options.waitTimeout ?? defaults.waitTimeout,
        backoffMs: options.backoffMs ?? defaults.backoffMs,
        maxRetries,
        signal: options.signal,
      }
    },
    setDefaults: (options) => {
      if (options.timeout != null)
        defaults.timeout = Math.max(0, Math.floor(options.timeout))
      if (options.waitTimeout != null)
        defaults.waitTimeout = Math.max(0, Math.floor(options.waitTimeout))
      if (options.backoffMs != null)
        defaults.backoffMs = Math.max(0, Math.floor(options.backoffMs))
      if (options.maxRetries != null)
        defaults.maxRetries = Math.max(0, Math.floor(options.maxRetries))
    },
    waitForSlot,
  }
}
