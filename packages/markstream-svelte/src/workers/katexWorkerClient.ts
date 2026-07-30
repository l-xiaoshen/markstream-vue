import type {
  KaTeXWorkerInitRequest,
  KaTeXWorkerRenderRequest,
  KaTeXWorkerResponse,
  WorkerLoad,
} from '../types/runtimeWorkers'
import type {
  BackpressureOptions,
  KaTeXBackpressureDefaults,
  KaTeXWorkerClientOptions,
} from './katexWorkerTypes'
import { isCompatibleKatexEnabled } from '../optional/legacyState'
import {
  AbortRuntimeError,
  FeatureDisabledError,
  isRuntimeErrorCode,
  WorkerBusyError,
  WorkerInitError,
  WorkerLifecycleError,
} from '../types/runtimeErrors'
import { normalizeKaTeXRenderInput } from '../utils/normalizeKaTeXRenderInput'
import { createKaTeXBackpressureController } from './internal/katexBackpressure'
import { createKaTeXPendingRequests } from './internal/katexPendingRequests'
import { createKaTeXRenderCache } from './internal/katexRenderCache'

export interface KaTeXWorkerClient {
  clearWorker: () => void
  getBackpressureDefaults: () => KaTeXBackpressureDefaults
  getLoad: () => WorkerLoad
  isBusy: () => boolean
  render: (content: string, displayMode?: boolean, timeout?: number, signal?: AbortSignal) => Promise<string>
  renderWithBackpressure: (content: string, displayMode?: boolean, options?: BackpressureOptions) => Promise<string>
  setBackpressureDefaults: (options: Partial<KaTeXBackpressureDefaults>) => void
  setCache: (content: string, displayMode: boolean, html: string) => void
  setDebug: (enabled: boolean) => void
  setMaxConcurrency: (value: number) => void
  setWorker: (worker: Worker) => void
  waitForSlot: (timeout?: number, signal?: AbortSignal) => Promise<void>
}

export function createKaTeXWorkerClient(
  options: KaTeXWorkerClientOptions = {},
): KaTeXWorkerClient {
  const cacheMax = options.cacheMax ?? 200
  const checkEnabled = options.isEnabled ?? isCompatibleKatexEnabled
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
  const cache = createKaTeXRenderCache(cacheMax)
  let notifySlotAvailable = () => {}
  const pending = createKaTeXPendingRequests(
    () => notifySlotAvailable(),
  )
  const backpressure = createKaTeXBackpressureController(
    () => pending.size < state.maxConcurrency,
  )
  notifySlotAvailable = backpressure.notifyIfSlotAvailable

  function ensureWorker() {
    if (state.worker)
      return state.worker

    state.workerInitError = new WorkerInitError(
      '[markstream-svelte:katexWorkerClient] No worker instance set. Please inject a Worker via setKaTeXWorker().',
    )
    return null
  }

  function setWorker(nextWorker: Worker) {
    state.worker = nextWorker
    state.workerInitError = null
    const current = nextWorker

    current.onmessage = (event: MessageEvent<KaTeXWorkerResponse>) => {
      if (state.worker !== current)
        return

      const response = event.data
      if (response.type === 'worker-error') {
        pending.rejectAll(new WorkerLifecycleError(
          'WorkerError',
          'WORKER_ERROR',
          response.error,
        ))
        return
      }

      if (response.type === 'render-error') {
        pending.reject(response.id, new WorkerLifecycleError(
          'KaTeXWorkerRenderError',
          'WORKER_ERROR',
          response.error,
        ))
        return
      }

      if (!pending.resolve(response.id, response.html))
        return
      cache.set(response.content, response.displayMode, response.html)
    }

    current.onerror = (event: ErrorEvent) => {
      if (state.worker !== current)
        return
      pending.rejectAll(new WorkerLifecycleError(
        'WorkerError',
        'WORKER_ERROR',
        `Worker error: ${event.message}`,
      ))
    }

    current.onmessageerror = () => {
      if (state.worker !== current)
        return
      pending.rejectAll(new WorkerLifecycleError(
        'WorkerMessageError',
        'WORKER_MESSAGE_ERROR',
        'Worker messageerror',
      ))
    }

    if (state.debug) {
      const request: KaTeXWorkerInitRequest = { type: 'init', debug: true }
      current.postMessage(request)
    }
  }

  function clearWorker() {
    state.worker?.terminate()
    state.worker = null
    state.workerInitError = null
    pending.rejectAll(new WorkerLifecycleError(
      'WorkerCleared',
      'WORKER_CLEARED',
      'Worker cleared',
    ))
  }

  async function render(
    content: string,
    displayMode = true,
    timeout = 2000,
    signal?: AbortSignal,
  ): Promise<string> {
    if (!checkEnabled())
      throw new FeatureDisabledError('KaTeXDisabled', 'KATEX_DISABLED', 'KaTeX')
    if (state.workerInitError)
      throw state.workerInitError
    if (signal?.aborted)
      throw new AbortRuntimeError()

    const normalizedContent = normalizeKaTeXRenderInput(content)
    const cached = cache.get(normalizedContent, displayMode)
    if (cached !== undefined)
      return cached

    const activeWorker = ensureWorker()
    if (!activeWorker)
      throw state.workerInitError
    if (pending.size >= state.maxConcurrency)
      throw new WorkerBusyError(pending.size, state.maxConcurrency)

    state.nextRequestId += 1
    const id = `katex-${state.nextRequestId}`
    const result = pending.start(id, timeout, signal)
    const request: KaTeXWorkerRenderRequest = {
      type: 'render',
      id,
      content: normalizedContent,
      displayMode,
    }
    try {
      activeWorker.postMessage(request)
    }
    catch (error: unknown) {
      pending.reject(id, error)
    }
    return await result
  }

  const waitForSlot = backpressure.waitForSlot
  const setBackpressureDefaults = backpressure.setDefaults

  async function renderWithBackpressure(
    content: string,
    displayMode = true,
    renderOptions: BackpressureOptions = {},
  ): Promise<string> {
    if (!checkEnabled())
      throw new FeatureDisabledError('KaTeXDisabled', 'KATEX_DISABLED', 'KaTeX')

    const {
      backoffMs,
      maxRetries,
      signal,
      timeout,
      waitTimeout,
    } = backpressure.resolveOptions(renderOptions)

    let attempt = 0
    for (;;) {
      if (signal?.aborted)
        throw new AbortRuntimeError()

      try {
        return await render(content, displayMode, timeout, signal)
      }
      catch (error: unknown) {
        if (!isRuntimeErrorCode(error, 'WORKER_BUSY') || attempt >= maxRetries)
          throw error

        attempt += 1
        await waitForSlot(waitTimeout, signal).catch(() => {})
        if (backoffMs > 0)
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempt))
      }
    }
  }

  return {
    clearWorker,
    getBackpressureDefaults: backpressure.getDefaults,
    getLoad: () => ({
      inFlight: pending.size,
      max: state.maxConcurrency,
    }),
    isBusy: () => pending.size >= state.maxConcurrency,
    render,
    renderWithBackpressure,
    setBackpressureDefaults,
    setCache: (content, displayMode, html) => {
      cache.set(normalizeKaTeXRenderInput(content), displayMode, html)
    },
    setDebug: (enabled) => {
      state.debug = enabled
      if (state.worker) {
        const request: KaTeXWorkerInitRequest = { type: 'init', debug: enabled }
        state.worker.postMessage(request)
      }
    },
    setMaxConcurrency: (value) => {
      if (Number.isFinite(value) && value > 0) {
        state.maxConcurrency = Math.floor(value)
        backpressure.notifyIfSlotAvailable()
      }
    },
    setWorker,
    waitForSlot,
  }
}
