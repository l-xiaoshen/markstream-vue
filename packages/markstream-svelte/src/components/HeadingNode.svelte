<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import RenderChildren from './RenderChildren.svelte'
  import { clampHeadingLevel, getNodeList } from './shared/node-helpers'

  interface Props {
    node: SvelteRenderableNode<'heading'>
    context?: SvelteRenderContext
    indexKey?: string | number
  }

  let { node, context = undefined, indexKey = undefined }: Props = $props()
  let level = $derived(clampHeadingLevel(node.level))
  let tag = $derived('h' + level)
</script>

<svelte:element this={tag} class="heading-node heading-{level}">
  <RenderChildren nodes={getNodeList(node.children)} {context} prefix={String(indexKey ?? 'heading') + '-heading'} />
</svelte:element>
