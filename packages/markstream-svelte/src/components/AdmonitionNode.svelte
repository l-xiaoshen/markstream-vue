<script lang="ts">
  import type { AdmonitionNode as ParserAdmonitionNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserAdmonitionNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
