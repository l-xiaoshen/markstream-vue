<script lang="ts">
  import type { EmphasisNode as ParserEmphasisNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: IndexedNodeProps<ParserEmphasisNode> = $props()
</script>
<InlineWrapNode {node} {context} {indexKey} tag="em" />
