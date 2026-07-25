import type { MarkdownNodeOfType } from '../../types/nodes'
import type {
  RenderContext,
  RenderNodesToHtml,
} from './context'
import { encodeDataPayload } from '../../utils/rendering/base64'
import {
  capitalize,
  clampHeadingLevel,
  escapeAttr,
  escapeHtml,
  sanitizeClassToken,
} from '../../utils/rendering/html'

export function renderMathBlockNode(node: MarkdownNodeOfType<'math_block'>): string {
  const source = escapeHtml(node.content || node.markup || node.raw)
  return `<div class="markstream-nested-math-block"><pre class="markstream-nested-math-block__source"><code>${source}</code></pre><div class="markstream-nested-math-block__render" aria-hidden="true"></div></div>`
}

export function renderListNode(
  node: MarkdownNodeOfType<'list'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const tag = node.ordered ? 'ol' : 'ul'
  const start = node.ordered && node.start != null && Number.isFinite(node.start)
    ? ` start="${node.start}"`
    : ''
  return `<${tag}${start}>${renderNodesToHtml(node.items, context)}</${tag}>`
}

export function renderHeadingNode(
  node: MarkdownNodeOfType<'heading'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const level = clampHeadingLevel(node.level)
  return `<h${level}>${renderNodesToHtml(node.children, context)}</h${level}>`
}

export function renderCodeBlockNode(node: MarkdownNodeOfType<'code_block'>): string {
  const rawLanguage = node.language.trim()
  const language = sanitizeClassToken(rawLanguage)
  const languageClass = language ? ` class="language-${language}"` : ''
  const diff = node.diff === true
  const loading = node.loading === true
  if (loading && !node.code.trim())
    return ''

  const blockAttrs = [
    'data-markstream-code-block="1"',
    rawLanguage ? `data-markstream-language="${escapeAttr(rawLanguage)}"` : '',
    loading ? 'data-markstream-loading="1"' : '',
    diff ? 'data-markstream-diff="1"' : '',
    diff ? `data-markstream-original="${escapeAttr(encodeDataPayload(node.originalCode ?? ''))}"` : '',
    diff ? `data-markstream-updated="${escapeAttr(encodeDataPayload(node.updatedCode ?? ''))}"` : '',
    loading ? 'aria-busy="true"' : '',
  ].filter(Boolean).join(' ')

  return `<pre ${blockAttrs}><code${languageClass}>${escapeHtml(node.code)}</code></pre>`
}

export function renderTableNode(
  node: MarkdownNodeOfType<'table'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const header = renderTableRowNode(node.header, context, renderNodesToHtml, true)
  const rows = renderNodesToHtml(node.rows, context)
  const thead = header ? `<thead>${header}</thead>` : ''
  const tbody = rows ? `<tbody>${rows}</tbody>` : ''
  return `<table>${thead}${tbody}</table>`
}

export function renderTableRowNode(
  node: MarkdownNodeOfType<'table_row'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
  forceHeader = false,
): string {
  const cells = node.cells
    .map(cell => renderTableCellNode(cell, context, renderNodesToHtml, forceHeader))
    .join('')
  return `<tr>${cells}</tr>`
}

export function renderTableCellNode(
  node: MarkdownNodeOfType<'table_cell'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
  forceHeader = false,
): string {
  const tag = forceHeader || node.header ? 'th' : 'td'
  const alignAttr = node.align ? ` style="text-align:${escapeAttr(node.align)}"` : ''
  return `<${tag}${alignAttr}>${renderNodesToHtml(node.children, context)}</${tag}>`
}

export function renderDefinitionListNode(
  node: MarkdownNodeOfType<'definition_list'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const items = node.items
    .map(item => renderDefinitionItemNode(item, context, renderNodesToHtml))
    .join('')
  return `<dl>${items}</dl>`
}

export function renderDefinitionItemNode(
  node: MarkdownNodeOfType<'definition_item'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const term = renderNodesToHtml(node.term, context)
  const definition = renderNodesToHtml(node.definition, context)
  return `<dt>${term}</dt><dd>${definition}</dd>`
}

export function renderFootnoteNode(
  node: MarkdownNodeOfType<'footnote'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const id = escapeAttr(node.id)
  const idAttr = id ? ` id="fnref--${id}"` : ''
  return `<div${idAttr} class="footnote-node markstream-nested-footnote"><div class="footnote-node__content">${renderNodesToHtml(node.children, context)}</div></div>`
}

export function renderFootnoteReferenceNode(
  node: MarkdownNodeOfType<'footnote_reference'>,
): string {
  const id = escapeHtml(node.id)
  const attrId = escapeAttr(node.id)
  const idAttr = attrId ? ` id="fnref-${attrId}"` : ''
  const hrefAttr = attrId ? ` href="#fnref--${attrId}"` : ''
  const titleAttr = attrId ? ` title="查看脚注 ${attrId}"` : ''
  return `<sup${idAttr} class="footnote-reference markstream-nested-footnote-ref"><span${hrefAttr}${titleAttr} class="footnote-link cursor-pointer">[${id}]</span></sup>`
}

export function renderFootnoteAnchorNode(
  node: MarkdownNodeOfType<'footnote_anchor'>,
): string {
  const id = escapeAttr(node.id)
  const hrefAttr = id ? ` href="#fnref-${id}"` : ''
  const titleAttr = id ? ` title="返回引用 ${id}"` : ''
  return `<a class="footnote-anchor"${hrefAttr}${titleAttr} aria-label="${id ? `返回引用 ${id}` : '返回引用'}">↩︎</a>`
}

export function renderAdmonitionNode(
  node: MarkdownNodeOfType<'admonition'>,
  context: RenderContext,
  renderNodesToHtml: RenderNodesToHtml,
): string {
  const kind = sanitizeClassToken(node.kind || 'note') || 'note'
  const title = node.title || capitalize(kind)
  return `<div class="markstream-nested-admonition markstream-nested-admonition--${kind}"><div class="markstream-nested-admonition__title">${escapeHtml(title)}</div><div class="markstream-nested-admonition__content">${renderNodesToHtml(node.children, context)}</div></div>`
}
