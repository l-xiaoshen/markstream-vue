<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  interface Props {
    node: SvelteRenderableNode<'inline_code'>
  }
  
  let { node }: Props = $props();
  
  let code = $derived(node.code || node.raw || '');
</script>
<code class="inline-code-node">{code}</code>
