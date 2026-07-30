export interface CDNWorkerHandle {
  worker: Worker | null
  dispose: () => void
  source: string
}

export const WORKER_ERROR_MESSAGE_SOURCE = `function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}`

export function stringifyForWorker(value: unknown): string {
  const serialized = JSON.stringify(value)
  if (serialized === undefined)
    throw new TypeError('Worker configuration must be JSON serializable')
  return serialized
}

export function createModuleWorkerFromSource<InitMessage>(
  source: string,
  workerOptions: WorkerOptions | undefined,
  initMessage: InitMessage | undefined,
): CDNWorkerHandle {
  if (typeof Worker === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return {
      worker: null,
      dispose: () => {},
      source,
    }
  }

  const blob = new Blob([source], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  let revoked = false

  function dispose() {
    if (revoked)
      return
    revoked = true
    try {
      URL.revokeObjectURL(url)
    }
    catch {
      // Ignore revoke failures.
    }
  }

  const options = {
    ...(workerOptions ?? {}),
    type: 'module',
  } satisfies WorkerOptions

  const worker = new Worker(url, options)
  if (initMessage !== undefined) {
    try {
      worker.postMessage(initMessage)
    }
    catch {
      // Ignore init messaging failures.
    }
  }

  return { worker, dispose, source }
}
