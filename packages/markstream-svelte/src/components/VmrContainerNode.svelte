<script lang="ts">
  import type { VmrContainerNode as ParserVmrContainerNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { renderNodeHtml } from './shared/renderNodeHtml'

  let {
    node,
    context = undefined
  }: NodeProps<ParserVmrContainerNode> = $props()

  let html = $derived(renderNodeHtml(node, context))
</script>

{@html html}
