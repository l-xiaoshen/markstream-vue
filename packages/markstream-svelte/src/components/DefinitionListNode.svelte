<script lang="ts">
  import type { DefinitionListNode as ParserDefinitionListNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserDefinitionListNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
