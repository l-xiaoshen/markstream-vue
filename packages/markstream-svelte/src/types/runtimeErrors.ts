export type MarkstreamRuntimeErrorCode
  = | 'ABORTED'
    | 'KATEX_DISABLED'
    | 'MERMAID_DISABLED'
    | 'WORKER_BUSY'
    | 'WORKER_BUSY_TIMEOUT'
    | 'WORKER_CLEARED'
    | 'WORKER_ERROR'
    | 'WORKER_INIT_ERROR'
    | 'WORKER_MESSAGE_ERROR'
    | 'WORKER_PROTOCOL_ERROR'
    | 'WORKER_TIMEOUT'

export class MarkstreamRuntimeError<
  Code extends MarkstreamRuntimeErrorCode = MarkstreamRuntimeErrorCode,
> extends Error {
  readonly code: Code
  readonly fallbackToRenderer: boolean

  constructor(
    name: string,
    code: Code,
    message: string,
    fallbackToRenderer = false,
  ) {
    super(message)
    this.name = name
    this.code = code
    this.fallbackToRenderer = fallbackToRenderer
  }
}

export class FeatureDisabledError<
  Code extends 'KATEX_DISABLED' | 'MERMAID_DISABLED',
> extends MarkstreamRuntimeError<Code> {
  constructor(name: string, code: Code, feature: string) {
    super(name, code, `${feature} rendering disabled`)
  }
}

export class WorkerInitError extends MarkstreamRuntimeError<'WORKER_INIT_ERROR'> {
  constructor(message: string) {
    super('WorkerInitError', 'WORKER_INIT_ERROR', message, true)
  }
}

export class WorkerBusyError extends MarkstreamRuntimeError<'WORKER_BUSY'> {
  readonly busy = true
  readonly inFlight: number
  readonly max: number

  constructor(inFlight: number, max: number) {
    super('WorkerBusy', 'WORKER_BUSY', 'Worker busy')
    this.inFlight = inFlight
    this.max = max
  }
}

export class WorkerTimeoutError extends MarkstreamRuntimeError<'WORKER_TIMEOUT'> {
  constructor(message = 'Worker call timed out') {
    super('WorkerTimeout', 'WORKER_TIMEOUT', message)
  }
}

export class WorkerBusyTimeoutError extends MarkstreamRuntimeError<'WORKER_BUSY_TIMEOUT'> {
  constructor() {
    super('WorkerBusyTimeout', 'WORKER_BUSY_TIMEOUT', 'Wait for worker slot timed out')
  }
}

export class WorkerLifecycleError<
  Code extends 'WORKER_CLEARED' | 'WORKER_ERROR' | 'WORKER_MESSAGE_ERROR',
> extends MarkstreamRuntimeError<Code> {
  constructor(name: string, code: Code, message: string) {
    super(name, code, message)
  }
}

export class WorkerProtocolError extends MarkstreamRuntimeError<'WORKER_PROTOCOL_ERROR'> {
  constructor(message: string) {
    super('WorkerProtocolError', 'WORKER_PROTOCOL_ERROR', message)
  }
}

export class AbortRuntimeError extends MarkstreamRuntimeError<'ABORTED'> {
  constructor() {
    super('AbortError', 'ABORTED', 'Aborted')
  }
}

export function isRuntimeErrorCode<Code extends MarkstreamRuntimeErrorCode>(
  error: unknown,
  code: Code,
): error is MarkstreamRuntimeError<Code> {
  return error instanceof MarkstreamRuntimeError && error.code === code
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
