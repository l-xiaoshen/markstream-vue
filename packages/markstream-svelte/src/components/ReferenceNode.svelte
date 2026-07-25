<script lang="ts">
  import type { ReferenceNode as ParserReferenceNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined
  }: NodeProps<ParserReferenceNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>

{@html html}
