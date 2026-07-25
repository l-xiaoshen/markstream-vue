<script lang="ts">
  import MarkdownRender, {
    type MarkstreamCustomComponentProps,
  } from 'markstream-svelte'
  import type { ThinkingNodeData } from '../types/playground'

  let {
    node,
    context = undefined,
  }: MarkstreamCustomComponentProps<
    ThinkingNodeData
  > = $props()
</script>

<section class="thinking-node">
  <header class="thinking-node__header">Thinking</header>
  <div class="thinking-node__body">
    <MarkdownRender
      content={node.content}
      final={context?.final ?? node.loading === false}
      customId={context?.customId}
      isDark={context?.isDark ?? false}
      typewriter={context?.typewriter ?? true}
      fade={context?.fade ?? true}
      smoothStreaming={context?.smoothStreaming ?? 'auto'}
      smoothStreamingOptions={context?.smoothStreamingOptions}
      customHtmlTags={context?.customHtmlTags ?? ['thinking']}
      customMarkdownIt={context?.customMarkdownIt}
      parseOptions={context?.parseOptions}
      allowHtml={context?.allowHtml}
      htmlPolicy={context?.htmlPolicy}
      renderCodeBlocksAsPre={context?.renderCodeBlocksAsPre}
      codeBlockProps={context?.codeBlockProps}
      mermaidProps={context?.mermaidProps}
      d2Props={context?.d2Props}
      infographicProps={context?.infographicProps}
      imageProps={context?.imageProps}
      mathProps={context?.mathProps}
      showTooltips={context?.showTooltips}
      batchRendering={context?.batchRendering}
    />
  </div>
</section>
