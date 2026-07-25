<script lang="ts">
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'
  import PlaygroundRenderer from './PlaygroundRenderer.svelte'

  let {
    settings,
    content,
    isStreaming,
    progress,
  }: {
    settings: PlaygroundSettings
    content: string
    isStreaming: boolean
    progress: number
  } = $props()

</script>

<div class="workspace-card workspace-card--preview">
  <div class="workspace-card__head">
    <div>
      <h2>Preview</h2>
      <p>Svelte renderer output</p>
    </div>
    <span class="mini-pill">{progress}%</span>
  </div>
  <div class="preview-surface">
    <PlaygroundRenderer
      {content}
      {isStreaming}
      {settings}
    />
  </div>
</div>
