<script lang="ts">
  import type { ListItemNode as ParserListItemNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: NodeProps<ParserListItemNode> = $props()
</script>

<li><RenderChildren nodes={node.children} {context} prefix={String(indexKey ?? 'li') + '-li'} /></li>
