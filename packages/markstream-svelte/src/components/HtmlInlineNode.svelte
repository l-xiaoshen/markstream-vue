<script lang="ts">
  import type { HtmlInlineNode as ParserHtmlInlineNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserHtmlInlineNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
