<script lang="ts">
  import type { TableNode as ParserTableNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined
  }: NodeProps<ParserTableNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>

{@html html}
