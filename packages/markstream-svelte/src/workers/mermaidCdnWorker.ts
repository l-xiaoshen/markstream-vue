import type { MermaidConfig } from 'mermaid'
import type { MermaidWorkerInitRequest } from '../types/runtimeWorkers'
import {
  createModuleWorkerFromSource,
  stringifyForWorker,
  WORKER_ERROR_MESSAGE_SOURCE,
} from './internal/cdnWorker'

export type MermaidCDNWorkerMode = 'module'

export interface MermaidCDNWorkerOptions {
  mermaidUrl: string
  mode?: MermaidCDNWorkerMode
  debug?: boolean
  workerOptions?: WorkerOptions
  initializeOptions?: MermaidConfig
}

export interface MermaidCDNWorkerHandle {
  worker: Worker | null
  dispose: () => void
  source: string
}

export function buildMermaidCDNWorkerSource(options: MermaidCDNWorkerOptions): string {
  const mermaidUrlLiteral = stringifyForWorker(options.mermaidUrl)
  const initializeOptions: MermaidConfig = {
    startOnLoad: false,
    securityLevel: 'strict',
    flowchart: { htmlLabels: false },
    ...(options.initializeOptions ?? {}),
  }
  const initLiteral = stringifyForWorker(initializeOptions)

  return `
const state = {
  debug: false,
  initialized: false,
  loadError: null,
  loadPromise: null,
  mermaid: null,
}

function normalizeMermaidModule(mod) {
  const candidate = mod?.default ?? mod
  if (
    candidate
    && typeof candidate.initialize === 'function'
    && typeof candidate.parse === 'function'
  ) {
    return candidate
  }
  return null
}

${WORKER_ERROR_MESSAGE_SOURCE}

function applyThemeTo(code, theme) {
  const themeValue = theme === 'dark' ? 'dark' : 'default'
  const themeConfig = \`%%{init: {"theme": "\${themeValue}"}}%%\\n\`
  const trimmed = code.trimStart()
  if (trimmed.startsWith('%%{'))
    return code
  return themeConfig + code
}

function findHeaderIndex(lines) {
  const headerRe = /^(?:graph|flowchart|flowchart\\s+tb|flowchart\\s+lr|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|pie|quadrantChart|timeline|xychart(?:-beta)?)\\b/
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line || line.startsWith('%%'))
      continue
    if (headerRe.test(line))
      return index
  }
  return -1
}

async function canParse(code, theme) {
  const themed = applyThemeTo(code, theme)
  await state.mermaid.parse(themed)
  return true
}

async function findLastRenderablePrefix(baseCode, theme) {
  const lines = baseCode.split('\\n')
  const headerIndex = findHeaderIndex(lines)
  if (headerIndex === -1)
    return null
  const head = lines.slice(0, headerIndex + 1)
  await canParse(head.join('\\n'), theme)

  let low = headerIndex + 1
  let high = lines.length
  let lastGood = headerIndex + 1
  let tries = 0
  const maxTries = 12

  while (low <= high && tries < maxTries) {
    const mid = Math.floor((low + high) / 2)
    const candidate = [...head, ...lines.slice(headerIndex + 1, mid)].join('\\n')
    tries += 1
    try {
      await canParse(candidate, theme)
      lastGood = mid
      low = mid + 1
    }
    catch {
      high = mid - 1
    }
  }

  return [...head, ...lines.slice(headerIndex + 1, lastGood)].join('\\n')
}

function initMermaidOnce() {
  if (!state.mermaid || state.initialized)
    return
  try {
    state.mermaid.initialize(${initLiteral})
    state.initialized = true
  }
  catch (error) {
    if (state.debug)
      console.warn('[markstream-svelte:mermaid-cdn-worker] initialize failed', error)
  }
}

async function loadMermaid() {
  if (state.mermaid || state.loadError)
    return
  if (!state.loadPromise) {
    state.loadPromise = (async () => {
      try {
        const mod = await import(${mermaidUrlLiteral})
        state.mermaid = normalizeMermaidModule(mod)
        initMermaidOnce()
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
  if (request.type !== 'request')
    return

  await loadMermaid()

  if (!state.mermaid) {
    const error = state.loadError
      ? errorMessage(state.loadError)
      : 'Mermaid is not available in worker'
    self.postMessage({
      type: 'error',
      action: request.action,
      id: request.id,
      ok: false,
      error,
    })
    return
  }

  try {
    if (request.action === 'canParse') {
      const result = await canParse(request.payload.code, request.payload.theme)
      self.postMessage({
        type: 'result',
        action: 'canParse',
        id: request.id,
        ok: true,
        result,
      })
      return
    }
    const result = await findLastRenderablePrefix(
      request.payload.code,
      request.payload.theme,
    )
    self.postMessage({
      type: 'result',
      action: 'findPrefix',
      id: request.id,
      ok: true,
      result,
    })
  }
  catch (error) {
    self.postMessage({
      type: 'error',
      action: request.action,
      id: request.id,
      ok: false,
      error: errorMessage(error),
    })
  }
})
`.trimStart()
}

export function createMermaidWorkerFromCDN(options: MermaidCDNWorkerOptions): MermaidCDNWorkerHandle {
  const source = buildMermaidCDNWorkerSource(options)
  const initRequest: MermaidWorkerInitRequest | undefined = options.debug
    ? { type: 'init', debug: true }
    : undefined
  return createModuleWorkerFromSource(source, options.workerOptions, initRequest)
}
