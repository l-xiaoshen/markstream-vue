<script lang="ts">
  import type { EmojiNode as ParserEmojiNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'

  let { node }: NodeProps<ParserEmojiNode> = $props()

  let value = $derived(node.raw || node.markup || node.name)
</script>
<span class="emoji-node">{value}</span>
