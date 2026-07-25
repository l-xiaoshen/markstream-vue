<script lang="ts">
  import type { TestLabSampleCard } from '../../../playground-shared/testLabFixtures'
  import { TEST_LAB_SAMPLES } from '../../../playground-shared/testLabFixtures'
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'

  interface TestLabControlsProps {
    settings: PlaygroundSettings
    activeSample: TestLabSampleCard
    testInput: string
    isStreaming: boolean
    isPaused: boolean
    progress: number
    previewLength: number
    onApplySample: () => void
    onChooseSample: (sample: TestLabSampleCard) => void
    onToggleStream: () => void
    onTogglePause: () => void
    onReset: () => void
    onClear: () => void
  }

  let {
    settings,
    activeSample,
    testInput = $bindable(),
    isStreaming,
    isPaused,
    progress,
    previewLength,
    onApplySample,
    onChooseSample,
    onToggleStream,
    onTogglePause,
    onReset,
    onClear,
  }: TestLabControlsProps = $props()
</script>

<div class="workspace-card workspace-card--editor">
  <div class="workspace-card__head">
    <div>
      <h2>Markdown 输入</h2>
      <p>{activeSample.summary}</p>
    </div>
    <span class="mini-pill">{settings.renderModeLabel}</span>
  </div>

  <label class="field">
    Sample
    <select bind:value={settings.sampleId} onchange={onApplySample}>
      {#each TEST_LAB_SAMPLES as sample}
        <option value={sample.id}>{sample.title}</option>
      {/each}
    </select>
  </label>

  <div class="sample-list">
    {#each TEST_LAB_SAMPLES as sample}
      <button
        type="button"
        class:sample-card--active={sample.id === settings.sampleId}
        class="sample-card"
        onclick={() => onChooseSample(sample)}
      >
        <strong>{sample.title}</strong>
        <span>{sample.summary}</span>
      </button>
    {/each}
  </div>

  <div class="control-grid">
    <label class="field">
      Render
      <select bind:value={settings.renderMode}>
        <option value="monaco">Monaco</option>
        <option value="markdown">CodeBlock component</option>
        <option value="pre">PreCodeNode</option>
      </select>
    </label>
    <label class="toggle-item"><input type="checkbox" bind:checked={settings.codeBlockStream} /> Code stream</label>
    <label class="toggle-item"><input type="checkbox" bind:checked={settings.batchRendering} /> batchRendering</label>
    <label class="toggle-item"><input type="checkbox" bind:checked={settings.typewriter} /> typewriter</label>
    <label class="toggle-item"><input type="checkbox" bind:checked={settings.mathEnabled} /> KaTeX</label>
    <label class="toggle-item"><input type="checkbox" bind:checked={settings.mermaidEnabled} /> Mermaid</label>
  </div>

  <div class="control-actions">
    <button type="button" class="action-button action-button--primary" onclick={onToggleStream}>
      {isStreaming ? '停止流式渲染' : '开始流式渲染'}
    </button>
    <button type="button" class="action-button" disabled={!isStreaming} onclick={onTogglePause}>
      {isPaused ? '继续流式渲染' : '暂停流式渲染'}
    </button>
    <button type="button" class="action-button" onclick={onReset}>重置样例</button>
    <button type="button" class="action-button" onclick={onClear}>清空输入</button>
  </div>

  <div class="progress-block">
    <div class="progress-track">
      <div class="progress-fill" style={`width: ${progress}%`}></div>
    </div>
    <div class="progress-meta">
      <span>{previewLength} / {testInput.length || 0}</span>
      <span>{isStreaming ? 'Streaming' : 'Static preview'}</span>
    </div>
  </div>

  <textarea bind:value={testInput} spellcheck="false"></textarea>
</div>
