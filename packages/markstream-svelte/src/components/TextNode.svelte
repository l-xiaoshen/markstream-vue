<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  interface Props {
    node: SvelteRenderableNode<'text'>
    context?: SvelteRenderContext
    indexKey?: string | number
    typewriter?: boolean
  }

  let {
    node,
    context = undefined,
    indexKey = undefined,
    typewriter = undefined
  }: Props = $props()

  let previousKey = ''
  let previousContent = ''
  let deltaClass = 'markstream-svelte-text__stream-delta--a'

  const content = $derived(node.content || node.raw || '')
  const centered = $derived(Boolean(node.center))
  const streamKey = $derived(String(context?.customId ?? 'global') + ':' + String(context?.streamRenderVersion ?? 0) + ':' + String(indexKey ?? 'node'))

  const streamInfo = $derived.by(() => {
    const state = context?.textStreamState
    const previous = streamKey === previousKey ? previousContent : (state?.get(streamKey) ?? '')
    
    let stableContent = ''
    let deltaContent = ''

    if (previous && content.startsWith(previous) && content.length > previous.length) {
      stableContent = previous
      deltaContent = content.slice(previous.length)
      deltaClass = deltaClass.endsWith('--a') ? 'markstream-svelte-text__stream-delta--b' : 'markstream-svelte-text__stream-delta--a'
    }
    else {
      stableContent = content
      deltaContent = ''
    }
    
    previousKey = streamKey
    previousContent = content
    state?.set(streamKey, content)

    return { stableContent, deltaContent, deltaClass }
  })
</script>

<span data-typewriter={typewriter !== false ? '1' : undefined} class:markstream-svelte-text--centered={centered} class="markstream-svelte-text-node text-node">{streamInfo.stableContent}{#if streamInfo.deltaContent}<span class="markstream-svelte-text__stream-delta text-node-stream-delta {streamInfo.deltaClass}">{streamInfo.deltaContent}</span>{/if}</span>
