import type { LegacyMermaidRenderResult } from '../../optional/legacyState'
import type {
  MermaidInitConfig,
  MermaidRenderResult,
} from '../../optional/mermaid'
import type { MermaidTheme } from '../mermaidPreview'
import { toSafeMermaidSvgMarkup } from 'stream-markdown-parser'
import { getMermaid } from '../../optional/legacy'
import {
  canParseOffthread,
  findPrefixOffthread,
} from '../../workers/mermaidWorkerRuntime'
import { getMermaidDiagramKind } from '../diagramLayout'
import {
  applyMermaidTheme,
  getSafeMermaidPrefixCandidate,
} from '../mermaidPreview'

export type MermaidBindFunctions
  = NonNullable<Exclude<MermaidRenderResult, string>['bindFunctions']>

interface MermaidRendererApi {
  parse?: ((source: string) => Promise<unknown> | unknown) | undefined
  render: (
    id: string,
    source: string,
  ) => Promise<LegacyMermaidRenderResult> | LegacyMermaidRenderResult
}

export interface MermaidRenderRequest {
  allowPrefix: boolean
  fullRenderTimeoutMs: number
  isStrict: boolean
  parseTimeoutMs: number
  progressive: boolean
  renderTimeoutMs: number
  source: string
  theme: MermaidTheme
  workerTimeoutMs: number
}

export interface MermaidRenderDependencies {
  canParse?: (
    source: string,
    theme: MermaidTheme,
    timeoutMs: number,
  ) => Promise<boolean>
  createRenderId?: (kind: 'parse' | 'render') => string
  findPrefix?: (
    source: string,
    theme: MermaidTheme,
    timeoutMs: number,
  ) => Promise<string | null>
  getRenderer?: (config: MermaidInitConfig) => Promise<MermaidRendererApi | null>
  rethrowError?: (error: unknown) => boolean
}

export type MermaidRenderPipelineResult
  = {
    bindFunctions: MermaidBindFunctions | null
    fullRender: boolean
    kind: 'rendered'
    source: string
    svgMarkup: string
  }
  | { kind: 'incomplete' }

interface MermaidParseRequest {
  dependencies: MermaidRenderDependencies
  mermaid: MermaidRendererApi
  parseTimeoutMs: number
  source: string
  theme: MermaidTheme
  workerTimeoutMs: number
}

export function createMermaidRenderId(kind: 'parse' | 'render'): string {
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `markstream-svelte-mermaid-${kind}-${token}`
}

export function withRenderTimeout<T>(
  run: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0)
    return run()

  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = globalThis.setTimeout(() => {
      if (settled)
        return
      settled = true
      reject(new Error('Operation timed out'))
    }, timeoutMs)
    run().then((value) => {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }).catch((error: unknown) => {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      reject(error)
    })
  })
}

async function canParseMermaidSource({
  dependencies,
  mermaid,
  parseTimeoutMs,
  source,
  theme,
  workerTimeoutMs,
}: MermaidParseRequest): Promise<void> {
  try {
    if (await (dependencies.canParse ?? canParseOffthread)(
      source,
      theme,
      workerTimeoutMs,
    )) {
      return
    }
  }
  catch (error) {
    if (dependencies.rethrowError?.(error))
      throw error
  }

  const themedSource = applyMermaidTheme(source, theme)
  const parse = mermaid.parse
  if (typeof parse === 'function') {
    await withRenderTimeout(
      () => Promise.resolve(parse(themedSource)).then(() => undefined),
      parseTimeoutMs,
    )
    return
  }

  const createId = dependencies.createRenderId ?? createMermaidRenderId
  await withRenderTimeout(
    () => Promise.resolve(mermaid.render(createId('parse'), themedSource)).then(() => undefined),
    parseTimeoutMs,
  )
}

async function findMermaidPrefix(
  request: MermaidParseRequest,
): Promise<string> {
  let prefix = getSafeMermaidPrefixCandidate(request.source)
  if (!prefix || prefix === request.source)
    return ''

  try {
    const workerPrefix = await (request.dependencies.findPrefix ?? findPrefixOffthread)(
      request.source,
      request.theme,
      request.workerTimeoutMs,
    )
    if (workerPrefix?.trim())
      prefix = workerPrefix.trim()
  }
  catch (error) {
    if (request.dependencies.rethrowError?.(error))
      throw error
  }
  return prefix
}

export async function resolveMermaidRenderSource(
  request: MermaidParseRequest & {
    allowPrefix: boolean
    progressive: boolean
  },
): Promise<{ fullRender: boolean, source: string } | null> {
  if (!request.progressive) {
    await canParseMermaidSource(request)
    return { fullRender: true, source: request.source }
  }

  if (getMermaidDiagramKind(request.source) === 'gantt') {
    if (!request.allowPrefix)
      return null
    const prefix = getSafeMermaidPrefixCandidate(request.source)
    if (!prefix)
      return null
    try {
      await canParseMermaidSource({ ...request, source: prefix })
      return prefix === request.source
        ? { fullRender: true, source: request.source }
        : { fullRender: false, source: prefix }
    }
    catch (error) {
      if (request.dependencies.rethrowError?.(error))
        throw error
      return null
    }
  }

  try {
    await canParseMermaidSource(request)
    return { fullRender: true, source: request.source }
  }
  catch (error) {
    if (request.dependencies.rethrowError?.(error))
      throw error
  }

  if (!request.allowPrefix)
    return null
  const prefix = await findMermaidPrefix(request)
  if (!prefix)
    return null
  try {
    await canParseMermaidSource({ ...request, source: prefix })
    return { fullRender: false, source: prefix }
  }
  catch (error) {
    if (request.dependencies.rethrowError?.(error))
      throw error
    return null
  }
}

export async function renderMermaidSvg(
  request: MermaidRenderRequest,
  dependencies: MermaidRenderDependencies = {},
): Promise<MermaidRenderPipelineResult> {
  const mermaid = await (dependencies.getRenderer ?? getMermaid)({
    startOnLoad: false,
    securityLevel: request.isStrict ? 'strict' : 'loose',
    suppressErrorRendering: true,
    ...(request.isStrict ? { flowchart: { htmlLabels: false } } : {}),
  })
  if (!mermaid)
    throw new Error('Mermaid is not available.')

  const selection = await resolveMermaidRenderSource({
    allowPrefix: request.allowPrefix,
    dependencies,
    mermaid,
    parseTimeoutMs: request.parseTimeoutMs,
    progressive: request.progressive,
    source: request.source,
    theme: request.theme,
    workerTimeoutMs: request.workerTimeoutMs,
  })
  if (!selection)
    return { kind: 'incomplete' }

  const createId = dependencies.createRenderId ?? createMermaidRenderId
  const rendered = await withRenderTimeout(
    () => Promise.resolve(mermaid.render(
      createId('render'),
      applyMermaidTheme(selection.source, request.theme),
    )),
    selection.fullRender
      ? request.fullRenderTimeoutMs
      : request.renderTimeoutMs,
  )
  const rawSvg = typeof rendered === 'string' ? rendered : rendered?.svg
  const safeSvg = toSafeMermaidSvgMarkup(rawSvg)
  if (!safeSvg)
    throw new Error('Mermaid rendered empty SVG.')

  return {
    bindFunctions: typeof rendered === 'string'
      ? null
      : rendered?.bindFunctions ?? null,
    fullRender: selection.fullRender,
    kind: 'rendered',
    source: selection.source,
    svgMarkup: safeSvg,
  }
}
