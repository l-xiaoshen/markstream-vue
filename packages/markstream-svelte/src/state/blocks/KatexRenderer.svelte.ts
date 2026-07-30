import { onDestroy, untrack } from 'svelte'
import { normalizeKaTeXRenderInput } from '../../utils/normalizeKaTeXRenderInput'
import { renderKatexMarkup } from '../../utils/rendering/katex'

type KatexRenderState
  = { kind: 'loading' }
    | { kind: 'ready', html: string }
    | { kind: 'fallback', text: string }
    | { kind: 'empty' }

interface KatexRendererOptions {
  getSource: () => string
  getRaw: () => string
  getDisplayMode: () => boolean
  getLoading: () => boolean
  getWorkerTimeoutMs: () => number
  getWorkerWaitTimeoutMs: () => number
  getWorkerRetries: () => number
}

interface KatexRenderRequest {
  displayMode: boolean
  loading: boolean
  raw: string
  source: string
  workerRetries: number
  workerTimeoutMs: number
  workerWaitTimeoutMs: number
}

export class KatexRenderer {
  state = $state.raw<KatexRenderState>({ kind: 'loading' })

  #abortController: AbortController | null = null
  #destroyed = false
  #generation = 0
  #lastSignature = ''

  constructor(private readonly options: KatexRendererOptions) {
    $effect(() => {
      const request = {
        displayMode: this.options.getDisplayMode(),
        loading: this.options.getLoading(),
        raw: this.options.getRaw(),
        source: this.options.getSource(),
        workerRetries: this.options.getWorkerRetries(),
        workerTimeoutMs: this.options.getWorkerTimeoutMs(),
        workerWaitTimeoutMs: this.options.getWorkerWaitTimeoutMs(),
      }
      const signature = [
        request.source,
        request.raw,
        request.displayMode ? 'display' : 'inline',
        request.loading ? 'loading' : 'final',
        request.workerTimeoutMs,
        request.workerWaitTimeoutMs,
        request.workerRetries,
      ].join('\n')
      untrack(() => {
        if (signature === this.#lastSignature)
          return
        this.#lastSignature = signature
        void this.#render(request)
      })
    })

    onDestroy(() => {
      this.#destroyed = true
      this.#generation += 1
      this.#abortController?.abort()
      this.#abortController = null
    })
  }

  async #render(request: KatexRenderRequest): Promise<void> {
    const generation = ++this.#generation
    this.#abortController?.abort()
    const abortController = new AbortController()
    this.#abortController = abortController
    const content = normalizeKaTeXRenderInput(request.source)
    if (!content) {
      if (!this.#destroyed && generation === this.#generation)
        this.state = { kind: 'empty' }
      return
    }

    if (
      !this.#destroyed
      && generation === this.#generation
      && this.state.kind !== 'ready'
    ) {
      this.state = { kind: 'loading' }
    }

    try {
      const html = await renderKatexMarkup({
        displayMode: request.displayMode,
        maxRetries: request.workerRetries,
        signal: abortController.signal,
        source: content,
        throwOnError: request.loading,
        timeout: request.workerTimeoutMs,
        waitTimeout: request.workerWaitTimeoutMs,
      })
      if (this.#destroyed || generation !== this.#generation)
        return
      this.state = html
        ? { kind: 'ready', html }
        : { kind: 'empty' }
    }
    catch {
      if (this.#destroyed || generation !== this.#generation)
        return
      if (!request.loading)
        this.state = { kind: 'fallback', text: request.raw || content }
    }
    finally {
      if (this.#abortController === abortController)
        this.#abortController = null
    }
  }
}
