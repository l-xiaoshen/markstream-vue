<script lang="ts">
  import { THEMES } from '../config/playground'
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'

  let { settings }: { settings: PlaygroundSettings } = $props()
</script>

<aside class="settings-panel settings-sidebar settings-sidebar--docked">
  <div class="settings-sidebar__header">
    <span class="settings-sidebar__title">Controls</span>
  </div>

  <div class="setting-group">
    <label class="setting-label" for="code-theme">Code Theme</label>
    <select id="code-theme" class="setting-select" bind:value={settings.selectedTheme}>
      {#each THEMES as theme}
        <option value={theme}>{theme}</option>
      {/each}
    </select>
  </div>

  <div class="setting-group">
    <span class="setting-label">Chunk Size</span>
    <div class="setting-slider-row">
      <span class="setting-slider-label">Min</span>
      <input class="setting-slider" type="range" min="1" max="24" bind:value={settings.chunkSizeMin} />
      <span class="setting-slider-value">{Math.min(settings.chunkSizeMin, settings.chunkSizeMax)}</span>
    </div>
    <div class="setting-slider-row">
      <span class="setting-slider-label">Max</span>
      <input class="setting-slider" type="range" min="1" max="24" bind:value={settings.chunkSizeMax} />
      <span class="setting-slider-value">{Math.max(settings.chunkSizeMin, settings.chunkSizeMax)}</span>
    </div>
  </div>

  <div class="setting-group">
    <span class="setting-label">Chunk Delay</span>
    <div class="setting-slider-row">
      <span class="setting-slider-label">Min</span>
      <input class="setting-slider" type="range" min="8" max="240" step="4" bind:value={settings.chunkDelayMin} />
      <span class="setting-slider-value">{Math.min(settings.chunkDelayMin, settings.chunkDelayMax)}ms</span>
    </div>
    <div class="setting-slider-row">
      <span class="setting-slider-label">Max</span>
      <input class="setting-slider" type="range" min="8" max="240" step="4" bind:value={settings.chunkDelayMax} />
      <span class="setting-slider-value">{Math.max(settings.chunkDelayMin, settings.chunkDelayMax)}ms</span>
    </div>
  </div>

  <div class="setting-group">
    <span class="setting-label">Burstiness</span>
    <div class="setting-slider-row">
      <input class="setting-slider" type="range" min="0" max="100" bind:value={settings.burstiness} />
      <span class="setting-slider-value">{settings.burstiness}%</span>
    </div>
    <p class="setting-hint">
      Window: {settings.streamChunkRangeLabel} chars / {settings.streamDelayRangeLabel}
    </p>
  </div>

  <div class="settings-divider"></div>

  <div class="setting-row-inline">
    <span class="setting-label">Dark Mode</span>
    <button
      type="button"
      class:theme-toggle--dark={settings.isDark}
      class="theme-toggle"
      aria-label="Toggle dark mode"
      onclick={() => (settings.isDark = !settings.isDark)}
    >
      <span class="theme-toggle__thumb"></span>
    </button>
  </div>
</aside>
