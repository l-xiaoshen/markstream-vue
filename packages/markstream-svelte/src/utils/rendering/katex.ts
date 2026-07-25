import type { KatexModule } from '../../optional/katex'
import type { BackpressureOptions } from '../../workers/katexWorkerTypes'
import { katexRuntime } from '../../optional/katex'
import {
  renderKaTeXWithBackpressure,
  setKaTeXCache,
} from '../../workers/katexWorkerRuntime'
import { normalizeKaTeXRenderInput } from '../normalizeKaTeXRenderInput'
import { readProperty } from '../runtimeValue'

export interface KatexRenderDependencies {
  getRenderer?: () => Promise<Pick<KatexModule, 'renderToString'> | null>
  renderInWorker?: (
    content: string,
    displayMode: boolean,
    options: BackpressureOptions,
  ) => Promise<string>
  setCache?: (content: string, displayMode: boolean, html: string) => void
}

export interface KatexRenderRequest extends BackpressureOptions {
  displayMode: boolean
  source: string
  throwOnError: boolean
}

export function shouldFallbackKatexToMainThread(error: unknown): boolean {
  const code = String(readProperty(error, 'code') ?? readProperty(error, 'name') ?? '')
  return code === 'WORKER_INIT_ERROR'
    || code === 'WORKER_BUSY'
    || code === 'WORKER_TIMEOUT'
    || readProperty(error, 'fallbackToRenderer') === true
}

export async function renderKatexMarkup(
  request: KatexRenderRequest,
  dependencies: KatexRenderDependencies = {},
): Promise<string> {
  const content = normalizeKaTeXRenderInput(request.source)
  if (!content)
    return ''

  const renderInWorker = dependencies.renderInWorker ?? renderKaTeXWithBackpressure
  try {
    const workerHtml = await renderInWorker(content, request.displayMode, {
      ...(request.timeout === undefined ? {} : { timeout: request.timeout }),
      ...(request.waitTimeout === undefined ? {} : { waitTimeout: request.waitTimeout }),
      ...(request.backoffMs === undefined ? {} : { backoffMs: request.backoffMs }),
      ...(request.maxRetries === undefined ? {} : { maxRetries: request.maxRetries }),
      ...(request.signal === undefined ? {} : { signal: request.signal }),
    })
    if (workerHtml)
      return workerHtml
  }
  catch (error) {
    if (!shouldFallbackKatexToMainThread(error))
      throw error
  }

  const renderer = await (dependencies.getRenderer ?? katexRuntime.get)()
  if (!renderer)
    throw new Error('KaTeX renderer is not available.')

  const html = renderer.renderToString(content, {
    displayMode: request.displayMode,
    throwOnError: request.throwOnError,
  })
  const rememberCache = dependencies.setCache
    ?? (dependencies.renderInWorker ? undefined : setKaTeXCache)
  rememberCache?.(content, request.displayMode, html)
  return html
}
