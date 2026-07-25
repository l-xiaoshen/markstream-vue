<script lang="ts">
  import type { HighlightNode as ParserHighlightNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: IndexedNodeProps<ParserHighlightNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="mark" />
