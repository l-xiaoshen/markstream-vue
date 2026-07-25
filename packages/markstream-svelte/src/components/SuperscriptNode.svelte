<script lang="ts">
  import type { SuperscriptNode as ParserSuperscriptNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: IndexedNodeProps<ParserSuperscriptNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="sup" />
