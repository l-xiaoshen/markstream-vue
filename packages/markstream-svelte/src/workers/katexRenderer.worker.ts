/// <reference lib="webworker" />

import type {
  KaTeXWorkerRenderedResponse,
  KaTeXWorkerRenderErrorResponse,
  KaTeXWorkerUncaughtErrorResponse,
} from '../types/runtimeWorkers'
import katex from 'katex'
import { toErrorMessage } from '../types/runtimeErrors'
import { isKaTeXWorkerRequest } from './internal/workerProtocol'
import 'katex/dist/contrib/mhchem'

declare const self: DedicatedWorkerGlobalScope

const state = {
  debug: false,
}

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  const data = event.data
  if (!isKaTeXWorkerRequest(data))
    return
  if (data.type === 'init') {
    state.debug = data.debug
    return
  }

  try {
    if (state.debug) {
      console.debug('[markstream-svelte:katexRenderer.worker] render start', {
        content: data.content,
        displayMode: data.displayMode,
        id: data.id,
      })
    }

    const html = katex.renderToString(data.content, {
      throwOnError: true,
      displayMode: data.displayMode,
      output: 'html',
      strict: 'ignore',
    })

    const response: KaTeXWorkerRenderedResponse = {
      type: 'rendered',
      id: data.id,
      html,
      content: data.content,
      displayMode: data.displayMode,
    }
    self.postMessage(response)
  }
  catch (error: unknown) {
    const response: KaTeXWorkerRenderErrorResponse = {
      type: 'render-error',
      id: data.id,
      error: toErrorMessage(error),
      content: data.content,
      displayMode: data.displayMode,
    }
    self.postMessage(response)
  }
})

self.addEventListener('error', (event: ErrorEvent) => {
  try {
    const response: KaTeXWorkerUncaughtErrorResponse = {
      type: 'worker-error',
      id: '__worker_uncaught__',
      error: event.message || toErrorMessage(event.error),
      content: '',
      displayMode: true,
    }
    self.postMessage(response)
  }
  catch {
    // Ignore postMessage failures while surfacing uncaught worker errors.
  }
})
