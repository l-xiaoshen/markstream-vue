<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  import { getString } from './shared/node-helpers'

  interface Props {
    node: SvelteRenderableNode<'emoji'>
  }

  let { node }: Props = $props();

  let value = $derived(getString(node.raw || node.markup || node.content || node.name));
</script>
<span class="emoji-node">{value}</span>
