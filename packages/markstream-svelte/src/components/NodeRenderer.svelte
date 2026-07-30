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
    context = undefined,
    customComponents = undefined,
    indexKey = undefined,
    className = '',
    onCopy = undefined,
    onHandleArtifactClick = undefined,
    onClick = undefined,
    onMouseover = undefined,
    onMouseout = undefined,
    ...options
  }: NodeRendererComponentProps = $props()

  const inheritedOptions = $derived.by(() => {
    if (!context)
      return {}
    const {
      customComponents: _customComponents,
      codeBlockThemes: _codeBlockThemes,
      events: _events,
      indexKey: _indexKey,
      streamRenderVersion: _streamRenderVersion,
      textStreamState: _textStreamState,
      ...options
    } = context
    return options
  })
  const resolvedOptions = $derived({
    ...inheritedOptions,
    ...options,
  })

  let streamRenderVersion = $state(0)
  let previousContent: NodeRendererProps<TCustomNode>['content']
  let previousNodes: NodeRendererProps<TCustomNode>['nodes']

  const textStreamState = new Map<string, string>()
  const scopedCustomComponents = new ScopedCustomComponents(
    () => resolvedOptions.customId,
  )
  const rendererStream = new NodeRendererStream({
    getContent: () => content,
    getHasProvidedNodes: () => Array.isArray(nodes),
    getRequestedFinal: () => (
      resolvedOptions.final ?? resolvedOptions.parseOptions?.final
    ),
    getSmoothStreaming: () => resolvedOptions.smoothStreaming ?? 'auto',
    getSmoothStreamingOptions: () => resolvedOptions.smoothStreamingOptions,
    getTypewriter: () => resolvedOptions.typewriter ?? false,
    getMaxLiveNodes: () => resolvedOptions.maxLiveNodes ?? 320,
  })

  const activeOptions = $derived({
    ...resolvedOptions,
    final: rendererStream.effectiveFinal,
  })
  const rendererProps = $derived({
    ...activeOptions,
    content: rendererStream.renderContent,
    nodes,
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
    const debugPerformance = resolvedOptions.debugPerformance ?? false
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
    {
      ...context?.customComponents,
      ...scopedCustomComponents.components,
      ...customComponents,
    },
  ))
  const renderContext = $derived<SvelteRenderContext>(buildRenderContext(
    activeOptions,
    {
      onCopy,
      onHandleArtifactClick,
    },
    textStreamState,
    mergedComponents,
    context,
    {
      indexKey: indexKey == null ? context?.indexKey : String(indexKey),
      streamRenderVersion,
    },
  ))

  const renderBatch = new RenderBatch(
    () => parsedNodes.length,
    () => ({
      enabled: resolvedOptions.batchRendering ?? true,
      final: rendererStream.effectiveFinal,
      initialSize: resolvedOptions.initialRenderBatchSize ?? 40,
      size: resolvedOptions.renderBatchSize ?? 80,
      delayMs: resolvedOptions.renderBatchDelay ?? 16,
      budgetMs: resolvedOptions.renderBatchBudgetMs ?? 6,
      idleTimeoutMs: resolvedOptions.renderBatchIdleTimeoutMs ?? 120,
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
    getEnabled: () => resolvedOptions.typewriter ?? false,
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

  const rootKey = $derived(
    indexKey == null
      ? 'markdown-renderer'
      : String(indexKey),
  )
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  {@attach (element) => htmlEnhancements.attachment(element)}
  {@attach (element) => typewriterCursor.rootAttachment(element)}
  class="markstream-svelte markdown-renderer {className}"
  class:dark={renderContext.isDark}
  data-custom-id={renderContext.customId}
  onclick={onClick}
  onmouseover={handleMouseover}
  onmouseout={handleMouseout}
>
  {#each renderedNodes as node, index (`${rootKey}-${index}`)}
    <div class="node-slot" data-node-index={index} data-node-type={node.type}>
      <div
        class="node-content"
        class:fade-node={renderContext.fade && node.type !== 'code_block'}
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
