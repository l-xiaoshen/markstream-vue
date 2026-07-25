<script lang="ts">
  import type { HtmlBlockNode as ParserHtmlBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserHtmlBlockNode> = $props()
  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
