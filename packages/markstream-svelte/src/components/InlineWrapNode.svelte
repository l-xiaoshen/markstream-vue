<script lang="ts">
  import type {
    EmphasisNode,
    HighlightNode,
    InsertNode,
    StrikethroughNode,
    StrongNode,
    SubscriptNode,
    SuperscriptNode,
  } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  type InlineContainerNode
    = | StrongNode
      | EmphasisNode
      | StrikethroughNode
      | HighlightNode
      | InsertNode
      | SubscriptNode
      | SuperscriptNode

  let {
    node,
    context = undefined,
    indexKey = undefined,
    tag = 'span'
  }: NodeProps<InlineContainerNode> & {
    tag?: string
  } = $props()
</script>

<svelte:element this={tag}><RenderChildren nodes={node.children} {context} prefix={String(indexKey ?? tag) + '-' + tag} /></svelte:element>
