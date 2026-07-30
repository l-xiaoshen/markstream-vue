export interface BackpressureOptions {
  timeout?: number
  waitTimeout?: number
  backoffMs?: number
  maxRetries?: number
  signal?: AbortSignal
}

export interface KaTeXBackpressureDefaults {
  backoffMs: number
  maxRetries: number
  timeout: number
  waitTimeout: number
}

export interface KaTeXWorkerClientOptions {
  cacheMax?: number
  isEnabled?: () => boolean
  maxConcurrency?: number
}
