import type { BaseNode, ParsedNode } from 'stream-markdown-parser'
import type { RuntimeCustomComponentMap } from '../../customComponents'
import type {
  NodeRendererCodeBlockProps,
  NodeRendererEvents,
  NodeRendererProps,
  SvelteRenderContext,
} from '../../types/renderer'
import { normalizeCustomHtmlTags } from 'stream-markdown-parser'
import { isNodeType } from '../../types/nodes'

export const BLOCK_LEVEL_TYPES: ReadonlySet<string> = new Set([
  'table',
  'code_block',
  'html_block',
  'blockquote',
  'list',
  'list_item',
  'definition_list',
  'footnote',
  'admonition',
  'thematic_break',
  'math_block',
  'vmr_container',
])

export function buildRenderContext<TCustomNode extends BaseNode = never>(
  props: NodeRendererProps<TCustomNode>,
  events: NodeRendererEvents = {},
  textStreamState?: Map<string, string>,
  customComponents?: RuntimeCustomComponentMap,
): SvelteRenderContext {
  const customHtmlTags = normalizeCustomHtmlTags([
    ...(props.customHtmlTags || []),
    ...(props.parseOptions?.customHtmlTags || []),
  ])
  const codeBlockProps = resolveCodeBlockProps(props)

  return {
    customId: props.customId,
    isDark: props.isDark,
    final: props.final,
    typewriter: props.typewriter,
    fade: props.fade,
    textStreamState,
    showTooltips: props.showTooltips,
    renderCodeBlocksAsPre: props.renderCodeBlocksAsPre,
    allowHtml: props.allowHtml !== false,
    htmlPolicy: props.htmlPolicy ?? 'safe',
    customHtmlTags,
    parseOptions: props.parseOptions,
    customMarkdownIt: props.customMarkdownIt,
    codeBlockProps,
    mermaidProps: props.mermaidProps,
    d2Props: props.d2Props,
    infographicProps: props.infographicProps,
    imageProps: props.imageProps,
    mathProps: props.mathProps,
    customComponents,
    batchRendering: props.batchRendering,
    smoothStreaming: props.smoothStreaming,
    smoothStreamingOptions: props.smoothStreamingOptions,
    events,
  }
}

function resolveCodeBlockProps<TCustomNode extends BaseNode>(
  props: NodeRendererProps<TCustomNode>,
): NodeRendererCodeBlockProps {
  const configured = props.codeBlockProps
  const monacoOptions = props.codeBlockMonacoOptions || configured?.monacoOptions
    ? {
        ...(props.codeBlockMonacoOptions ?? {}),
        ...(configured?.monacoOptions ?? {}),
      }
    : undefined

  return {
    ...configured,
    darkTheme: configured?.darkTheme ?? props.codeBlockDarkTheme,
    lightTheme: configured?.lightTheme ?? props.codeBlockLightTheme,
    maxWidth: configured?.maxWidth ?? props.codeBlockMaxWidth,
    minWidth: configured?.minWidth ?? props.codeBlockMinWidth,
    monacoOptions,
    stream: configured?.stream ?? props.codeBlockStream,
    themes: configured?.themes ?? props.themes,
  }
}

export function isWhitespaceTextNode(node: BaseNode | null | undefined): boolean {
  return !!node && isNodeType(node, 'text') && node.content.trim() === ''
}

export function getMeaningfulLinkChildren(node: BaseNode | null | undefined): ParsedNode[] {
  if (!node || !isNodeType(node, 'link'))
    return []

  return node.children.filter(child => !isWhitespaceTextNode(child))
}

export function isImageOnlyLinkNode(node: BaseNode | null | undefined): boolean {
  const linkChildren = getMeaningfulLinkChildren(node)
  const [child] = linkChildren
  return child !== undefined && linkChildren.length === 1 && isNodeType(child, 'image')
}

export function isMediaOnlyParagraphNodes(children: readonly BaseNode[]): boolean {
  const meaningfulChildren = children.filter(child => !isWhitespaceTextNode(child))
  return meaningfulChildren.length > 0
    && meaningfulChildren.every(child => isNodeType(child, 'image') || isImageOnlyLinkNode(child))
}

export function normalizeMediaOnlyParagraphNodes<TNode extends BaseNode>(children: readonly TNode[]): TNode[] {
  const source = children.slice()
  const meaningfulChildren = source.filter(child => !isWhitespaceTextNode(child))

  if (!isMediaOnlyParagraphNodes(source) || meaningfulChildren.length <= 1)
    return source

  const normalized: TNode[] = []
  for (let index = 0; index < source.length; index += 1) {
    const child = source[index]
    if (!child)
      continue
    if (!isWhitespaceTextNode(child)) {
      normalized.push(child)
      continue
    }

    const hasPrevious = normalized.length > 0
    const hasNext = source.slice(index + 1).some(nextChild => !isWhitespaceTextNode(nextChild))
    if (!hasPrevious || !hasNext)
      continue

    if (!isNodeType(child, 'text'))
      continue

    normalized.push({
      ...child,
      content: ' ',
      raw: ' ',
    })
  }

  return normalized
}

export type ParagraphPart<TNode extends BaseNode = BaseNode>
  = | { kind: 'inline', nodes: TNode[] }
    | { kind: 'block', node: TNode }

export function splitParagraphChildren<TNode extends BaseNode>(
  children: readonly TNode[],
): ParagraphPart<TNode>[] {
  const parts: ParagraphPart<TNode>[] = []

  const inlineBuffer: TNode[] = []
  function flushInline() {
    if (!inlineBuffer.length)
      return
    parts.push({ kind: 'inline', nodes: inlineBuffer.slice() })
    inlineBuffer.length = 0
  }

  for (const child of children) {
    if (BLOCK_LEVEL_TYPES.has(child.type)) {
      flushInline()
      parts.push({ kind: 'block', node: child })
    }
    else {
      inlineBuffer.push(child)
    }
  }
  flushInline()

  return parts
}
