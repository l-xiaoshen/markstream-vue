<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  type Props = {
    node: SvelteRenderableNode<'table'>
    context?: SvelteRenderContext
  };
  let {
    node,
    context = undefined
  }: Props = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>

{@html html}
