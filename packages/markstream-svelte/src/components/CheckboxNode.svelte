<script lang="ts">
  import type {
    CheckboxInputNode as ParserCheckboxInputNode,
    CheckboxNode as ParserCheckboxNode,
  } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'

  type Props = NodeProps<ParserCheckboxNode | ParserCheckboxInputNode>
  let { node }: Props = $props()
</script>
<input class="checkbox-node" type="checkbox" disabled checked={node.checked} />
