import type {
  MermaidWorkerAction,
  MermaidWorkerInitRequest,
  MermaidWorkerPayload,
  MermaidWorkerRequest,
  MermaidWorkerTheme,
  WorkerLoad,
} from '../types/runtimeWorkers'
import type { MermaidWorkerResult } from './internal/mermaidPendingRequests'
import { mermaidRuntime } from '../optional/mermaid'
import {
  FeatureDisabledError,
  WorkerBusyError,
  WorkerInitError,
  WorkerLifecycleError,
  WorkerProtocolError,
} from '../types/runtimeErrors'
import { createMermaidPendingRequests } from './internal/mermaidPendingRequests'
import { isMermaidWorkerResponse } from './internal/workerProtocol'

export interface MermaidWorkerClientOptions {
  isEnabled?: () => boolean
  maxConcurrency?: number
}

export interface MermaidWorkerClient {
  canParse: (code: string, theme: MermaidWorkerTheme, timeout?: number) => Promise<boolean>
  clearWorker: () => void
  findPrefix: (code: string, theme: MermaidWorkerTheme, timeout?: number) => Promise<string | null>
  getLoad: () => WorkerLoad
  setDebug: (enabled: boolean) => void
  setMaxConcurrency: (value: number) => void
  setWorker: (worker: Worker) => void
}

export function createMermaidWorkerClient(
  options: MermaidWorkerClientOptions = {},
): MermaidWorkerClient {
  const checkEnabled = options.isEnabled ?? mermaidRuntime.isEnabled
  const state: {
    debug: boolean
    maxConcurrency: number
    nextRequestId: number
    worker: Worker | null
    workerInitError: WorkerInitError | null
  } = {
    debug: false,
    maxConcurrency: options.maxConcurrency ?? 5,
    nextRequestId: 0,
    worker: null,
    workerInitError: null,
  }
  const pending = createMermaidPendingRequests()

  function ensureWorker() {
    if (state.worker)
      return state.worker

    state.workerInitError = new WorkerInitError(
      '[markstream-svelte:mermaidWorkerClient] No worker instance set. Please inject a Worker via setMermaidWorker().',
    )
    return null
  }

  function setWorker(nextWorker: Worker) {
    state.worker = nextWorker
    state.workerInitError = null
    const current = nextWorker

    current.onmessage = (event: MessageEvent<unknown>) => {
      if (state.worker !== current)
        return

      const response = event.data
      if (!isMermaidWorkerResponse(response))
        return
      const expectedAction = pending.actionFor(response.id)
      if (!expectedAction)
        return
      if (response.action !== expectedAction) {
        pending.reject(response.id, new WorkerProtocolError(
          `Worker responded with action "${response.action}" for "${expectedAction}" request`,
        ))
        return
      }
      if (response.type === 'error') {
        pending.reject(response.id, new WorkerLifecycleError(
          'MermaidWorkerError',
          'WORKER_ERROR',
          response.error,
        ))
        return
      }
      pending.resolve(response.id, response.result)
    }

    current.onerror = (event: ErrorEvent) => {
      if (state.worker !== current)
        return
      if (pending.size === 0) {
        console.debug?.(
          '[markstream-svelte:mermaidWorkerClient] Worker error (idle):',
          event.message || event,
        )
        return
      }
      try {
        const method = state.debug ? console.error : console.debug
        method?.(
          '[markstream-svelte:mermaidWorkerClient] Worker error:',
          event.message || event,
        )
      }
      catch {
        // Ignore logging failures.
      }
      pending.rejectAll(new WorkerLifecycleError(
        'WorkerError',
        'WORKER_ERROR',
        `Worker error: ${event.message}`,
      ))
    }

    current.onmessageerror = (event: MessageEvent<unknown>) => {
      if (state.worker !== current)
        return
      if (pending.size === 0) {
        console.debug?.(
          '[markstream-svelte:mermaidWorkerClient] Worker messageerror (idle):',
          event,
        )
        return
      }
      pending.rejectAll(new WorkerLifecycleError(
        'WorkerMessageError',
        'WORKER_MESSAGE_ERROR',
        'Worker messageerror',
      ))
    }

    if (state.debug) {
      const request: MermaidWorkerInitRequest = { type: 'init', debug: true }
      current.postMessage(request)
    }
  }

  function clearWorker() {
    try {
      state.worker?.terminate()
    }
    finally {
      state.worker = null
      state.workerInitError = null
      pending.rejectAll(new WorkerLifecycleError(
        'WorkerCleared',
        'WORKER_CLEARED',
        'Worker cleared',
      ))
    }
  }

  function callWorker(
    action: MermaidWorkerAction,
    payload: MermaidWorkerPayload,
    timeout = 1400,
  ): Promise<MermaidWorkerResult> {
    if (!checkEnabled())
      return Promise.reject(new FeatureDisabledError('MermaidDisabled', 'MERMAID_DISABLED', 'Mermaid'))
    if (state.workerInitError)
      return Promise.reject(state.workerInitError)

    const activeWorker = ensureWorker()
    if (!activeWorker)
      return Promise.reject(state.workerInitError)
    if (pending.size >= state.maxConcurrency)
      return Promise.reject(new WorkerBusyError(pending.size, state.maxConcurrency))

    state.nextRequestId += 1
    const id = `mermaid-${state.nextRequestId}`
    const result = pending.start(id, action, timeout)
    const request: MermaidWorkerRequest = { type: 'request', action, id, payload }
    try {
      activeWorker.postMessage(request)
    }
    catch (error: unknown) {
      pending.reject(id, error)
    }
    return result
  }

  return {
    canParse: async (code, theme, timeout = 1400) => {
      const result = await callWorker('canParse', { code, theme }, timeout)
      if (typeof result !== 'boolean')
        throw new WorkerProtocolError('Mermaid canParse worker returned a non-boolean result')
      return result
    },
    clearWorker,
    findPrefix: async (code, theme, timeout = 1400) => {
      const result = await callWorker('findPrefix', { code, theme }, timeout)
      if (result !== null && typeof result !== 'string')
        throw new WorkerProtocolError('Mermaid findPrefix worker returned an invalid result')
      return result
    },
    getLoad: () => ({
      inFlight: pending.size,
      max: state.maxConcurrency,
    }),
    setDebug: (enabled) => {
      state.debug = enabled
      if (state.worker) {
        const request: MermaidWorkerInitRequest = { type: 'init', debug: enabled }
        state.worker.postMessage(request)
      }
    },
    setMaxConcurrency: (value) => {
      if (Number.isFinite(value) && value > 0)
        state.maxConcurrency = Math.floor(value)
    },
    setWorker,
  }
}
