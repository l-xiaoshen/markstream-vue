<script lang="ts">
  import type { ListNode as ParserListNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: NodeProps<ParserListNode> = $props()

  let ordered = $derived(node.ordered)
  let start = $derived(node.start)
  let tag = $derived(ordered ? 'ol' : 'ul')
</script>
{#if ordered}
  <ol start={start != null && Number.isFinite(start) ? start : undefined}><RenderChildren nodes={node.items} context={context} prefix={String(indexKey ?? 'list') + '-list'} /></ol>
{:else}
  <ul><RenderChildren nodes={node.items} context={context} prefix={String(indexKey ?? 'list') + '-list'} /></ul>
{/if}
