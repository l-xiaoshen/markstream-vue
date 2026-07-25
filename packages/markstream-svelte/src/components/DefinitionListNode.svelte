<script lang="ts">
  import type { DefinitionListNode as ParserDefinitionListNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserDefinitionListNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>
{@html html}
