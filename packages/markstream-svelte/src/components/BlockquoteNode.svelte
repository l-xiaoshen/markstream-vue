<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import RenderChildren from './RenderChildren.svelte'
  import { getNodeList, getString } from './shared/node-helpers'

  interface Props {
    node: SvelteRenderableNode<'blockquote'>
    context?: SvelteRenderContext | undefined;
    indexKey?: string | number | undefined;
  }

  let { node, context = undefined, indexKey = undefined }: Props = $props();

  let cite = $derived(getString(node.cite));
</script>
<blockquote class="blockquote blockquote-node" dir="auto" cite={cite || undefined}><RenderChildren nodes={getNodeList(node.children)} context={context} prefix={String(indexKey ?? 'blockquote') + '-blockquote'} /></blockquote>
