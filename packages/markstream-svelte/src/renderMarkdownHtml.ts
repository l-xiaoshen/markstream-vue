import type { BaseNode, CustomComponentAttrs, HtmlPolicy, ParsedNode, ParseOptions, FootnoteAnchorNode } from 'stream-markdown-parser'

import {
  getMarkdown,
  isHtmlTagBlocked,
  isUnsafeHtmlUrl,
  NON_STRUCTURING_HTML_TAGS,
  normalizeCustomHtmlTagName,
  normalizeCustomHtmlTags,
  parseMarkdownToStructure,
  sanitizeHtmlAttrs,
} from 'stream-markdown-parser'
import { hydrateCustomTagContent } from './hydrateCustomTagContent'
import { sanitizeHtmlContent } from './sanitizeHtmlContent'

type ExtractStrictNodes<T> = T extends { type: infer U } ? (string extends U ? never : T) : never
type StrictParsedNode = ExtractStrictNodes<ParsedNode>

type ExtendedParsedNode = StrictParsedNode | FootnoteAnchorNode

export type RenderableMarkdownNode<T extends string = string> = 
  string extends T 
    ? ExtendedParsedNode
    : Extract<ExtendedParsedNode, { type: T }> extends never 
      ? BaseNode 
      : Extract<ExtendedParsedNode, { type: T }>

type NestedClassValue = string | readonly string[] | null | undefined

export interface MarkstreamSvelteRenderOptions {
  content?: string | null
  nodes?: readonly RenderableMarkdownNode[] | null
  final?: boolean
  parseOptions?: ParseOptions
  customHtmlTags?: readonly string[]
  allowHtml?: boolean
  htmlPolicy?: HtmlPolicy
}

export interface NestedMarkdownHtmlOptions {
  cacheKey?: string
  customHtmlTags?: readonly string[]
  allowHtml?: boolean
  htmlPolicy?: HtmlPolicy
  customNodeTag?: string
  customNodeClass?: NestedClassValue | ((node: RenderableMarkdownNode) => NestedClassValue)
}

export interface NestedMarkdownHtmlInput {
  node?: RenderableMarkdownNode | null
  nodes?: readonly RenderableMarkdownNode[] | null
  content?: string | null
}

interface RenderContext {
  markdown: ReturnType<typeof getMarkdown>
  options: Required<Pick<NestedMarkdownHtmlOptions, 'allowHtml' | 'customNodeTag' | 'htmlPolicy'>> & Pick<NestedMarkdownHtmlOptions, 'customNodeClass'>
}

const DEFAULT_CACHE_KEY = 'markstream-svelte-html'
const DEFAULT_CUSTOM_NODE_TAG = 'div'
const markdownCache = new Map<string, ReturnType<typeof getMarkdown>>()
const KNOWN_NODE_TYPES = new Set([
  'admonition',
  'blockquote',
  'checkbox',
  'checkbox_input',
  'code_block',
  'definition_item',
  'definition_list',
  'emoji',
  'emphasis',
  'footnote',
  'footnote_reference',
  'footnote_anchor',
  'hardbreak',
  'heading',
  'highlight',
  'html_block',
  'html_inline',
  'image',
  'inline_code',
  'insert',
  'link',
  'list',
  'list_item',
  'math_block',
  'math_inline',
  'paragraph',
  'reference',
  'strikethrough',
  'strong',
  'subscript',
  'superscript',
  'table',
  'table_cell',
  'table_row',
  'text',
  'thematic_break',
])

export function renderMarkdownToHtml(input: MarkstreamSvelteRenderOptions): string {
  const normalizedTags = normalizeCustomHtmlTags([
    ...(input.customHtmlTags || []),
    ...(input.parseOptions?.customHtmlTags || []),
  ])
  const ctx = createRenderContext({
    allowHtml: input.allowHtml,
    customHtmlTags: normalizedTags,
    htmlPolicy: input.htmlPolicy,
  })
  const nodes = resolveParsedNodes(input, ctx)
  return renderNodesToHtml(nodes, ctx)
}

export function renderNestedMarkdownToHtml(
  input: NestedMarkdownHtmlInput,
  options: NestedMarkdownHtmlOptions = {},
): string {
  const ctx = createRenderContext(options)
  return renderNestedInputToHtml(input, ctx)
}

export function renderMarkdownNodesToHtml(
  nodes: readonly RenderableMarkdownNode[] | null | undefined,
  options: NestedMarkdownHtmlOptions = {},
): string {
  const ctx = createRenderContext(options)
  return renderNodesToHtml(nodes, ctx)
}

export function renderMarkdownNodeToHtml(
  node: RenderableMarkdownNode | null | undefined,
  options: NestedMarkdownHtmlOptions = {},
): string {
  const ctx = createRenderContext(options)
  return renderNodeToHtml(node, ctx)
}

function resolveParsedNodes(input: MarkstreamSvelteRenderOptions, ctx: RenderContext) {
  if (Array.isArray(input.nodes))
    return input.nodes

  const content = input.content || ''
  if (!content)
    return []

  const normalizedTags = normalizeCustomHtmlTags([
    ...(input.customHtmlTags || []),
    ...(input.parseOptions?.customHtmlTags || []),
  ])
  const mergedParseOptions: ParseOptions = {
    ...(input.parseOptions ?? {}),
  }
  if (typeof input.final === 'boolean')
    mergedParseOptions.final = input.final
  if (normalizedTags.length > 0)
    mergedParseOptions.customHtmlTags = normalizedTags

  return hydrateCustomTagContent<RenderableMarkdownNode>(
    parseMarkdownToStructure(content, ctx.markdown, mergedParseOptions) as RenderableMarkdownNode[],
    content,
    normalizedTags,
  )
}

function createRenderContext(options: NestedMarkdownHtmlOptions): RenderContext {
  const normalizedTags = normalizeCustomHtmlTags(options.customHtmlTags)
  const cacheKey = `${options.cacheKey || DEFAULT_CACHE_KEY}::${normalizedTags.join(',')}`
  let markdown = markdownCache.get(cacheKey)

  if (!markdown) {
    markdown = getMarkdown(cacheKey, {
      customHtmlTags: normalizedTags,
    })
    markdownCache.set(cacheKey, markdown)
  }

  return {
    markdown,
    options: {
      allowHtml: options.allowHtml !== false,
      htmlPolicy: options.htmlPolicy ?? 'safe',
      customNodeTag: normalizeCustomHtmlTagName(options.customNodeTag) || DEFAULT_CUSTOM_NODE_TAG,
      customNodeClass: options.customNodeClass,
    },
  }
}

function renderNestedInputToHtml(input: NestedMarkdownHtmlInput, ctx: RenderContext): string {
  if (Array.isArray(input.nodes) && input.nodes.length > 0)
    return renderNodesToHtml(input.nodes, ctx)

  const node = input.node
  if (node) {
    const children = getNodeList('children' in node ? node.children : undefined)
    if (children.length > 0)
      return renderNodesToHtml(children, ctx)

    const content = ('content' in node && typeof node.content === 'string' ? node.content : '') || ''
    if (content)
      return renderMarkdownFragment(content, ctx)

    if (node.raw != null)
      return escapeHtml(node.raw || '')
  }

  return input.content ? renderMarkdownFragment(input.content, ctx) : ''
}

function renderNodesToHtml(nodes: readonly RenderableMarkdownNode[] | null | undefined, ctx: RenderContext): string {
  return (Array.isArray(nodes) ? nodes : []).map(node => renderNodeToHtml(node, ctx)).join('')
}

function isNodeType<T extends string>(node: RenderableMarkdownNode, type: T): node is Extract<RenderableMarkdownNode, { type: T }> {
  return node.type === type
}

function renderNodeToHtml(node: RenderableMarkdownNode | null | undefined, ctx: RenderContext): string {
  if (!node || typeof node !== 'object')
    return ''

  if (isNodeType(node, 'text')) return renderTextNode(node)
  if (isNodeType(node, 'paragraph')) return `<p>${renderNodesToHtml(getNodeList(node.children), ctx)}</p>`
  if (isNodeType(node, 'strong')) return `<strong>${renderNodesToHtml(getNodeList(node.children), ctx)}</strong>`
  if (isNodeType(node, 'emphasis')) return `<em>${renderNodesToHtml(getNodeList(node.children), ctx)}</em>`
  if (isNodeType(node, 'strikethrough')) return `<del>${renderNodesToHtml(getNodeList(node.children), ctx)}</del>`
  if (isNodeType(node, 'highlight')) return `<mark>${renderNodesToHtml(getNodeList(node.children), ctx)}</mark>`
  if (isNodeType(node, 'insert')) return `<ins>${renderNodesToHtml(getNodeList(node.children), ctx)}</ins>`
  if (isNodeType(node, 'subscript')) return `<sub>${renderNodesToHtml(getNodeList(node.children), ctx)}</sub>`
  if (isNodeType(node, 'superscript')) return `<sup>${renderNodesToHtml(getNodeList(node.children), ctx)}</sup>`
  if (isNodeType(node, 'inline_code')) return `<code>${escapeHtml(node.code || '')}</code>`
  if (isNodeType(node, 'hardbreak')) return '<br>'
  if (isNodeType(node, 'link')) return renderLinkNode(node, ctx)
  if (isNodeType(node, 'image')) return renderImageNode(node)
  if (isNodeType(node, 'list')) return renderListNode(node, ctx)
  if (isNodeType(node, 'list_item')) return `<li>${renderNodesToHtml(getNodeList(node.children), ctx)}</li>`
  if (isNodeType(node, 'blockquote')) return `<blockquote>${renderNodesToHtml(getNodeList(node.children), ctx)}</blockquote>`
  if (isNodeType(node, 'heading')) return renderHeadingNode(node, ctx)
  if (isNodeType(node, 'code_block')) return renderCodeBlockNode(node)
  if (isNodeType(node, 'thematic_break')) return '<hr>'
  if (isNodeType(node, 'table')) return renderTableNode(node, ctx)
  if (isNodeType(node, 'table_row')) return renderTableRowNode(node, ctx)
  if (isNodeType(node, 'table_cell')) return renderTableCellNode(node, ctx)
  if (isNodeType(node, 'definition_list')) return renderDefinitionListNode(node, ctx)
  if (isNodeType(node, 'definition_item')) return renderDefinitionItemNode(node, ctx)
  if (isNodeType(node, 'footnote')) return renderFootnoteNode(node, ctx)
  if (isNodeType(node, 'footnote_reference')) return renderFootnoteReferenceNode(node)
  if (isNodeType(node, 'footnote_anchor')) return renderFootnoteAnchorNode(node)
  if (isNodeType(node, 'admonition')) return renderAdmonitionNode(node, ctx)
  if (isNodeType(node, 'checkbox') || isNodeType(node, 'checkbox_input')) return `<input type="checkbox" disabled${node.checked ? ' checked' : ''}>`
  if (isNodeType(node, 'emoji')) return escapeHtml(node.raw || node.markup || ('content' in node && typeof node.content === 'string' ? node.content : '') || node.name || '')
  if (isNodeType(node, 'math_inline')) return renderMathInlineNode(node)
  if (isNodeType(node, 'math_block')) return renderMathBlockNode(node)
  if (isNodeType(node, 'reference')) return `<span class="markstream-nested-reference">${escapeHtml(node.id || '')}</span>`
  if (isNodeType(node, 'html_inline') || isNodeType(node, 'html_block')) return renderHtmlNode(node, ctx)

  return renderCustomOrFallbackNode(node, ctx)
}

function renderTextNode(node: RenderableMarkdownNode<'text'>): string {
  const content = node.content || ''
  const escaped = escapeHtml(content)
  const centered = !!node.center
  if (!centered && !content.includes('\n'))
    return escaped

  const className = centered
    ? 'markstream-svelte-text-node markstream-svelte-text--centered'
    : 'markstream-svelte-text-node'
  return `<span class="${className}">${escaped}</span>`
}

function renderLinkNode(node: RenderableMarkdownNode<'link'>, ctx: RenderContext): string {
  const href = node.href || ''
  const title = node.title || ''
  const content = getNodeList(node.children).length > 0
    ? renderNodesToHtml(getNodeList(node.children), ctx)
    : escapeHtml(node.text || href || '')
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
  const hrefAttr = href && !isUnsafeHtmlUrl(href) ? ` href="${escapeAttr(href)}"` : ''
  const externalAttrs = href.startsWith('#') ? '' : ' target="_blank" rel="noreferrer noopener"'
  return `<a${hrefAttr}${titleAttr}${externalAttrs}>${content}</a>`
}

function renderMathInlineNode(node: RenderableMarkdownNode<'math_inline'>) {
  const source = escapeHtml(node.content || node.markup || node.raw || '')
  return `<span class="markstream-nested-math" data-display="inline"><span class="markstream-nested-math__source">${source}</span><span class="markstream-nested-math__render" aria-hidden="true"></span></span>`
}

function renderMathBlockNode(node: RenderableMarkdownNode<'math_block'>) {
  const source = escapeHtml(node.content || node.markup || node.raw || '')
  return `<div class="markstream-nested-math-block"><pre class="markstream-nested-math-block__source"><code>${source}</code></pre><div class="markstream-nested-math-block__render" aria-hidden="true"></div></div>`
}

function renderImageNode(node: RenderableMarkdownNode<'image'>): string {
  const src = node.src || ''
  const alt = node.alt || ''
  const title = node.title || ''
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${titleAttr}>`
}

function renderListNode(node: RenderableMarkdownNode<'list'>, ctx: RenderContext): string {
  const tag = node.ordered ? 'ol' : 'ul'
  const start = node.ordered && Number.isFinite(node.start) ? ` start="${Number(node.start)}"` : ''
  return `<${tag}${start}>${renderNodesToHtml(getNodeList(node.items), ctx)}</${tag}>`
}

function renderHeadingNode(node: RenderableMarkdownNode<'heading'>, ctx: RenderContext): string {
  const level = clampHeadingLevel(node.level)
  return `<h${level}>${renderNodesToHtml(getNodeList(node.children), ctx)}</h${level}>`
}

function renderCodeBlockNode(node: RenderableMarkdownNode<'code_block'>): string {
  const rawLanguage = (node.language || '').trim()
  const language = sanitizeClassToken(rawLanguage)
  const languageClass = language ? ` class="language-${language}"` : ''
  const diff = !!node.diff
  const code = node.code || ''
  const loading = node.loading === true
  if (loading && !code.trim())
    return ''

  const blockAttrs = [
    'data-markstream-code-block="1"',
    rawLanguage ? `data-markstream-language="${escapeAttr(rawLanguage)}"` : '',
    loading ? 'data-markstream-loading="1"' : '',
    diff ? 'data-markstream-diff="1"' : '',
    diff ? `data-markstream-original="${escapeAttr(encodeDataPayload(node.originalCode || ''))}"` : '',
    diff ? `data-markstream-updated="${escapeAttr(encodeDataPayload(node.updatedCode || ''))}"` : '',
    loading ? 'aria-busy="true"' : '',
  ].filter(Boolean).join(' ')

  return `<pre ${blockAttrs}><code${languageClass}>${escapeHtml(code)}</code></pre>`
}

function renderTableNode(node: RenderableMarkdownNode<'table'>, ctx: RenderContext): string {
  const header = node.header ? renderTableRowNode(node.header, ctx, true) : ''
  const rows = renderNodesToHtml(getNodeList(node.rows), ctx)
  const thead = header ? `<thead>${header}</thead>` : ''
  const tbody = rows ? `<tbody>${rows}</tbody>` : ''
  return `<table>${thead}${tbody}</table>`
}

function renderTableRowNode(node: RenderableMarkdownNode<'table_row'>, ctx: RenderContext, forceHeader = false): string {
  const cells = getNodeList<RenderableMarkdownNode<'table_cell'>>(node.cells).map(cell => renderTableCellNode(cell, ctx, forceHeader)).join('')
  return `<tr>${cells}</tr>`
}

function renderTableCellNode(node: RenderableMarkdownNode<'table_cell'>, ctx: RenderContext, forceHeader = false): string {
  const tag = forceHeader || !!node.header ? 'th' : 'td'
  const align = node.align || ''
  const alignAttr = align ? ` style="text-align:${escapeAttr(align)}"` : ''
  return `<${tag}${alignAttr}>${renderNodesToHtml(getNodeList(node.children), ctx)}</${tag}>`
}

function renderDefinitionListNode(node: RenderableMarkdownNode<'definition_list'>, ctx: RenderContext): string {
  return `<dl>${getNodeList<RenderableMarkdownNode<'definition_item'>>(node.items).map(item => renderDefinitionItemNode(item, ctx)).join('')}</dl>`
}

function renderDefinitionItemNode(node: RenderableMarkdownNode<'definition_item'>, ctx: RenderContext): string {
  const term = renderNodesToHtml(getNodeList(node.term), ctx)
  const definition = renderNodesToHtml(getNodeList(node.definition), ctx)
  return `<dt>${term}</dt><dd>${definition}</dd>`
}

function renderFootnoteNode(node: RenderableMarkdownNode<'footnote'>, ctx: RenderContext): string {
  const id = escapeAttr(node.id || '')
  const idAttr = id ? ` id="fnref--${id}"` : ''
  return `<div${idAttr} class="footnote-node markstream-nested-footnote"><div class="footnote-node__content">${renderNodesToHtml(getNodeList(node.children), ctx)}</div></div>`
}

function renderFootnoteReferenceNode(node: RenderableMarkdownNode<'footnote_reference'>): string {
  const rawId = node.id || ''
  const id = escapeHtml(rawId)
  const attrId = escapeAttr(rawId)
  const idAttr = attrId ? ` id="fnref-${attrId}"` : ''
  const hrefAttr = attrId ? ` href="#fnref--${attrId}"` : ''
  const titleAttr = attrId ? ` title="查看脚注 ${attrId}"` : ''
  return `<sup${idAttr} class="footnote-reference markstream-nested-footnote-ref"><span${hrefAttr}${titleAttr} class="footnote-link cursor-pointer">[${id}]</span></sup>`
}

function renderFootnoteAnchorNode(node: RenderableMarkdownNode<'footnote_anchor'>): string {
  const id = escapeAttr(node.id || '')
  const hrefAttr = id ? ` href="#fnref-${id}"` : ''
  const titleAttr = id ? ` title="返回引用 ${id}"` : ''
  return `<a class="footnote-anchor"${hrefAttr}${titleAttr} aria-label="${id ? `返回引用 ${id}` : '返回引用'}">↩︎</a>`
}

function renderAdmonitionNode(node: RenderableMarkdownNode<'admonition'>, ctx: RenderContext): string {
  const kind = sanitizeClassToken(node.kind || 'note') || 'note'
  const title = node.title || '' || capitalize(kind)
  return `<div class="markstream-nested-admonition markstream-nested-admonition--${kind}"><div class="markstream-nested-admonition__title">${escapeHtml(title)}</div><div class="markstream-nested-admonition__content">${renderNodesToHtml(getNodeList(node.children), ctx)}</div></div>`
}

function renderHtmlNode(node: RenderableMarkdownNode<'html_inline' | 'html_block'>, ctx: RenderContext): string {
  const content = node.content || ''
  const rawContent = content || node.raw || ''
  const tag = (node.tag || '').trim().toLowerCase()
  const children = getNodeList(node.children)
  if (!ctx.options.allowHtml)
    return escapeHtml(rawContent)
  if (ctx.options.htmlPolicy === 'escape')
    return escapeHtml(rawContent)
  if (node.loading && !('autoClosed' in node ? node.autoClosed : false))
    return escapeHtml(rawContent)
  if (tag && children.length > 0 && !NON_STRUCTURING_HTML_TAGS.has(tag) && !isHtmlTagBlocked(tag, ctx.options.htmlPolicy)) {
    const attrs = serializeAttrs('attrs' in node ? node.attrs : undefined, '', ctx.options.htmlPolicy, tag)
    return `<${tag}${attrs}>${renderNodesToHtml(children, ctx)}</${tag}>`
  }
  return sanitizeHtmlContent(rawContent, ctx.options.htmlPolicy)
}

function hasAttrs(node: object): node is { attrs?: CustomComponentAttrs | null } {
  return 'attrs' in node
}

function renderCustomOrFallbackNode(node: RenderableMarkdownNode, ctx: RenderContext): string {
  const tagName = ('tag' in node && typeof node.tag === 'string' ? node.tag : '') || node.type || ''
  if (!tagName || KNOWN_NODE_TYPES.has(tagName))
    return escapeHtml(('content' in node && typeof node.content === 'string' ? node.content : '') || node.raw || '')

  const classes = [
    'markstream-nested-custom',
    `markstream-nested-custom--${sanitizeClassToken(tagName) || 'node'}`,
    resolveCustomNodeClass(node, ctx.options.customNodeClass),
  ].filter(Boolean).join(' ')
  const attrs = serializeAttrs(hasAttrs(node) ? node.attrs : undefined, classes, ctx.options.htmlPolicy)
  const body = resolveCustomNodeBody(node, ctx)
  const wrapperTag = ctx.options.customNodeTag
  return `<${wrapperTag}${attrs} data-markstream-custom-tag="${escapeAttr(tagName)}">${body}</${wrapperTag}>`
}

function resolveCustomNodeBody(node: RenderableMarkdownNode, ctx: RenderContext): string {
  const children = getNodeList('children' in node ? node.children : undefined)
  if (children.length > 0)
    return renderNodesToHtml(children, ctx)

  const content = ('content' in node && typeof node.content === 'string' ? node.content : '') || ''
  if (content)
    return renderMarkdownFragment(content, ctx)

  return escapeHtml(node.raw || '')
}

function renderMarkdownFragment(content: string, ctx: RenderContext): string {
  return content ? ctx.markdown.render(content) : ''
}

function resolveCustomNodeClass(
  node: RenderableMarkdownNode,
  customNodeClass?: NestedMarkdownHtmlOptions['customNodeClass'],
): string {
  if (!customNodeClass)
    return ''
  const resolved = typeof customNodeClass === 'function'
    ? customNodeClass(node)
    : customNodeClass
  return serializeClassValue(resolved)
}

function serializeClassValue(value: NestedClassValue): string {
  if (Array.isArray(value))
    return value.map(item => serializeClassValue(item)).filter(Boolean).join(' ')
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function serializeAttrs(
  attrs?: CustomComponentAttrs | null,
  extraClass = '',
  policy: HtmlPolicy = 'safe',
  tagName?: string,
): string {
  const pairs = normalizeAttrs(attrs)
  const record: Record<string, string> = {}
  const mergedClasses = [extraClass]

  for (const [name, value] of pairs) {
    const safeName = String(name).trim()
    if (!safeName)
      continue
    if (safeName.toLowerCase() === 'class') {
      mergedClasses.push(String(value))
      continue
    }
    record[safeName] = value === true ? '' : String(value)
  }

  const rendered = Object.entries(sanitizeHtmlAttrs(record, policy, tagName))
    .map(([name, value]) => value === '' ? ` ${name}` : ` ${name}="${escapeAttr(String(value))}"`)

  const className = mergedClasses.map(value => value.trim()).filter(Boolean).join(' ')
  if (className)
    rendered.unshift(` class="${escapeAttr(className)}"`)
  return rendered.join('')
}

function normalizeAttrs(attrs?: CustomComponentAttrs | null): Array<[string, string | boolean]> {
  if (!attrs)
    return []

  if (Array.isArray(attrs)) {
    if (attrs.length === 0)
      return []
    const first = attrs[0]
    if (Array.isArray(first))
      return (attrs as [string, string][]).map(([name, value]) => [String(name), value])
    return (attrs as Array<{ name: string, value: string | boolean }>).map(item => [String(item.name), item.value])
  }

  return Object.entries(attrs).map(([name, value]) => [name, value])
}

function getNodeList<T extends RenderableMarkdownNode = RenderableMarkdownNode>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter((item): item is T => !!item && typeof item === 'object')
    : []
}

function sanitizeClassToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function clampHeadingLevel(value: unknown): number {
  const level = Math.trunc(Number(value) || 1)
  return Math.min(6, Math.max(1, level))
}

function escapeHtml(value: unknown): string {
  const strValue = typeof value === 'string' ? value : (value == null ? '' : String(value))
  return strValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function capitalize(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : ''
}

function encodeDataPayload(value: string) {
  if (!value)
    return ''

  // eslint-disable-next-line ts/no-explicit-any
  const globalBuffer = (globalThis as any)?.require?.('buffer')?.Buffer
  if (globalBuffer?.from)
    return globalBuffer.from(value, 'utf8').toString('base64')

  if (typeof TextEncoder !== 'undefined' && typeof globalThis.btoa === 'function') {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    for (const byte of bytes)
      binary += String.fromCharCode(byte)
    return globalThis.btoa(binary)
  }

  return ''
}
