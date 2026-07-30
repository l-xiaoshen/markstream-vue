<script lang="ts">
  import type { FootnoteReferenceNode as ParserFootnoteReferenceNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'

  let { node }: NodeProps<ParserFootnoteReferenceNode> = $props()

  let id = $derived(node.id)
  let href = $derived(id ? `#fnref--${id}` : undefined)
  let linkAttrs = $derived(href ? { href } : {})

  function scrollToFootnote(event: MouseEvent) {
    event.preventDefault()
    if (typeof document === 'undefined' || !id)
      return
    const target = document.querySelector(href || '')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<sup id={id ? `fnref-${id}` : undefined} class="footnote-reference" onclick={scrollToFootnote}>
  <span {...linkAttrs} title={id ? `查看脚注 ${id}` : undefined} class="footnote-link cursor-pointer">
    [{id}]
  </span>
</sup>
