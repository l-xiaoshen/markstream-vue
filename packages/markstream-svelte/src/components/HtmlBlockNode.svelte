<script lang="ts">
  import type { HtmlBlockNode as ParserHtmlBlockNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserHtmlBlockNode> = $props()
  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
