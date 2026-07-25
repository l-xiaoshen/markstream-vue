<script lang="ts">
  import type { InlineCodeNode as ParserInlineCodeNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import { StreamingText } from '../state/streaming/StreamingText.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: IndexedNodeProps<ParserInlineCodeNode> = $props()

  const code = $derived(node.code)
  const streamKey = $derived(
    `${String(context?.customId ?? 'global')}:${String(indexKey ?? 'inline-code')}`,
  )
  const fadeEnabled = $derived(context?.fade !== false)
  const streamInfo = new StreamingText({
    getContent: () => code,
    getFadeEnabled: () => fadeEnabled,
    getKey: () => streamKey,
    getState: () => context?.textStreamState,
  })
</script>

<code class="inline-code-node">
  {streamInfo.stableContent}
  {#if streamInfo.deltaContent}
    <span class="markstream-svelte-text__stream-delta text-node-stream-delta {streamInfo.deltaClass}">
      {streamInfo.deltaContent}
    </span>
  {/if}
</code>
