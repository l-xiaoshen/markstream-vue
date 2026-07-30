import type {
  MarkdownNodeOfType,
  TextSpecialNode,
} from '../../types/nodes'
import type {
  RenderContext,
  RenderNodesToHtml,
} from './context'
import {
  isUnsafeHtmlUrl,
  sanitizeImageSrc,
  shouldOpenLinkInNewTab,
} from 'stream-markdown-parser'
import { escapeAttr, escapeHtml } from '../../utils/rendering/html'

export function renderTextNode(node: MarkdownNodeOfType<'text'>): string {
  const escaped = escapeHtml(node.content)
  if (!node.center && !node.content.includes('\n'))
    return escaped

  const className = node.center
    ? 'markstream-svelte-text-node markstream-svelte-text--centered'
    : 'markstream-svelte-text-node'
  return `<span class="${className}">${escaped}</span>`
}

export function renderTextSpecialNode(node: TextSpecialNode): string {
  return escapeHtml(node.content)
}

export function renderLinkNode(
  node: MarkdownNodeOfType<'link'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const content = node.children.length > 0
    ? renderNodesToHtml(node.children, context)
    : escapeHtml(node.text || node.href)
  const titleAttr = node.title ? ` title="${escapeAttr(node.title)}"` : ''
  const safeHref = node.href && !isUnsafeHtmlUrl(node.href) ? node.href : ''
  const hrefAttr = safeHref ? ` href="${escapeAttr(safeHref)}"` : ''
  const externalAttrs = shouldOpenLinkInNewTab(safeHref)
    ? ' target="_blank" rel="noreferrer noopener"'
    : ''
  return `<a${hrefAttr}${titleAttr}${externalAttrs}>${content}</a>`
}

export function renderImageNode(node: MarkdownNodeOfType<'image'>): string {
  const src = sanitizeImageSrc(node.src)
  if (!src)
    return ''
  const titleAttr = node.title ? ` title="${escapeAttr(node.title)}"` : ''
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(node.alt)}"${titleAttr}>`
}

export function renderMathInlineNode(node: MarkdownNodeOfType<'math_inline'>): string {
  const source = escapeHtml(node.content || node.markup || node.raw)
  return `<span class="markstream-nested-math" data-display="inline"><span class="markstream-nested-math__source">${source}</span><span class="markstream-nested-math__render" aria-hidden="true"></span></span>`
}
