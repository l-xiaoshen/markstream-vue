<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  
  type Props = { node: SvelteRenderableNode<'checkbox' | 'checkbox_input'> };
  let { node }: Props = $props()
</script>
<input class="checkbox-node" type="checkbox" disabled checked={Boolean(node.checked)} />
