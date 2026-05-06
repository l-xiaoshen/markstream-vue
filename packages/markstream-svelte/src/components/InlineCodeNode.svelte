<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  import { getString } from './shared/node-helpers'
  
  interface Props {
    node: SvelteRenderableNode<'inline_code'>
  }
  
  let { node }: Props = $props();
  
  let code = $derived(getString(node.code ?? node.content ?? node.raw));
</script>
<code class="inline-code-node">{code}</code>
