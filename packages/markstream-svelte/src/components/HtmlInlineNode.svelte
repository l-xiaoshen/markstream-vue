<script lang="ts">
  import type { HtmlInlineNode as ParserHtmlInlineNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserHtmlInlineNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
