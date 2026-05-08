<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import RenderChildren from './RenderChildren.svelte'
  import { getNodeList } from './shared/node-helpers'

  interface Props {
    node: SvelteRenderableNode<'blockquote'>
    context?: SvelteRenderContext | undefined;
    indexKey?: string | number | undefined;
  }

  let { node, context = undefined, indexKey = undefined }: Props = $props();

</script>
<blockquote class="blockquote blockquote-node" dir="auto"><RenderChildren nodes={getNodeList(node.children)} context={context} prefix={String(indexKey ?? 'blockquote') + '-blockquote'} /></blockquote>
