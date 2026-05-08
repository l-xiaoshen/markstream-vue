import { CustomComponentMap } from '../../customComponents'
import { clampPreviewHeight, estimateInfographicPreviewHeight, estimateMermaidPreviewHeight, parsePositiveNumber } from './diagram-height'
import type { SvelteRenderableNode, SvelteRenderContext } from './node-helpers'
import { getHtmlTagFromContent, resolveCodeBlockLanguage, stripCustomHtmlWrapper } from './node-helpers'

export type CodeBlockMode = 'mermaid' | 'd2' | 'infographic' | 'pre' | 'code'

export function resolveNodeOutletCodeMode(
  node: SvelteRenderableNode<'code_block'>,
  context?: SvelteRenderContext,
): CodeBlockMode {
  if (context?.renderCodeBlocksAsPre)
    return 'pre'

  const language = resolveCodeBlockLanguage(node)
  if (language === 'd2' || language === 'd2lang')
    return 'd2'
  if (language === 'infographic')
    return 'infographic'
  if (language === 'mermaid')
    return 'mermaid'
  return 'code'
}

export function resolveHtmlTag(node: SvelteRenderableNode<'html_block' | 'html_inline'>) {
 return String(node.tag || '').trim().toLowerCase() || getHtmlTagFromContent(node.content)
}


export function coerceBuiltinHtmlNode(
  node: SvelteRenderableNode<'html_block'>,
): SvelteRenderableNode<'html_block'>
export function coerceBuiltinHtmlNode(
  node: SvelteRenderableNode<'html_inline'>,
): SvelteRenderableNode<'html_inline'>
export function coerceBuiltinHtmlNode(
  node: SvelteRenderableNode<'html_block' | 'html_inline'>,
): SvelteRenderableNode<'html_block' | 'html_inline'> {
  const tag = resolveHtmlTag(node)
  if (!tag)
    return node

  if (node.type === 'html_block')
    return { ...node, tag }

  return { ...node, tag }
}



export function resolveNodeOutletCustomInputs(
  node: SvelteRenderableNode<'code_block'>,
  context?: SvelteRenderContext,
) {
  const codeMode = resolveNodeOutletCodeMode(node, context)
  if (codeMode === 'mermaid') {
    return withEstimatedPreviewHeight(
      context?.mermaidProps,
      estimateMermaidPreviewHeight(getNodeCode(node)),
    )
  }
  if (codeMode === 'd2')
    return context?.d2Props ?? null
  if (codeMode === 'infographic') {
    return withEstimatedPreviewHeight(
      context?.infographicProps,
      estimateInfographicPreviewHeight(getNodeCode(node)),
    )
  }
  return context?.codeBlockProps ?? null
}

function getNodeCode(node: SvelteRenderableNode) {
  return String(node.code ?? '')
}

function withEstimatedPreviewHeight(props: Record<string, any> | null | undefined, estimatedHeight: number) {
  const next = { ...(props || {}) }
  if (parsePositiveNumber(next.estimatedPreviewHeightPx) == null) {
    next.estimatedPreviewHeightPx = clampPreviewHeight(
      estimatedHeight,
      undefined,
      next.maxHeight === 'none' ? null : (parsePositiveNumber(next.maxHeight) ?? undefined),
    )
  }
  return next
}

export function resolveNodeOutletCustomComponent(
  node: SvelteRenderableNode,
  context?: SvelteRenderContext,
  customComponents?: CustomComponentMap | null,
) {
  const mapping = customComponents ?? context?.customComponents ?? null

  if (node.type === 'code_block') {
    const language = resolveCodeBlockLanguage(node)
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

  const direct = mapping?.[node.type]
  if (direct)
    return direct

  return null
}
