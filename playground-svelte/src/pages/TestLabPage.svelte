<script lang="ts">
  import type {
    TestLabSampleCard,
    TestLabSampleId,
  } from '../../../playground-shared/testLabFixtures'
  import { TEST_LAB_SAMPLES } from '../../../playground-shared/testLabFixtures'
  import { untrack } from 'svelte'
  import PlaygroundHeader from '../components/PlaygroundHeader.svelte'
  import TestLabControls from '../components/TestLabControls.svelte'
  import TestPreview from '../components/TestPreview.svelte'
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

  function resolveSample(sampleId: TestLabSampleId): TestLabSampleCard {
    const sample = TEST_LAB_SAMPLES.find(candidate => candidate.id === sampleId)
    if (!sample)
      throw new Error(`Unknown test lab sample: ${sampleId}`)
    return sample
  }

  let testInput = $state(
    resolveSample(untrack(() => settings.sampleId)).content,
  )
  const stream = useChunkStream(() => settings.streamConfig)
  const activeSample = $derived(resolveSample(settings.sampleId))
  const previewContent = $derived(
    stream.isStreaming ? stream.content : testInput,
  )
  const progress = $derived(
    testInput.length
      ? Math.min(100, Math.round((previewContent.length / testInput.length) * 100))
      : 0,
  )

  function applySelectedSample() {
    stream.stop()
    testInput = activeSample.content
  }

  function chooseSample(sample: TestLabSampleCard) {
    settings.sampleId = sample.id
    stream.stop()
    testInput = sample.content
  }

  function toggleStream() {
    if (stream.isStreaming)
      stream.stop()
    else
      stream.start(testInput)
  }

  function resetInput() {
    stream.stop()
    testInput = activeSample.content
  }

  function clearInput() {
    stream.stop()
    testInput = ''
  }
</script>

<main class="chat-shell chat-shell--test">
  <PlaygroundHeader
    variant="test"
    title="markstream-svelte test lab"
    isStreaming={stream.isStreaming}
    isPaused={stream.isPaused}
    selectedTheme={settings.selectedTheme}
    renderModeLabel={settings.renderModeLabel}
    onNavigate={route.navigate}
  />

  <section class="test-lab">
    <TestLabControls
      {settings}
      {activeSample}
      bind:testInput
      isStreaming={stream.isStreaming}
      isPaused={stream.isPaused}
      {progress}
      previewLength={previewContent.length}
      onApplySample={applySelectedSample}
      onChooseSample={chooseSample}
      onToggleStream={toggleStream}
      onTogglePause={stream.togglePause}
      onReset={resetInput}
      onClear={clearInput}
    />
    <TestPreview
      {settings}
      content={previewContent}
      isStreaming={stream.isStreaming}
      {progress}
    />
  </section>
</main>
