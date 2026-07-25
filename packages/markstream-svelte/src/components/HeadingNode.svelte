<script lang="ts">
  import type { HeadingNode as ParserHeadingNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { clampHeadingLevel } from '../utils/rendering/html'
  import RenderChildren from './RenderChildren.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: NodeProps<ParserHeadingNode> = $props()
  let level = $derived(clampHeadingLevel(node.level))
  let tag = $derived('h' + level)
</script>

<svelte:element this={tag} class="heading-node heading-{level}">
  <RenderChildren nodes={node.children} {context} prefix={String(indexKey ?? 'heading') + '-heading'} />
</svelte:element>
