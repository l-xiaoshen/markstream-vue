<script lang="ts">
  import type { InsertNode as ParserInsertNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import InlineWrapNode from './InlineWrapNode.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined
  }: IndexedNodeProps<ParserInsertNode> = $props()
</script>

<InlineWrapNode {node} {context} {indexKey} tag="ins" />
