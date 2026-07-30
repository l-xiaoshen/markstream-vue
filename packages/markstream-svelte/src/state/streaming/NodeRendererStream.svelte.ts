import type { SmoothMarkdownStreamOptions } from 'markstream-core'
import { onDestroy, onMount, untrack } from 'svelte'
import {
  getParentSmoothStreaming,
  setSmoothStreaming,
} from '../../context/smoothStreaming'
import { SmoothMarkdownStream } from './SmoothMarkdownStream.svelte'

interface NodeRendererStreamOptions {
  getContent: () => string | undefined
  getHasProvidedNodes: () => boolean
  getRequestedFinal: () => boolean | undefined
  getSmoothStreaming: () => boolean | 'auto'
  getSmoothStreamingOptions: () => SmoothMarkdownStreamOptions | undefined
  getTypewriter: () => boolean
  getMaxLiveNodes: () => number
}

export class NodeRendererStream {
  #mounted = $state(false)
  #observedStreaming = $state(false)
  #previousObservedContent: string
  #parentSmoothStreaming: ReturnType<typeof getParentSmoothStreaming>
  #rawContent: string
  #requestedFinal: boolean | undefined
  #smoothStreaming: boolean | 'auto'
  #smoothStreamingEligible: boolean
  #sourceSynced: boolean
  #typewriter: boolean
  #maxLiveNodes: number

  hasProvidedNodes: boolean
  smoothStreamingEnabled: boolean
  renderContent: string
  effectiveFinal: boolean | undefined
  readonly smoothStream: SmoothMarkdownStream

  constructor(private readonly options: NodeRendererStreamOptions) {
    const initialContent = untrack(() => this.options.getContent() ?? '')
    this.#previousObservedContent = initialContent
    this.#parentSmoothStreaming = getParentSmoothStreaming()
    this.smoothStream = new SmoothMarkdownStream(
      untrack(() => this.options.getSmoothStreamingOptions() ?? {}),
    )
    this.#rawContent = $derived(this.options.getContent() ?? '')
    this.#requestedFinal = $derived(this.options.getRequestedFinal())
    this.#smoothStreaming = $derived(this.options.getSmoothStreaming())
    this.#typewriter = $derived(this.options.getTypewriter())
    this.#maxLiveNodes = $derived(this.options.getMaxLiveNodes())
    this.hasProvidedNodes = $derived(this.options.getHasProvidedNodes())
    this.#smoothStreamingEligible = $derived.by(() => {
      if (this.#smoothStreaming === false || this.hasProvidedNodes)
        return false
      if (this.#smoothStreaming !== true && this.#parentSmoothStreaming?.())
        return false
      if (this.#smoothStreaming === true)
        return true
      return this.#typewriter
        || this.#maxLiveNodes <= 0
        || this.#requestedFinal === false
        || this.#observedStreaming
    })
    this.smoothStreamingEnabled = $derived(
      (this.#smoothStreaming === true || this.#mounted) && this.#smoothStreamingEligible,
    )
    this.renderContent = $derived(
      this.smoothStreamingEnabled ? this.smoothStream.visible : this.#rawContent,
    )
    this.#sourceSynced = $derived(
      this.hasProvidedNodes || this.smoothStream.source === this.#rawContent,
    )
    this.effectiveFinal = $derived(
      this.smoothStreamingEnabled && this.#requestedFinal !== undefined
        ? this.#requestedFinal && this.#sourceSynced && this.smoothStream.caughtUp
        : this.#requestedFinal,
    )
    this.smoothStream.reset(initialContent)
    if (untrack(this.options.getRequestedFinal))
      this.smoothStream.finish({ flush: true })

    setSmoothStreaming(() => this.smoothStreamingEnabled)

    $effect.pre(() => {
      const nextContent = this.#rawContent
      const providedNodes = this.hasProvidedNodes
      const nextFinal = this.#requestedFinal

      untrack(() => {
        const appended = nextContent.length > this.#previousObservedContent.length
          && nextContent.startsWith(this.#previousObservedContent)
        const replaced = nextContent !== this.#previousObservedContent && !appended

        if (providedNodes || !nextContent)
          this.#observedStreaming = false
        else if (nextFinal === false || appended)
          this.#observedStreaming = true
        else if (replaced)
          this.#observedStreaming = false

        this.#previousObservedContent = nextContent
      })
    })

    $effect(() => {
      const nextContent = this.#rawContent
      const providedNodes = this.hasProvidedNodes
      const streamingEnabled = this.smoothStreamingEnabled
      const nextFinal = this.#requestedFinal
      const smoothStreamingOptions = this.options.getSmoothStreamingOptions() ?? {}
      this.smoothStream.setOptions(smoothStreamingOptions)

      untrack(() => {
        if (providedNodes) {
          this.smoothStream.reset('')
          return
        }
        if (!streamingEnabled) {
          this.smoothStream.reset(nextContent)
          if (nextFinal)
            this.smoothStream.finish({ flush: true })
          return
        }

        if (!nextContent) {
          this.smoothStream.reset('')
        }
        else if (nextContent !== this.smoothStream.source) {
          if (nextContent.startsWith(this.smoothStream.source))
            this.smoothStream.enqueue(nextContent.slice(this.smoothStream.source.length))
          else
            this.smoothStream.reset(nextContent)
        }

        if (nextFinal)
          this.smoothStream.finish()
      })
    })

    onMount(() => {
      this.#mounted = true
    })
    onDestroy(() => this.smoothStream.destroy())
  }
}
