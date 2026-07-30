import type { KatexOptions } from 'katex'
import type { KaTeXWorkerInitRequest } from '../types/runtimeWorkers'
import {
  createModuleWorkerFromSource,
  stringifyForWorker,
  WORKER_ERROR_MESSAGE_SOURCE,
} from './internal/cdnWorker'

export type KaTeXCDNWorkerMode = 'module'

export interface KaTeXCDNWorkerOptions {
  katexUrl: string
  mhchemUrl?: string
  mode?: KaTeXCDNWorkerMode
  debug?: boolean
  workerOptions?: WorkerOptions
  renderOptions?: Pick<KatexOptions, 'output' | 'strict' | 'throwOnError'>
}

export interface KaTeXCDNWorkerHandle {
  worker: Worker | null
  dispose: () => void
  source: string
}

export function buildKaTeXCDNWorkerSource(options: KaTeXCDNWorkerOptions): string {
  const renderOptions: KatexOptions = {
    throwOnError: true,
    displayMode: true,
    output: 'html',
    strict: 'ignore',
    ...(options.renderOptions || {}),
  }

  const renderOptionsLiteral = stringifyForWorker(renderOptions)
  const katexUrlLiteral = stringifyForWorker(options.katexUrl)
  const mhchemUrlLiteral = options.mhchemUrl ? stringifyForWorker(options.mhchemUrl) : '""'

  return `
const state = {
  debug: false,
  katex: null,
  loadError: null,
  loadPromise: null,
}

function normalizeKaTeX(mod) {
  const resolved = mod?.default ?? mod
  if (resolved && typeof resolved.renderToString === 'function')
    return resolved
  return null
}

${WORKER_ERROR_MESSAGE_SOURCE}

async function loadKaTeX() {
  if (state.katex || state.loadError)
    return
  if (!state.loadPromise) {
    state.loadPromise = (async () => {
      try {
        const mod = await import(${katexUrlLiteral})
        state.katex = normalizeKaTeX(mod)
        const mhchemUrl = ${mhchemUrlLiteral}
        if (mhchemUrl) {
          try {
            await import(mhchemUrl)
          }
          catch (error) {
            if (state.debug)
              console.warn('[markstream-svelte:katex-cdn-worker] failed to load mhchem', error)
          }
        }
      }
      catch (error) {
        state.loadError = error
      }
    })()
  }
  await state.loadPromise
}

self.addEventListener('message', async (event) => {
  const request = event.data
  if (request.type === 'init') {
    state.debug = request.debug
    return
  }
  if (request.type !== 'render')
    return

  await loadKaTeX()

  if (!state.katex) {
    const error = state.loadError
      ? errorMessage(state.loadError)
      : 'KaTeX is not available in worker'
    self.postMessage({
      type: 'render-error',
      id: request.id,
      error,
      content: request.content,
      displayMode: request.displayMode,
    })
    return
  }

  try {
    const opts = ${renderOptionsLiteral}
    const html = state.katex.renderToString(request.content, {
      ...opts,
      displayMode: request.displayMode,
    })
    self.postMessage({
      type: 'rendered',
      id: request.id,
      html,
      content: request.content,
      displayMode: request.displayMode,
    })
  }
  catch (error) {
    self.postMessage({
      type: 'render-error',
      id: request.id,
      error: errorMessage(error),
      content: request.content,
      displayMode: request.displayMode,
    })
  }
})
`.trimStart()
}

export function createKaTeXWorkerFromCDN(options: KaTeXCDNWorkerOptions): KaTeXCDNWorkerHandle {
  const source = buildKaTeXCDNWorkerSource(options)
  const initRequest: KaTeXWorkerInitRequest | undefined = options.debug
    ? { type: 'init', debug: true }
    : undefined
  return createModuleWorkerFromSource(source, options.workerOptions, initRequest)
}
