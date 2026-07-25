import type {
  KaTeXWorkerRequest,
  KaTeXWorkerResponse,
  MermaidWorkerAction,
  MermaidWorkerRequest,
  MermaidWorkerResponse,
  MermaidWorkerTheme,
} from '../../types/runtimeWorkers'

type MessageRecord = Record<string, unknown>

function isMessageRecord(value: unknown): value is MessageRecord {
  return typeof value === 'object' && value !== null
}

function isMermaidWorkerAction(value: unknown): value is MermaidWorkerAction {
  return value === 'canParse' || value === 'findPrefix'
}

function isMermaidWorkerTheme(value: unknown): value is MermaidWorkerTheme {
  return value === 'light' || value === 'dark'
}

export function isKaTeXWorkerRequest(value: unknown): value is KaTeXWorkerRequest {
  if (!isMessageRecord(value))
    return false

  if (value.type === 'init')
    return typeof value.debug === 'boolean'

  return (
    value.type === 'render'
    && typeof value.id === 'string'
    && typeof value.content === 'string'
    && typeof value.displayMode === 'boolean'
  )
}

export function isKaTeXWorkerResponse(value: unknown): value is KaTeXWorkerResponse {
  if (
    !isMessageRecord(value)
    || typeof value.id !== 'string'
    || typeof value.content !== 'string'
    || typeof value.displayMode !== 'boolean'
  ) {
    return false
  }

  if (value.type === 'rendered')
    return typeof value.html === 'string'

  if (value.type === 'render-error')
    return typeof value.error === 'string'

  return (
    value.type === 'worker-error'
    && value.id === '__worker_uncaught__'
    && value.content === ''
    && value.displayMode === true
    && typeof value.error === 'string'
  )
}

export function isMermaidWorkerRequest(value: unknown): value is MermaidWorkerRequest {
  if (!isMessageRecord(value))
    return false

  if (value.type === 'init')
    return typeof value.debug === 'boolean'
  if (
    value.type !== 'request'
    || typeof value.id !== 'string'
    || !isMermaidWorkerAction(value.action)
    || !isMessageRecord(value.payload)
  ) {
    return false
  }

  return (
    typeof value.payload.code === 'string'
    && isMermaidWorkerTheme(value.payload.theme)
  )
}

export function isMermaidWorkerResponse(value: unknown): value is MermaidWorkerResponse {
  if (
    !isMessageRecord(value)
    || typeof value.id !== 'string'
    || !isMermaidWorkerAction(value.action)
  ) {
    return false
  }

  if (value.type === 'error') {
    return (
      value.ok === false
      && typeof value.error === 'string'
    )
  }
  if (value.type !== 'result' || value.ok !== true)
    return false

  return value.action === 'canParse'
    ? typeof value.result === 'boolean'
    : value.result === null || typeof value.result === 'string'
}
