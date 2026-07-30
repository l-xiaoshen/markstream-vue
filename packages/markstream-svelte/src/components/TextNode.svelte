<script lang="ts">
  import type { TextNode as ParserTextNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import type { TextSpecialNode } from '../types/nodes'
  import { StreamingText } from '../state/streaming/StreamingText.svelte'

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: NodeProps<ParserTextNode | TextSpecialNode> = $props()

  const content = $derived(node.content)
  const centered = $derived(node.type === 'text' && node.center === true)
  const streamKey = $derived(`${String(context?.customId ?? 'global')}:${String(indexKey ?? 'node')}`)
  const fadeEnabled = $derived(context?.fade !== false)
  const streamInfo = new StreamingText({
    getContent: () => content,
    getFadeEnabled: () => fadeEnabled,
    getKey: () => streamKey,
    getState: () => context?.textStreamState,
  })
</script>

<span data-typewriter={context?.typewriter === true ? '1' : undefined} class:markstream-svelte-text--centered={centered} class="markstream-svelte-text-node text-node">{streamInfo.stableContent}{#if streamInfo.deltaContent}<span class="markstream-svelte-text__stream-delta text-node-stream-delta {streamInfo.deltaClass}">{streamInfo.deltaContent}</span>{/if}</span>
