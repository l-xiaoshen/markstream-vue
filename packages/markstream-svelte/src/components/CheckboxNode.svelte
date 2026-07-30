<script lang="ts">
  import type {
    CheckboxInputNode as ParserCheckboxInputNode,
    CheckboxNode as ParserCheckboxNode,
  } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'

  let { node }: NodeProps<ParserCheckboxNode | ParserCheckboxInputNode> = $props()
</script>
<input class="checkbox-node" type="checkbox" disabled checked={node.checked} />
