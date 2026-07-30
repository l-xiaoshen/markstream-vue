<script lang="ts">
  import type { SuperscriptNode as ParserSuperscriptNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: NodeProps<ParserSuperscriptNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="sup" />
