<script lang="ts">
  import type { RendererCustomComponentMap } from 'markstream-svelte'
  import MarkdownRender, { CodeBlockNode } from 'markstream-svelte'
  import {
    PLAYGROUND_CUSTOM_HTML_TAGS,
    PLAYGROUND_CUSTOM_ID,
    PLAYGROUND_MONACO_OPTIONS,
    PLAYGROUND_SMOOTH_STREAMING_OPTIONS,
    THEMES,
  } from '../config/playground'
  import type { PlaygroundSettings } from '../composables/usePlaygroundSettings.svelte'

  let {
    className = undefined,
    content,
    isStreaming,
    renderMode = undefined,
    settings,
  }: {
    className?: string | undefined
    content: string
    isStreaming: boolean
    renderMode?: PlaygroundSettings['renderMode'] | undefined
    settings: PlaygroundSettings
  } = $props()

  const resolvedRenderMode = $derived(renderMode ?? settings.renderMode)
  const codeBlockProps = $derived({
    darkTheme: settings.selectedTheme,
    lightTheme: settings.selectedTheme,
    monacoOptions: PLAYGROUND_MONACO_OPTIONS,
    stream: settings.codeBlockStream,
    themes: [...THEMES],
  })
  const markdownModeComponents = {
    code_block: CodeBlockNode,
  } satisfies RendererCustomComponentMap
</script>

<MarkdownRender
  {className}
  {content}
  final={!isStreaming}
  smoothStreaming={isStreaming ? 'auto' : false}
  smoothStreamingOptions={PLAYGROUND_SMOOTH_STREAMING_OPTIONS}
  fade={!isStreaming}
  typewriter={isStreaming && settings.typewriter}
  {codeBlockProps}
  renderCodeBlocksAsPre={resolvedRenderMode === 'pre'}
  customComponents={resolvedRenderMode === 'markdown' ? markdownModeComponents : undefined}
  isDark={settings.isDark}
  customId={PLAYGROUND_CUSTOM_ID}
  customHtmlTags={PLAYGROUND_CUSTOM_HTML_TAGS}
  batchRendering={settings.batchRendering}
/>
