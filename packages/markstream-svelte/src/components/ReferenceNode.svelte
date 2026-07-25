<script lang="ts">
  import type { ReferenceNode as ParserReferenceNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined
  }: ContextualNodeProps<ParserReferenceNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>

{@html html}
