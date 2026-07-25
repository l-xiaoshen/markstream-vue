// TODO: Add strict runtime value validation after discussing validation library options with the maintainers.

export interface KaTeXWorkerInitRequest {
  type: 'init'
  debug: boolean
}

export interface KaTeXWorkerRenderRequest {
  type: 'render'
  id: string
  content: string
  displayMode: boolean
}

export type KaTeXWorkerRequest = KaTeXWorkerInitRequest | KaTeXWorkerRenderRequest

export interface KaTeXWorkerRenderedResponse {
  type: 'rendered'
  id: string
  content: string
  displayMode: boolean
  html: string
}

export interface KaTeXWorkerRenderErrorResponse {
  type: 'render-error'
  id: string
  content: string
  displayMode: boolean
  error: string
}

export interface KaTeXWorkerUncaughtErrorResponse {
  type: 'worker-error'
  id: '__worker_uncaught__'
  content: ''
  displayMode: true
  error: string
}

export type KaTeXWorkerResponse
  = | KaTeXWorkerRenderedResponse
    | KaTeXWorkerRenderErrorResponse
    | KaTeXWorkerUncaughtErrorResponse

export type MermaidWorkerTheme = import('../utils/mermaidPreview').MermaidTheme
export type MermaidWorkerAction = 'canParse' | 'findPrefix'

export interface MermaidWorkerInitRequest {
  type: 'init'
  debug: boolean
}

export interface MermaidWorkerPayload {
  code: string
  theme: MermaidWorkerTheme
}

export interface MermaidWorkerCanParseRequest {
  type: 'request'
  action: 'canParse'
  id: string
  payload: MermaidWorkerPayload
}

export interface MermaidWorkerFindPrefixRequest {
  type: 'request'
  action: 'findPrefix'
  id: string
  payload: MermaidWorkerPayload
}

export type MermaidWorkerRequest
  = | MermaidWorkerInitRequest
    | MermaidWorkerCanParseRequest
    | MermaidWorkerFindPrefixRequest

export interface MermaidWorkerCanParseResponse {
  type: 'result'
  action: 'canParse'
  id: string
  ok: true
  result: boolean
}

export interface MermaidWorkerFindPrefixResponse {
  type: 'result'
  action: 'findPrefix'
  id: string
  ok: true
  result: string | null
}

export interface MermaidWorkerErrorResponse {
  type: 'error'
  action: MermaidWorkerAction
  id: string
  ok: false
  error: string
}

export type MermaidWorkerResponse
  = | MermaidWorkerCanParseResponse
    | MermaidWorkerFindPrefixResponse
    | MermaidWorkerErrorResponse

export interface WorkerLoad {
  inFlight: number
  max: number
}
