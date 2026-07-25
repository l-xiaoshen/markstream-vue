<script lang="ts">
  import type { LinkNode as ParserLinkNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import { sanitizeHtmlAttrs, shouldOpenLinkInNewTab } from 'stream-markdown-parser'
  import { hideTooltip, showTooltipForAnchor } from '../tooltip/singletonTooltip'
  import RenderChildren from './RenderChildren.svelte'

  type Props = IndexedNodeProps<ParserLinkNode>

  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: Props = $props()

  let href = $derived(sanitizeHtmlAttrs({ href: node.href }, 'safe', 'a').href ?? '')
  let title = $derived(node.title || href)
  let children = $derived(node.children)
  let tooltipEnabled = $derived(context?.showTooltips ?? true)
  let isHashLink = $derived(href.startsWith('#') && href.length > 1)
  let openInNewTab = $derived(shouldOpenLinkInNewTab(href))

  function showLinkTooltip(event: MouseEvent | FocusEvent) {
    if (!tooltipEnabled || !title)
      return
    const anchor = event.currentTarget
    if (!(anchor instanceof HTMLElement))
      return
    showTooltipForAnchor(anchor, title, 'top', false, undefined, context?.isDark)
  }

  function scrollToHashTarget(event: MouseEvent) {
    if (!isHashLink || typeof document === 'undefined')
      return
    event.preventDefault()
    const rawId = href.slice(1)
    const decodedId = safeDecodeHashId(rawId)
    const target = document.getElementById(rawId) || (decodedId !== rawId ? document.getElementById(decodedId) : null)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function safeDecodeHashId(value: string) {
    try {
      return decodeURIComponent(value)
    }
    catch {
      return value
    }
  }
</script>
<a class:link-loading={node.loading === true} class="link-node" href={href || undefined} title={tooltipEnabled ? undefined : title} onblur={() => hideTooltip()} onclick={scrollToHashTarget} onfocus={showLinkTooltip} onmouseleave={() => hideTooltip()} onmouseenter={showLinkTooltip} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noreferrer noopener' : undefined}><span class="link-text-wrapper"><span class="link-text">{#if children.length}<RenderChildren nodes={children} context={context} prefix={String(indexKey ?? 'link') + '-link'} />{:else}{node.text || href}{/if}</span>{#if node.loading}<span class="link-loading-indicator"></span>{/if}</span></a>
