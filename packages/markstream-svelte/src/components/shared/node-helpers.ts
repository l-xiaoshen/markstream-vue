import type { BaseNode, ParsedNode } from 'stream-markdown-parser'
import type { RuntimeCustomComponentMap } from '../../customComponents'
import type {
  NodeRendererCodeBlockProps,
  NodeRendererEvents,
  NodeRendererOptions,
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

type LegacyNodeOptionOverrides = Pick<
  NodeRendererOptions,
  | 'codeBlockProps'
  | 'd2Props'
  | 'imageProps'
  | 'infographicProps'
  | 'isDark'
  | 'mermaidProps'
>

function mergeDefinedOptions<T extends object>(
  inherited: T | undefined,
  direct: T,
): T {
  const merged = { ...(inherited ?? {}) } as T
  for (const [key, value] of Object.entries(direct)) {
    if (value !== undefined)
      Object.assign(merged, { [key]: value })
  }
  return merged
}

function mergeLegacyCodeBlockOptions(
  inherited: NodeRendererCodeBlockProps | undefined,
  direct: NodeRendererCodeBlockProps,
): NodeRendererCodeBlockProps {
  const merged = mergeDefinedOptions(inherited, direct)
  if (direct.monacoOptions !== undefined) {
    merged.monacoOptions = {
      ...(inherited?.monacoOptions ?? {}),
      ...direct.monacoOptions,
    }
  }
  if (direct.themes !== undefined) {
    merged.themes = [
      ...(inherited?.themes ?? []),
      ...direct.themes,
    ]
  }
  return merged
}

export function mergeLegacyNodeOptions(
  context: SvelteRenderContext | undefined,
  overrides: LegacyNodeOptionOverrides,
): SvelteRenderContext {
  const next: SvelteRenderContext = {
    ...context,
    events: context?.events ?? {},
  }
  if (overrides.isDark !== undefined)
    next.isDark = overrides.isDark
  if (overrides.codeBlockProps)
    next.codeBlockProps = mergeLegacyCodeBlockOptions(context?.codeBlockProps, overrides.codeBlockProps)
  if (overrides.mermaidProps)
    next.mermaidProps = mergeDefinedOptions(context?.mermaidProps, overrides.mermaidProps)
  if (overrides.d2Props)
    next.d2Props = mergeDefinedOptions(context?.d2Props, overrides.d2Props)
  if (overrides.infographicProps) {
    next.infographicProps = mergeDefinedOptions(
      context?.infographicProps,
      overrides.infographicProps,
    )
  }
  if (overrides.imageProps)
    next.imageProps = mergeDefinedOptions(context?.imageProps, overrides.imageProps)
  return next
}

export function buildRenderContext(
  options: NodeRendererOptions,
  events: NodeRendererEvents = {},
  textStreamState?: Map<string, string>,
  customComponents?: RuntimeCustomComponentMap,
  parentContext?: SvelteRenderContext,
  legacyMetadata: Pick<SvelteRenderContext, 'indexKey' | 'streamRenderVersion'> = {},
): SvelteRenderContext {
  const customHtmlTags = normalizeCustomHtmlTags([
    ...(options.customHtmlTags || []),
    ...(options.parseOptions?.customHtmlTags || []),
  ])
  const codeBlockProps = resolveCodeBlockProps(options)

  return {
    ...options,
    allowHtml: options.allowHtml !== false,
    batchRendering: options.batchRendering ?? true,
    codeBlockStream: options.codeBlockStream ?? true,
    customHtmlTags,
    debugPerformance: options.debugPerformance ?? false,
    fade: options.fade ?? true,
    htmlPolicy: options.htmlPolicy ?? 'safe',
    initialRenderBatchSize: options.initialRenderBatchSize ?? 40,
    isDark: options.isDark ?? false,
    maxLiveNodes: options.maxLiveNodes ?? 320,
    renderBatchBudgetMs: options.renderBatchBudgetMs ?? 6,
    renderBatchDelay: options.renderBatchDelay ?? 16,
    renderBatchIdleTimeoutMs: options.renderBatchIdleTimeoutMs ?? 120,
    renderBatchSize: options.renderBatchSize ?? 80,
    renderCodeBlocksAsPre: options.renderCodeBlocksAsPre ?? false,
    showTooltips: options.showTooltips ?? true,
    smoothStreaming: options.smoothStreaming ?? 'auto',
    typewriter: options.typewriter ?? false,
    codeBlockProps,
    codeBlockThemes: {
      themes: codeBlockProps.themes,
      darkTheme: codeBlockProps.darkTheme,
      lightTheme: codeBlockProps.lightTheme,
      monacoOptions: codeBlockProps.monacoOptions,
      minWidth: codeBlockProps.minWidth,
      maxWidth: codeBlockProps.maxWidth,
    },
    indexKey: legacyMetadata.indexKey ?? parentContext?.indexKey,
    streamRenderVersion: legacyMetadata.streamRenderVersion,
    textStreamState,
    customComponents,
    events: {
      ...parentContext?.events,
      ...(events.onCopy === undefined ? {} : { onCopy: events.onCopy }),
      ...(events.onHandleArtifactClick === undefined
        ? {}
        : { onHandleArtifactClick: events.onHandleArtifactClick }),
    },
  }
}

function resolveCodeBlockProps(
  props: NodeRendererOptions,
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
    stream: configured?.stream ?? props.codeBlockStream ?? true,
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
