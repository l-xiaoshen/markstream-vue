<script lang="ts">
  import type { BaseNode } from 'stream-markdown-parser'
  import type { SvelteRenderContext } from '../types/renderer'
  import NodeOutlet from './NodeOutlet.svelte'

  type Props = {
    nodes?: readonly BaseNode[] | null | undefined
    context?: SvelteRenderContext | undefined
    prefix?: string | undefined
  }
  let {
    nodes = [],
    context = undefined,
    prefix = 'child',
  }: Props = $props()
</script>

{#each nodes || [] as child, index (prefix + '-' + index)}
  <NodeOutlet node={child} context={context} indexKey={prefix + '-' + index} />
{/each}
