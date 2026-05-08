<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import RenderChildren from './RenderChildren.svelte'
  import { getNodeList } from './shared/node-helpers'
  import { ParsedNode } from 'stream-markdown-parser';

  type Props = {
    node: SvelteRenderableNode & { children: readonly ParsedNode[] }
    context?: SvelteRenderContext
    indexKey?: string | number
    tag?: string
  };
  let {
    node,
    context = undefined,
    indexKey = undefined,
    tag = 'span'
  }: Props = $props()
</script>

<svelte:element this={tag}><RenderChildren nodes={getNodeList(node.children)} {context} prefix={String(indexKey ?? tag) + '-' + tag} /></svelte:element>
