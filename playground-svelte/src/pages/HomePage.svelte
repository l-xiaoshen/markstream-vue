<script lang="ts">
  import { streamContent } from '../../../playground/src/const/markdown'
  import HomePreview from '../components/HomePreview.svelte'
  import PlaygroundHeader from '../components/PlaygroundHeader.svelte'
  import { useChunkStream } from '../composables/useChunkStream.svelte'
  import type { PlaygroundRoute } from '../composables/usePlaygroundRoute.svelte'
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'

  let {
    route,
    settings,
  }: {
    route: PlaygroundRoute
    settings: PlaygroundSettings
  } = $props()

  const stream = useChunkStream(() => settings.streamConfig)

  $effect(() => {
    stream.start(streamContent)
    return stream.stop
  })
</script>

<div class="chat-wrapper chat-wrapper--with-sidebar">
  <div class="chat-container">
    <PlaygroundHeader
      variant="home"
      title="markstream-svelte"
      isStreaming={stream.isStreaming}
      isPaused={stream.isPaused}
      selectedTheme={settings.selectedTheme}
      onNavigate={route.navigate}
      onTogglePause={stream.togglePause}
      onReplay={() => stream.start(streamContent)}
    />

    <section class="chat-overview">
      <div class="chat-overview__intro">
        <span class="chat-overview__eyebrow">Live Playground</span>
        <p class="chat-overview__summary">Custom min/max window with your own burst profile.</p>
      </div>
      <div class="chat-overview__stats">
        <div class="chat-overview__stat">
          <span class="chat-overview__stat-label">Chunk</span>
          <strong class="chat-overview__stat-value">{settings.streamChunkRangeLabel}</strong>
        </div>
        <div class="chat-overview__stat">
          <span class="chat-overview__stat-label">Delay</span>
          <strong class="chat-overview__stat-value">{settings.streamDelayRangeLabel}</strong>
        </div>
        <div class="chat-overview__stat">
          <span class="chat-overview__stat-label">Transport</span>
          <strong class="chat-overview__stat-value">Scheduler</strong>
        </div>
        <div class="chat-overview__stat">
          <span class="chat-overview__stat-label">Burst</span>
          <strong class="chat-overview__stat-value">{settings.burstiness}%</strong>
        </div>
      </div>
    </section>

    <HomePreview {settings} {stream} />
  </div>
</div>
