import type {
  BaseNode,
  HtmlBlockNode,
  HtmlInlineNode,
} from 'stream-markdown-parser'
import type { KnownMarkdownNode } from '../../types/nodes'
import type { RenderContext } from './context'
import {
  isHtmlTagBlocked,
  NON_STRUCTURING_HTML_TAGS,
} from 'stream-markdown-parser'
import { sanitizeHtmlContent } from '../../sanitizeHtmlContent'
import {
  getRenderableNodeChildren,
  isKnownMarkdownNode,
} from '../../types/nodes'
import {
  escapeAttr,
  escapeHtml,
  sanitizeClassToken,
  serializeClassValue,
  serializeCustomHtmlAttrs,
} from '../../utils/rendering/html'
import { getNodeAttrs, getNodeContent, getNodeTag } from '../../utils/rendering/nodes'
import {
  renderAdmonitionNode,
  renderCodeBlockNode,
  renderDefinitionItemNode,
  renderDefinitionListNode,
  renderFootnoteAnchorNode,
  renderFootnoteNode,
  renderFootnoteReferenceNode,
  renderHeadingNode,
  renderListNode,
  renderMathBlockNode,
  renderTableCellNode,
  renderTableNode,
  renderTableRowNode,
} from './block'
import {
  renderImageNode,
  renderLinkNode,
  renderMathInlineNode,
  renderTextNode,
  renderTextSpecialNode,
} from './inline'

export interface NestedHtmlRenderInput {
  node?: BaseNode | null | undefined
  nodes?: readonly BaseNode[] | null | undefined
  content?: string | null | undefined
}

export function renderNestedInputToHtml(
  input: NestedHtmlRenderInput,
  context: RenderContext,
): string {
  if (input.nodes?.length)
    return renderNodesToHtml(input.nodes, context)

  const node = input.node
  if (node) {
    const children = getRenderableNodeChildren(node)
    if (children.length > 0)
      return renderNodesToHtml(children, context)

    const content = getNodeContent(node)
    if (content)
      return renderMarkdownFragment(content, context)

    return escapeHtml(node.raw)
  }

  return input.content ? renderMarkdownFragment(input.content, context) : ''
}

export function renderNodesToHtml(
  nodes: readonly BaseNode[] | null | undefined,
  context: RenderContext,
): string {
  return (nodes ?? []).map(node => renderNodeToHtml(node, context)).join('')
}

export function renderNodeToHtml(
  node: BaseNode | null | undefined,
  context: RenderContext,
): string {
  if (!node)
    return ''
  return isKnownMarkdownNode(node)
    ? renderKnownNodeToHtml(node, context)
    : renderCustomOrFallbackNode(node, context)
}

function renderKnownNodeToHtml(node: KnownMarkdownNode, context: RenderContext): string {
  switch (node.type) {
    case 'text':
      return renderTextNode(node)
    case 'text_special':
      return renderTextSpecialNode(node)
    case 'paragraph':
      return `<p>${renderNodesToHtml(node.children, context)}</p>`
    case 'inline':
      return renderNodesToHtml(node.children, context)
    case 'strong':
      return `<strong>${renderNodesToHtml(node.children, context)}</strong>`
    case 'emphasis':
      return `<em>${renderNodesToHtml(node.children, context)}</em>`
    case 'strikethrough':
      return `<del>${renderNodesToHtml(node.children, context)}</del>`
    case 'highlight':
      return `<mark>${renderNodesToHtml(node.children, context)}</mark>`
    case 'insert':
      return `<ins>${renderNodesToHtml(node.children, context)}</ins>`
    case 'subscript':
      return `<sub>${renderNodesToHtml(node.children, context)}</sub>`
    case 'superscript':
      return `<sup>${renderNodesToHtml(node.children, context)}</sup>`
    case 'inline_code':
      return `<code>${escapeHtml(node.code)}</code>`
    case 'hardbreak':
      return '<br>'
    case 'link':
      return renderLinkNode(node, context, renderNodesToHtml)
    case 'image':
      return renderImageNode(node)
    case 'list':
      return renderListNode(node, context, renderNodesToHtml)
    case 'list_item':
      return `<li>${renderNodesToHtml(node.children, context)}</li>`
    case 'blockquote':
      return `<blockquote>${renderNodesToHtml(node.children, context)}</blockquote>`
    case 'heading':
      return renderHeadingNode(node, context, renderNodesToHtml)
    case 'code_block':
      return renderCodeBlockNode(node)
    case 'thematic_break':
      return '<hr>'
    case 'table':
      return renderTableNode(node, context, renderNodesToHtml)
    case 'table_row':
      return renderTableRowNode(node, context, renderNodesToHtml)
    case 'table_cell':
      return renderTableCellNode(node, context, renderNodesToHtml)
    case 'definition_list':
      return renderDefinitionListNode(node, context, renderNodesToHtml)
    case 'definition_item':
      return renderDefinitionItemNode(node, context, renderNodesToHtml)
    case 'footnote':
      return renderFootnoteNode(node, context, renderNodesToHtml)
    case 'footnote_reference':
      return renderFootnoteReferenceNode(node)
    case 'footnote_anchor':
      return renderFootnoteAnchorNode(node)
    case 'admonition':
      return renderAdmonitionNode(node, context, renderNodesToHtml)
    case 'checkbox':
    case 'checkbox_input':
      return `<input type="checkbox" disabled${node.checked ? ' checked' : ''}>`
    case 'emoji':
      return escapeHtml(node.raw || node.markup || node.name)
    case 'math_inline':
      return renderMathInlineNode(node)
    case 'math_block':
      return renderMathBlockNode(node)
    case 'reference':
      return `<span class="markstream-nested-reference">${escapeHtml(node.id)}</span>`
    case 'html_inline':
    case 'html_block':
      return renderHtmlNode(node, context)
    case 'vmr_container':
      return renderCustomOrFallbackNode(node, context)
    case 'label_open':
    case 'label_close':
      return ''
    default:
      return assertNever(node)
  }
}

function renderHtmlNode(
  node: HtmlInlineNode | HtmlBlockNode,
  context: RenderContext,
): string {
  const rawContent = node.content || node.raw
  const tag = (node.tag ?? '').trim().toLowerCase()
  const children = node.children ?? []
  const autoClosed = node.type === 'html_inline' && node.autoClosed === true
  if (!context.options.allowHtml || context.options.htmlPolicy === 'escape')
    return escapeHtml(rawContent)
  if (node.loading && !autoClosed)
    return escapeHtml(rawContent)
  if (
    tag
    && children.length > 0
    && !NON_STRUCTURING_HTML_TAGS.has(tag)
    && !isHtmlTagBlocked(tag, context.options.htmlPolicy)
  ) {
    const attrs = node.type === 'html_block' ? node.attrs : undefined
    const serializedAttrs = serializeCustomHtmlAttrs(
      attrs,
      '',
      context.options.htmlPolicy,
      tag,
    )
    return `<${tag}${serializedAttrs}>${renderNodesToHtml(children, context)}</${tag}>`
  }
  return sanitizeHtmlContent(rawContent, context.options.htmlPolicy)
}

function renderCustomOrFallbackNode(node: BaseNode, context: RenderContext): string {
  const tagName = getNodeTag(node) || node.type
  if (!tagName)
    return escapeHtml(getNodeContent(node) ?? node.raw)

  const classes = [
    'markstream-nested-custom',
    `markstream-nested-custom--${sanitizeClassToken(tagName) || 'node'}`,
    resolveCustomNodeClass(node, context),
  ].filter(Boolean).join(' ')
  const attrs = serializeCustomHtmlAttrs(
    getNodeAttrs(node),
    classes,
    context.options.htmlPolicy,
  )
  const body = resolveCustomNodeBody(node, context)
  const wrapperTag = context.options.customNodeTag
  return `<${wrapperTag}${attrs} data-markstream-custom-tag="${escapeAttr(tagName)}">${body}</${wrapperTag}>`
}

function resolveCustomNodeBody(node: BaseNode, context: RenderContext): string {
  const children = getRenderableNodeChildren(node)
  if (children.length > 0)
    return renderNodesToHtml(children, context)

  const content = getNodeContent(node)
  if (content)
    return renderMarkdownFragment(content, context)

  return escapeHtml(node.raw)
}

function renderMarkdownFragment(content: string, context: RenderContext): string {
  return content ? context.markdown.render(content) : ''
}

function resolveCustomNodeClass(node: BaseNode, context: RenderContext): string {
  const customNodeClass = context.options.customNodeClass
  if (!customNodeClass)
    return ''
  const resolved = typeof customNodeClass === 'function'
    ? customNodeClass(node)
    : customNodeClass
  return serializeClassValue(resolved)
}

function assertNever(node: never): never {
  throw new Error(`Unhandled known Markdown node: ${JSON.stringify(node)}`)
}
