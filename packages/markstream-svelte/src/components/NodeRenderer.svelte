<script lang="ts" generics="TCustomNode extends BaseNode = never">
  import type { BaseNode } from 'stream-markdown-parser'
  import type {
    NodeRendererEvents,
    NodeRendererProps,
    SvelteRenderContext,
  } from '../types/renderer'
  import { untrack } from 'svelte'
  import { toRuntimeCustomComponentMap } from '../customComponents'
  import { resolveParsedNodes } from '../parseMarkdownToNodes'
  import { RenderBatch } from '../state/renderer/RenderBatch.svelte'
  import { RenderedHtmlEnhancements } from '../state/renderer/RenderedHtmlEnhancements.svelte'
  import { ScopedCustomComponents } from '../state/renderer/ScopedCustomComponents.svelte'
  import { NodeRendererStream } from '../state/streaming/NodeRendererStream.svelte'
  import { TypewriterCursor } from '../state/streaming/TypewriterCursor.svelte'
  import { hasLoadingNodeTree } from '../types/nodes'
  import NodeOutlet from './NodeOutlet.svelte'
  import { buildRenderContext } from './shared/node-helpers'

  type NodeRendererComponentProps = NodeRendererProps<TCustomNode> & NodeRendererEvents & {
    className?: string
    onClick?: (event: MouseEvent) => void
    onMouseover?: (event: MouseEvent) => void
    onMouseout?: (event: MouseEvent) => void
  }

  let {
    content = '',
    nodes = null,
    final = undefined,
    parseOptions = undefined,
    customMarkdownIt = undefined,
    debugPerformance = false,
    customHtmlTags = undefined,
    htmlPolicy = 'safe',
    codeBlockStream = true,
    codeBlockDarkTheme = undefined,
    codeBlockLightTheme = undefined,
    codeBlockMonacoOptions = undefined,
    renderCodeBlocksAsPre = false,
    codeBlockMinWidth = undefined,
    codeBlockMaxWidth = undefined,
    codeBlockProps = undefined,
    mermaidProps = undefined,
    d2Props = undefined,
    infographicProps = undefined,
    imageProps = undefined,
    mathProps = undefined,
    customComponents = undefined,
    showTooltips = true,
    themes = undefined,
    isDark = false,
    customId = undefined,
    indexKey = undefined,
    typewriter = false,
    fade = true,
    batchRendering = true,
    initialRenderBatchSize = 40,
    renderBatchSize = 80,
    renderBatchDelay = 16,
    renderBatchBudgetMs = 6,
    renderBatchIdleTimeoutMs = 120,
    maxLiveNodes = 320,
    allowHtml = true,
    smoothStreaming = 'auto',
    smoothStreamingOptions = undefined,
    className = '',
    onCopy = undefined,
    onHandleArtifactClick = undefined,
    onClick = undefined,
    onMouseover = undefined,
    onMouseout = undefined,
  }: NodeRendererComponentProps = $props()

  let streamRenderVersion = $state(0)
  let previousContent: NodeRendererProps<TCustomNode>['content']
  let previousNodes: NodeRendererProps<TCustomNode>['nodes']

  const textStreamState = new Map<string, string>()
  const scopedCustomComponents = new ScopedCustomComponents(() => customId)
  const rendererStream = new NodeRendererStream({
    getContent: () => content,
    getHasProvidedNodes: () => Array.isArray(nodes),
    getRequestedFinal: () => final ?? parseOptions?.final,
    getSmoothStreaming: () => smoothStreaming,
    getSmoothStreamingOptions: () => smoothStreamingOptions,
    getTypewriter: () => typewriter,
    getMaxLiveNodes: () => maxLiveNodes,
  })

  const rendererProps = $derived({
    content: rendererStream.renderContent,
    nodes,
    final: rendererStream.effectiveFinal,
    parseOptions,
    customMarkdownIt,
    debugPerformance,
    customHtmlTags,
    htmlPolicy,
    codeBlockStream,
    codeBlockDarkTheme,
    codeBlockLightTheme,
    codeBlockMonacoOptions,
    renderCodeBlocksAsPre,
    codeBlockMinWidth,
    codeBlockMaxWidth,
    codeBlockProps,
    mermaidProps,
    d2Props,
    infographicProps,
    imageProps,
    mathProps,
    customComponents,
    showTooltips,
    themes,
    isDark,
    customId,
    indexKey,
    typewriter,
    fade,
    batchRendering,
    initialRenderBatchSize,
    renderBatchSize,
    renderBatchDelay,
    renderBatchBudgetMs,
    renderBatchIdleTimeoutMs,
    maxLiveNodes,
    allowHtml,
    smoothStreaming,
    smoothStreamingOptions,
  } satisfies NodeRendererProps<TCustomNode>)

  $effect.pre(() => {
    const nextContent = rendererStream.renderContent
    const nextNodes = nodes
    untrack(() => {
      if (previousContent === nextContent && previousNodes === nextNodes)
        return
      streamRenderVersion += 1
      previousContent = nextContent
      previousNodes = nextNodes
    })
  })

  const parsedNodes = $derived.by(() => {
    const start = debugPerformance && typeof performance !== 'undefined'
      ? performance.now()
      : 0
    const result = resolveParsedNodes(rendererProps)
    if (debugPerformance && typeof performance !== 'undefined') {
      console.info('[markstream-svelte][perf] parse(sync)', {
        ms: Math.round(performance.now() - start),
        nodes: result.length,
        contentLength: rendererStream.renderContent.length,
      })
    }
    return result
  })

  const mergedComponents = $derived(toRuntimeCustomComponentMap(
    customComponents
      ? { ...scopedCustomComponents.components, ...customComponents }
      : scopedCustomComponents.components,
  ))
  const renderContext = $derived<SvelteRenderContext>(buildRenderContext(
    rendererProps,
    { onCopy, onHandleArtifactClick },
    textStreamState,
    mergedComponents,
  ))

  const renderBatch = new RenderBatch(
    () => parsedNodes.length,
    () => ({
      enabled: batchRendering,
      final: rendererStream.effectiveFinal,
      initialSize: initialRenderBatchSize,
      size: renderBatchSize,
      delayMs: renderBatchDelay,
      budgetMs: renderBatchBudgetMs,
      idleTimeoutMs: renderBatchIdleTimeoutMs,
    }),
  )
  const renderedNodes = $derived(parsedNodes.slice(0, renderBatch.count))
  const enhancementFinal = $derived(
    rendererStream.effectiveFinal ?? !hasLoadingNodeTree(parsedNodes),
  )
  const enhancementsReady = $derived(
    renderBatch.count >= parsedNodes.length,
  )
  const htmlEnhancements = new RenderedHtmlEnhancements(() => ({
    enabled: enhancementsReady,
    options: {
      final: enhancementFinal,
      isDark: renderContext.isDark,
      renderCodeBlocksAsPre: renderContext.renderCodeBlocksAsPre,
      monacoOptions: renderContext.codeBlockProps?.monacoOptions,
      codeBlockProps: renderContext.codeBlockProps,
      mermaidProps: renderContext.mermaidProps,
      d2Props: renderContext.d2Props,
      infographicProps: renderContext.infographicProps,
      showTooltips: renderContext.showTooltips,
      onCopy: renderContext.events.onCopy,
    },
    revision: streamRenderVersion,
  }))

  const typewriterCursor = new TypewriterCursor({
    getNodes: () => parsedNodes,
    getRawContent: () => rendererStream.renderContent,
    getFinal: () => rendererStream.effectiveFinal,
    getEnabled: () => typewriter,
    getUsesProvidedNodes: () => rendererStream.hasProvidedNodes,
  })

  function handleMouseover(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('[data-node-index]'))
      onMouseover?.(event)
  }

  function handleMouseout(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('[data-node-index]'))
      onMouseout?.(event)
  }

  const rootKey = $derived(indexKey == null ? 'markdown-renderer' : String(indexKey))
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  {@attach (element) => htmlEnhancements.attachment(element)}
  {@attach (element) => typewriterCursor.rootAttachment(element)}
  class="markstream-svelte markdown-renderer {className}"
  class:dark={isDark}
  data-custom-id={customId}
  onclick={onClick}
  onmouseover={handleMouseover}
  onmouseout={handleMouseout}
>
  {#each renderedNodes as node, index (`${rootKey}-${index}`)}
    <div class="node-slot" data-node-index={index} data-node-type={node.type}>
      <div
        class="node-content"
        class:fade-node={fade && node.type !== 'code_block'}
        data-node-index={index}
      >
        <NodeOutlet node={node} context={renderContext} indexKey={`${rootKey}-${index}`} />
      </div>
    </div>
  {/each}
  {#if typewriterCursor.visible}
    <span {@attach (element) => typewriterCursor.cursorAttachment(element)} class="typewriter-cursor" aria-hidden="true"></span>
  {/if}
</div>
