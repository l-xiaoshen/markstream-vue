<script lang="ts">
  import type { StrongNode as ParserStrongNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: NodeProps<ParserStrongNode> = $props()
</script>
<InlineWrapNode {node} {context} {indexKey} tag="strong" />
