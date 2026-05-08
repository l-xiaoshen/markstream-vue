<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  interface Props {
    node: SvelteRenderableNode<'footnote_anchor'>
  }

  let { node }: Props = $props()

  let id = $derived(node.id || '')
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
