<script lang="ts">
  import type { HighlightNode as ParserHighlightNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: NodeProps<ParserHighlightNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="mark" />
