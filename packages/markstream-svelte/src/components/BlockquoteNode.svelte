<script lang="ts">
  import type { BlockquoteNode as ParserBlockquoteNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: IndexedNodeProps<ParserBlockquoteNode> = $props()
  let cite = $derived(resolveCite(node))

  function resolveCite(blockquote: ParserBlockquoteNode): string {
    if (!('cite' in blockquote))
      return ''
    return blockquote.cite == null ? '' : String(blockquote.cite)
  }
</script>
<blockquote class="blockquote blockquote-node" dir="auto" cite={cite || undefined}><RenderChildren nodes={node.children} context={context} prefix={String(indexKey ?? 'blockquote') + '-blockquote'} /></blockquote>
