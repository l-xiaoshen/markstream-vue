import {
  AbortRuntimeError,
  WorkerTimeoutError,
} from '../../types/runtimeErrors'

interface PendingKaTeXRender {
  reject: (error: unknown) => void
  resolve: (html: string) => void
  signal: AbortSignal | undefined
  timeoutId: ReturnType<typeof setTimeout>
  onAbort: () => void
}

export interface KaTeXPendingRequests {
  readonly size: number
  reject: (id: string, error: unknown) => boolean
  rejectAll: (error: unknown) => void
  resolve: (id: string, html: string) => boolean
  start: (id: string, timeout: number, signal?: AbortSignal) => Promise<string>
}

export function createKaTeXPendingRequests(
  onSettled: () => void,
): KaTeXPendingRequests {
  const pending = new Map<string, PendingKaTeXRender>()

  function cleanup(active: PendingKaTeXRender) {
    clearTimeout(active.timeoutId)
    active.signal?.removeEventListener('abort', active.onAbort)
  }

  function take(id: string): PendingKaTeXRender | null {
    const active = pending.get(id)
    if (!active)
      return null

    pending.delete(id)
    cleanup(active)
    onSettled()
    return active
  }

  function reject(id: string, error: unknown) {
    const active = take(id)
    if (!active)
      return false
    active.reject(error)
    return true
  }

  function resolve(id: string, html: string) {
    const active = take(id)
    if (!active)
      return false
    active.resolve(html)
    return true
  }

  return {
    get size() {
      return pending.size
    },
    reject,
    rejectAll: (error) => {
      const activeRequests = [...pending.values()]
      pending.clear()
      for (const active of activeRequests) {
        cleanup(active)
        active.reject(error)
      }
      onSettled()
    },
    resolve,
    start: (id, timeout, signal) => new Promise<string>((resolvePromise, rejectPromise) => {
      function onAbort() {
        reject(id, new AbortRuntimeError())
      }
      const timeoutId = setTimeout(() => {
        reject(id, new WorkerTimeoutError('Worker render timed out'))
      }, timeout)

      pending.set(id, {
        reject: rejectPromise,
        resolve: resolvePromise,
        signal,
        timeoutId,
        onAbort,
      })

      if (signal?.aborted)
        onAbort()
      else
        signal?.addEventListener('abort', onAbort, { once: true })
    }),
  }
}
