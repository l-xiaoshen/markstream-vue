import './index.css'

export { default } from './components/NodeRenderer.svelte'
export { default as MarkdownRender } from './components/NodeRenderer.svelte'
export { default as NodeRenderer } from './components/NodeRenderer.svelte'

export {
  clearGlobalCustomComponents,
  createCustomComponentRegistry,
  defineCustomComponents,
  removeCustomComponents,
  setCustomComponents,
} from './customComponents'
export type {
  CustomComponentMap,
  CustomComponentRegistry,
  MarkstreamCustomComponentProps,
  MarkstreamSvelteComponent,
} from './customComponents'
export {
  createRenderedHtmlEnhancer,
  disposeRenderedHtmlEnhancements,
  enhanceRenderedHtml,
} from './enhanceRenderedHtml'
export type {
  EnhanceRenderedHtmlOptions,
  RenderedHtmlEnhancementHandle,
  RenderedHtmlEnhancer,
} from './enhanceRenderedHtml'
export {
  createSafeI18nService,
  getSafeI18n,
  setDefaultI18nMap,
} from './i18n/safeI18n'
export type {
  I18nMessages,
  SafeI18nService,
} from './i18n/safeI18n'
export {
  createD2Runtime,
  d2Runtime,
} from './optional/d2'
export type {
  D2Constructor,
  D2Instance,
  D2Loader,
  D2Runtime,
} from './optional/d2'
export {
  createInfographicRuntime,
  infographicRuntime,
} from './optional/infographic'
export type {
  InfographicConstructor,
  InfographicInstance,
  InfographicLoader,
  InfographicRuntime,
} from './optional/infographic'
export {
  createKatexRuntime,
  katexRuntime,
} from './optional/katex'
export type {
  KatexLoader,
  KatexModule,
  KatexRuntime,
} from './optional/katex'
export {
  createMermaidRuntime,
  mermaidRuntime,
} from './optional/mermaid'
export type {
  MermaidInitConfig,
  MermaidLoader,
  MermaidModule,
  MermaidRenderResult,
  MermaidRuntime,
} from './optional/mermaid'
export {
  createMonacoRuntime,
  monacoRuntime,
} from './optional/monaco'
export type {
  MonacoLoader,
  MonacoRuntime,
  MonacoRuntimeHelpers,
  MonacoRuntimeModule,
} from './optional/monaco'
export {
  createMarkdownNodeParser,
} from './parseMarkdownToNodes'
export type {
  MarkdownNodeParser,
} from './parseMarkdownToNodes'
export {
  createNestedMarkdownParser,
  parseNestedMarkdownToNodes,
} from './parseNestedMarkdownToNodes'
export type {
  NestedMarkdownNodesInput,
  NestedMarkdownNodesOptions,
  NestedMarkdownParser,
} from './parseNestedMarkdownToNodes'
export {
  createMarkdownHtmlRenderer,
  renderMarkdownNodesToHtml,
  renderMarkdownNodeToHtml,
  renderMarkdownToHtml,
  renderNestedMarkdownToHtml,
} from './renderMarkdownHtml'
export type {
  MarkdownHtmlRenderer,
  MarkstreamSvelteRenderOptions,
  NestedMarkdownHtmlInput,
  NestedMarkdownHtmlOptions,
} from './renderMarkdownHtml'
export { sanitizeHtmlContent } from './sanitizeHtmlContent'
export {
  SmoothMarkdownStream,
} from './state/streaming/SmoothMarkdownStream.svelte'
export type {
  SmoothMarkdownStreamOptions,
} from './state/streaming/SmoothMarkdownStream.svelte'
export {
  createTooltipService,
  hideTooltip,
  isTooltipVisible,
  showTooltipForAnchor,
} from './tooltip/singletonTooltip'
export type {
  TooltipOrigin,
  TooltipPlacement,
  TooltipService,
} from './tooltip/singletonTooltip'
export type {
  CodeBlockDiffAppearance,
  CodeBlockDiffHideUnchangedRegions,
  CodeBlockDiffHideUnchangedRegionsOptions,
  CodeBlockDiffHunkActionContext,
  CodeBlockDiffHunkActionKind,
  CodeBlockDiffHunkSide,
  CodeBlockDiffLineStyle,
  CodeBlockDiffUnchangedRegionStyle,
  CodeBlockMonacoLanguage,
  CodeBlockMonacoOptions,
  CodeBlockMonacoTheme,
  CodeBlockMonacoThemeObject,
} from './types/monaco'
export {
  isCustomNodeType,
  isKnownMarkdownNode,
  isNodeType,
  KNOWN_MARKDOWN_NODE_TYPES,
} from './types/nodes'
export type {
  CustomMarkdownNode,
  KnownMarkdownNode,
  KnownMarkdownNodeSchema,
  KnownMarkdownNodeType,
  MarkdownNodeOfType,
  ParsedMarkdownNode,
  RenderableMarkdownNode,
  RenderableMarkdownNodeFromSchema,
  TextSpecialNode,
} from './types/nodes'
export type {
  CodeBlockPreviewPayload,
  NodeRendererCodeBlockProps,
  NodeRendererD2Props,
  NodeRendererEvents,
  NodeRendererImageProps,
  NodeRendererInfographicProps,
  NodeRendererInput,
  NodeRendererMathProps,
  NodeRendererMermaidProps,
  NodeRendererOptions,
  NodeRendererProps,
  RendererCustomComponentMap,
  SvelteRenderContext,
} from './types/renderer'
export {
  normalizeLanguageIdentifier,
  resolveMonacoLanguageId,
} from './utils/language'
export {
  clearKaTeXWorker,
  setKaTeXWorker,
} from './workers/katexWorkerRuntime'
export {
  clearMermaidWorker,
  setMermaidWorker,
} from './workers/mermaidWorkerRuntime'
export type {
  BaseNode,
  HtmlPolicy,
  MarkdownIt,
  ParsedNode,
  ParseOptions,
} from 'stream-markdown-parser'
