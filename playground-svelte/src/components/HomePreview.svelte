<script lang="ts">
  import type { ChunkStream } from '../composables/useChunkStream.svelte'
  import { usePinnedScroll } from '../composables/usePinnedScroll.svelte'
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'
  import PlaygroundRenderer from './PlaygroundRenderer.svelte'

  let {
    settings,
    stream,
  }: {
    settings: PlaygroundSettings
    stream: ChunkStream
  } = $props()

  const pinnedScroll = usePinnedScroll(() => stream.content.length)
  const attachScrollRoot = pinnedScroll.attachRoot
</script>

<main {@attach attachScrollRoot} class="chat-messages chatbot-messages">
  <PlaygroundRenderer
    className="chat-messages__content"
    content={stream.content}
    isStreaming={stream.isStreaming}
    renderMode="monaco"
    {settings}
  />
</main>
