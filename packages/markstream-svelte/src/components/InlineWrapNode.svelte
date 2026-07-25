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
  import type { IndexedNodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  type InlineContainerNode
    = | StrongNode
      | EmphasisNode
      | StrikethroughNode
      | HighlightNode
      | InsertNode
      | SubscriptNode
      | SuperscriptNode

  type Props = IndexedNodeProps<InlineContainerNode> & {
    tag?: string
  }
  let {
    node,
    context = undefined,
    indexKey = undefined,
    tag = 'span'
  }: Props = $props()
</script>

<svelte:element this={tag}><RenderChildren nodes={node.children} {context} prefix={String(indexKey ?? tag) + '-' + tag} /></svelte:element>
