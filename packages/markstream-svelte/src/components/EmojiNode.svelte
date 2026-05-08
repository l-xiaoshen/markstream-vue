<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  interface Props {
    node: SvelteRenderableNode<'emoji'>
  }

  let { node }: Props = $props();

  let value = $derived(node.raw || node.markup || node.name || '');
</script>
<span class="emoji-node">{value}</span>
