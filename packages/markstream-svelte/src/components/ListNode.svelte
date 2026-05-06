<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import RenderChildren from './RenderChildren.svelte'
  import { getNodeList } from './shared/node-helpers'
  
  interface Props {
    node: SvelteRenderableNode<'list'>
    context?: SvelteRenderContext;
    indexKey?: string | number;
  }
  
  let { node, context, indexKey }: Props = $props();
  
  let ordered = $derived(Boolean(node.ordered));
  let start = $derived(Number(node.start));
  let tag = $derived(ordered ? 'ol' : 'ul');
</script>
{#if ordered}
  <ol start={Number.isFinite(start) ? start : undefined}><RenderChildren nodes={getNodeList(node.items)} context={context} prefix={String(indexKey ?? 'list') + '-list'} /></ol>
{:else}
  <ul><RenderChildren nodes={getNodeList(node.items)} context={context} prefix={String(indexKey ?? 'list') + '-list'} /></ul>
{/if}
