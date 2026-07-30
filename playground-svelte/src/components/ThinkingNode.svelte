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
      {context}
    />
  </div>
</section>
