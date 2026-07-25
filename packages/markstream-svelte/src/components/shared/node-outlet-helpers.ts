import type {
  BaseNode,
  CodeBlockNode,
  HtmlBlockNode,
  HtmlInlineNode,
} from 'stream-markdown-parser'
import type {
  MarkstreamSvelteComponent,
  RuntimeCustomComponentMap,
} from '../../customComponents'
import type { CustomMarkdownNode } from '../../types/nodes'
import type { SvelteRenderContext } from '../../types/renderer'
import {
  getHtmlTagFromContent,
  stripCustomHtmlWrapper,
} from 'stream-markdown-parser'
import { isNodeType } from '../../types/nodes'
import { normalizeLanguageIdentifier } from '../../utils/language'

export type CodeBlockMode = 'mermaid' | 'd2' | 'infographic' | 'pre' | 'code'

export function resolveNodeOutletCodeMode(
  node: CodeBlockNode,
  context?: SvelteRenderContext,
): CodeBlockMode {
  const language = normalizeLanguageIdentifier(node.language)
  if (language === 'd2' || language === 'd2lang')
    return 'd2'
  if (language === 'infographic')
    return 'infographic'
  if (language === 'mermaid')
    return 'mermaid'
  return context?.renderCodeBlocksAsPre ? 'pre' : 'code'
}

function hasHtmlTag(node: BaseNode): node is BaseNode & { tag: string } {
  return 'tag' in node && typeof node.tag === 'string'
}

function hasHtmlContent(node: BaseNode): node is BaseNode & { content: string } {
  return 'content' in node && typeof node.content === 'string'
}

function getHtmlContent(node: BaseNode): string {
  return hasHtmlContent(node) ? node.content : ''
}

export function resolveHtmlTag(node: BaseNode): string {
  const explicitTag = hasHtmlTag(node) ? node.tag.trim().toLowerCase() : ''
  return explicitTag || getHtmlTagFromContent(getHtmlContent(node))
}

export type CoercedCustomHtmlNode<TNode extends BaseNode>
  = TNode | (Omit<TNode, 'type'> & CustomMarkdownNode<string>)

export function coerceCustomHtmlNode<TNode extends BaseNode>(
  node: TNode,
): CoercedCustomHtmlNode<TNode> {
  const tag = resolveHtmlTag(node)
  if (!tag)
    return node

  return {
    ...node,
    type: tag,
    tag,
    content: stripCustomHtmlWrapper(getHtmlContent(node), tag),
  }
}

export function coerceBuiltinHtmlNode(node: HtmlBlockNode): HtmlBlockNode
export function coerceBuiltinHtmlNode(node: HtmlInlineNode): HtmlInlineNode
export function coerceBuiltinHtmlNode(
  node: HtmlBlockNode | HtmlInlineNode,
): HtmlBlockNode | HtmlInlineNode {
  const tag = resolveHtmlTag(node)
  if (!tag)
    return node

  return {
    ...node,
    tag,
  }
}

export function resolveNodeOutletCustomComponent(
  node: BaseNode,
  context?: SvelteRenderContext,
  customComponents?: RuntimeCustomComponentMap | null,
): MarkstreamSvelteComponent | null {
  const mapping = customComponents ?? context?.customComponents ?? null
  const resolvedType = node.type

  if (isNodeType(node, 'code_block')) {
    const language = normalizeLanguageIdentifier(node.language)
    const customForLanguage = language ? mapping?.[language] : null
    if (customForLanguage)
      return customForLanguage

    const codeMode = resolveNodeOutletCodeMode(node, context)
    if (codeMode === 'mermaid' && mapping?.mermaid)
      return mapping.mermaid
    if (codeMode === 'd2' && mapping?.d2)
      return mapping.d2
    if (codeMode === 'infographic' && mapping?.infographic)
      return mapping.infographic
    if (mapping?.code_block)
      return mapping.code_block
  }

  const direct = mapping?.[resolvedType]
  if (direct)
    return direct

  const tag = resolveHtmlTag(node)
  if (tag && mapping?.[tag])
    return mapping[tag]

  return null
}
