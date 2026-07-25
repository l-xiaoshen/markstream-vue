<script lang="ts">
  import type { StrikethroughNode as ParserStrikethroughNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: IndexedNodeProps<ParserStrikethroughNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="del" />
