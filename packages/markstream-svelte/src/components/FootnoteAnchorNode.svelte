<script lang="ts">
  import type { FootnoteAnchorNode as ParserFootnoteAnchorNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'

  let { node }: NodeProps<ParserFootnoteAnchorNode> = $props()

  let id = $derived(node.id)
  let href = $derived(id ? `#fnref-${id}` : undefined)

  function scrollToReference(event: MouseEvent) {
    event.preventDefault()
    if (typeof document === 'undefined' || !id)
      return
    const target = document.getElementById(`fnref-${id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
</script>

<a class="footnote-anchor" href={href} title={id ? `返回引用 ${id}` : undefined} onclick={scrollToReference}>
  ↩︎
</a>
