<script lang="ts">
  import type { StrikethroughNode as ParserStrikethroughNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: NodeProps<ParserStrikethroughNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="del" />
