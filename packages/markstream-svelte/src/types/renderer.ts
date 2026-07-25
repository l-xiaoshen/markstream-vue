import type { SmoothMarkdownStreamOptions } from 'markstream-core'
import type {
  BaseNode,
  HtmlPolicy,
  MarkdownIt,
  ParseOptions,
} from 'stream-markdown-parser'
import type { Component } from 'svelte'
import type {
  MarkstreamCustomComponentProps,
  MarkstreamSvelteComponent,
  RuntimeCustomComponentMap,
} from '../customComponents'
import type {
  CodeBlockMonacoOptions,
  CodeBlockMonacoTheme,
} from './monaco'
import type { RenderableMarkdownNode } from './nodes'

type ComponentMapForNodeUnion<
  TNode extends BaseNode,
> = {
  [TType in TNode['type']]?: MarkstreamSvelteComponent<
    MarkstreamCustomComponentProps<Extract<TNode, { type: TType }>>
  >
}

/**
 * Renderer-local overrides are checked against built-in and caller-owned node
 * discriminants. The string index also permits language aliases such as
 * `javascript`, which are resolved from code blocks at runtime.
 */
export type RendererCustomComponentMap<
  TCustomNode extends BaseNode = never,
> = ComponentMapForNodeUnion<
  RenderableMarkdownNode<TCustomNode>
> & Partial<Record<string, Component<never>>>

export interface CodeBlockPreviewPayload {
  node: RenderableMarkdownNode<BaseNode>
  artifactType: 'text/html' | 'image/svg+xml'
  artifactTitle: string
  id: string
}

export interface NodeRendererCodeBlockProps {
  stream?: boolean | undefined
  darkTheme?: CodeBlockMonacoTheme | undefined
  lightTheme?: CodeBlockMonacoTheme | undefined
  themes?: CodeBlockMonacoTheme[] | undefined
  monacoOptions?: CodeBlockMonacoOptions | undefined
  minWidth?: string | number | undefined
  maxWidth?: string | number | undefined
  isShowPreview?: boolean | undefined
  enableFontSizeControl?: boolean | undefined
  showHeader?: boolean | undefined
  showCopyButton?: boolean | undefined
  showExpandButton?: boolean | undefined
  showPreviewButton?: boolean | undefined
  showCollapseButton?: boolean | undefined
  showFontSizeButtons?: boolean | undefined
  htmlPreviewAllowScripts?: boolean | undefined
  htmlPreviewSandbox?: string | undefined
}

export interface NodeRendererImageProps {
  fallbackSrc?: string | undefined
  lazy?: boolean | undefined
  usePlaceholder?: boolean | undefined
}

export interface NodeRendererMermaidProps {
  maxHeight?: string | null | undefined
  estimatedPreviewHeightPx?: number | undefined
  workerTimeoutMs?: number | undefined
  parseTimeoutMs?: number | undefined
  renderTimeoutMs?: number | undefined
  fullRenderTimeoutMs?: number | undefined
  renderDebounceMs?: number | undefined
  showHeader?: boolean | undefined
  showModeToggle?: boolean | undefined
  showCopyButton?: boolean | undefined
  showExportButton?: boolean | undefined
  showFullscreenButton?: boolean | undefined
  showCollapseButton?: boolean | undefined
  showZoomControls?: boolean | undefined
  isStrict?: boolean | undefined
  enableMermaidInteractions?: boolean | undefined
}

export interface NodeRendererD2Props {
  maxHeight?: string | null | undefined
  themeId?: number | null | undefined
  darkThemeId?: number | null | undefined
  renderDebounceMs?: number | undefined
  showHeader?: boolean | undefined
  showModeToggle?: boolean | undefined
  showCopyButton?: boolean | undefined
  showExportButton?: boolean | undefined
  showFullscreenButton?: boolean | undefined
  showCollapseButton?: boolean | undefined
  showZoomControls?: boolean | undefined
}

export interface NodeRendererInfographicProps {
  maxHeight?: string | null | undefined
  estimatedPreviewHeightPx?: number | undefined
  renderDebounceMs?: number | undefined
  showHeader?: boolean | undefined
  showModeToggle?: boolean | undefined
  showCopyButton?: boolean | undefined
  showCollapseButton?: boolean | undefined
  showExportButton?: boolean | undefined
  showFullscreenButton?: boolean | undefined
  showZoomControls?: boolean | undefined
}

export interface NodeRendererMathProps {
  workerTimeoutMs?: number | undefined
  workerWaitTimeoutMs?: number | undefined
  workerRetries?: number | undefined
}

export interface NodeRendererEvents {
  onCopy?: ((code: string) => void) | undefined
  onHandleArtifactClick?: ((payload: CodeBlockPreviewPayload) => void) | undefined
}

export interface NodeRendererProps<TCustomNode extends BaseNode = never> {
  content?: string | undefined
  nodes?: readonly RenderableMarkdownNode<TCustomNode>[] | null | undefined
  final?: boolean | undefined
  parseOptions?: ParseOptions | undefined
  customMarkdownIt?: ((md: MarkdownIt) => MarkdownIt) | undefined
  debugPerformance?: boolean | undefined
  customHtmlTags?: readonly string[] | undefined
  htmlPolicy?: HtmlPolicy | undefined
  codeBlockStream?: boolean | undefined
  codeBlockDarkTheme?: CodeBlockMonacoTheme | undefined
  codeBlockLightTheme?: CodeBlockMonacoTheme | undefined
  codeBlockMonacoOptions?: CodeBlockMonacoOptions | undefined
  renderCodeBlocksAsPre?: boolean | undefined
  codeBlockMinWidth?: string | number | undefined
  codeBlockMaxWidth?: string | number | undefined
  codeBlockProps?: NodeRendererCodeBlockProps | undefined
  mermaidProps?: NodeRendererMermaidProps | undefined
  d2Props?: NodeRendererD2Props | undefined
  infographicProps?: NodeRendererInfographicProps | undefined
  imageProps?: NodeRendererImageProps | undefined
  mathProps?: NodeRendererMathProps | undefined
  customComponents?: RendererCustomComponentMap<TCustomNode> | undefined
  showTooltips?: boolean | undefined
  themes?: CodeBlockMonacoTheme[] | undefined
  isDark?: boolean | undefined
  customId?: string | undefined
  indexKey?: number | string | undefined
  typewriter?: boolean | undefined
  fade?: boolean | undefined
  batchRendering?: boolean | undefined
  initialRenderBatchSize?: number | undefined
  renderBatchSize?: number | undefined
  renderBatchDelay?: number | undefined
  renderBatchBudgetMs?: number | undefined
  renderBatchIdleTimeoutMs?: number | undefined
  maxLiveNodes?: number | undefined
  allowHtml?: boolean | undefined
  smoothStreaming?: boolean | 'auto' | undefined
  smoothStreamingOptions?: SmoothMarkdownStreamOptions | undefined
}

export type NodeRendererInput<TCustomNode extends BaseNode = never>
  = Omit<NodeRendererProps<TCustomNode>, 'content' | 'nodes'>
    & (
      | {
        content: string
        nodes?: never
      }
      | {
        content?: never
        nodes: readonly RenderableMarkdownNode<TCustomNode>[]
      }
    )

export interface SvelteRenderContext {
  customId?: string | undefined
  isDark?: boolean | undefined
  final?: boolean | undefined
  typewriter?: boolean | undefined
  fade?: boolean | undefined
  textStreamState?: Map<string, string> | undefined
  showTooltips?: boolean | undefined
  renderCodeBlocksAsPre?: boolean | undefined
  allowHtml?: boolean | undefined
  htmlPolicy?: HtmlPolicy | undefined
  customHtmlTags?: readonly string[] | undefined
  parseOptions?: ParseOptions | undefined
  customMarkdownIt?: ((md: MarkdownIt) => MarkdownIt) | undefined
  codeBlockProps?: NodeRendererCodeBlockProps | undefined
  mermaidProps?: NodeRendererMermaidProps | undefined
  d2Props?: NodeRendererD2Props | undefined
  infographicProps?: NodeRendererInfographicProps | undefined
  imageProps?: NodeRendererImageProps | undefined
  mathProps?: NodeRendererMathProps | undefined
  customComponents?: RuntimeCustomComponentMap | undefined
  batchRendering?: boolean | undefined
  smoothStreaming?: boolean | 'auto' | undefined
  smoothStreamingOptions?: SmoothMarkdownStreamOptions | undefined
  events: NodeRendererEvents
}
