<script lang="ts">
  import type { FootnoteNode as ParserFootnoteNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import RenderChildren from './RenderChildren.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: NodeProps<ParserFootnoteNode> = $props()

  let id = $derived(node.id)
  let children = $derived(node.children)
  let prefix = $derived(`footnote-${indexKey ?? (id || 'node')}`)
</script>

<div id={id ? `fnref--${id}` : undefined} class="footnote-node">
  <div class="footnote-node__content">
    <RenderChildren nodes={children} {context} {prefix} />
  </div>
</div>
