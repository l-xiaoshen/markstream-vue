<script lang="ts">
  import type { SubscriptNode as ParserSubscriptNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: IndexedNodeProps<ParserSubscriptNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="sub" />
