<script lang="ts">
  import type { StrongNode as ParserStrongNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: IndexedNodeProps<ParserStrongNode> = $props()
</script>
<InlineWrapNode {node} {context} {indexKey} tag="strong" />
