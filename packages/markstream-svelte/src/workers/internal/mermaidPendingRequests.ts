import type {
  MermaidWorkerAction,
  MermaidWorkerResponse,
} from '../../types/runtimeWorkers'
import { WorkerTimeoutError } from '../../types/runtimeErrors'

export type MermaidWorkerResult = Extract<
  MermaidWorkerResponse,
  { type: 'result' }
>['result']

interface PendingMermaidCall {
  action: MermaidWorkerAction
  reject: (error: unknown) => void
  resolve: (value: MermaidWorkerResult) => void
  timeoutId: ReturnType<typeof setTimeout>
}

export interface MermaidPendingRequests {
  readonly size: number
  actionFor: (id: string) => MermaidWorkerAction | null
  reject: (id: string, error: unknown) => boolean
  rejectAll: (error: unknown) => void
  resolve: (id: string, value: MermaidWorkerResult) => boolean
  start: (id: string, action: MermaidWorkerAction, timeout: number) => Promise<MermaidWorkerResult>
}

export function createMermaidPendingRequests(): MermaidPendingRequests {
  const pending = new Map<string, PendingMermaidCall>()

  const take = (id: string): PendingMermaidCall | null => {
    const active = pending.get(id)
    if (!active)
      return null
    pending.delete(id)
    clearTimeout(active.timeoutId)
    return active
  }

  const reject = (id: string, error: unknown) => {
    const active = take(id)
    if (!active)
      return false
    active.reject(error)
    return true
  }

  const resolve = (id: string, value: MermaidWorkerResult) => {
    const active = take(id)
    if (!active)
      return false
    active.resolve(value)
    return true
  }

  return {
    get size() {
      return pending.size
    },
    actionFor: id => pending.get(id)?.action ?? null,
    reject,
    rejectAll: (error) => {
      const pendingCalls = [...pending.values()]
      pending.clear()
      for (const active of pendingCalls) {
        clearTimeout(active.timeoutId)
        active.reject(error)
      }
    },
    resolve,
    start: (id, action, timeout) => new Promise((resolvePromise, rejectPromise) => {
      const timeoutId = setTimeout(
        () => reject(id, new WorkerTimeoutError()),
        timeout,
      )
      pending.set(id, {
        action,
        reject: rejectPromise,
        resolve: resolvePromise,
        timeoutId,
      })
    }),
  }
}
