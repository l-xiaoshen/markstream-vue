import type { Component, ComponentProps } from 'svelte'
import type {
  BaseNode,
  CodeBlockMonacoOptions,
  D2BlockNode,
  D2Constructor,
  D2Loader,
  D2RuntimeLoader,
  ImageNode,
  InfographicBlockNode,
  KatexLoader,
  katexRuntime,
  KatexRuntimeLoader,
  KaTeXWorkerClient,
  KNOWN_MARKDOWN_NODE_TYPES,
  KnownMarkdownNodeType,
  MarkstreamCustomComponentProps,
  MermaidBlockNode,
  MermaidLoader,
  mermaidRuntime,
  MermaidRuntimeLoader,
  MonacoRuntime,
  MonacoRuntimeModule,
  NodeProps,
  NodeRendererInput,
  ParsedMarkdownNode,
  RenderableMarkdownNode,
  RendererCustomComponentMap,
  SvelteRenderContext,
} from '../dist/index.js'
import {
  CodeBlockNode,
  createCustomComponentRegistry,
  createKaTeXWorkerClient,
  createMarkdownHtmlRenderer,
  createMarkdownNodeParser,
  d2Runtime,
  defineCustomComponents,
  disableD2,
  disableKatex,
  disableMermaid,
  enableD2,
  enableKatex,
  enableMermaid,
  getCustomComponentsRevision,
  getCustomNodeComponents,
  getKatex,
  getMermaid,
  getSafeI18n,
  isCodeBlockRuntimeReady,
  isCustomNodeType,
  isD2Enabled,
  isKatexEnabled,
  isMermaidEnabled,
  isNodeType,
  MarkdownCodeBlockNode,
  monacoRuntime,
  parseNestedMarkdownToNodes,
  preloadCodeBlockRuntime,
  resetCodeBlockRuntimeReadyForTest,
  setCustomComponents,
  setD2Loader,
  setKatexLoader,
  setMermaidLoader,
  SmoothMarkdownStream,
  subscribeCustomComponents,
  SvelteCodeBlockNode,
} from '../dist/index.js'
import 'markstream-svelte/workers/katexRenderer.worker'
import 'markstream-svelte/workers/mermaidParser.worker'

interface ThinkingNode extends BaseNode {
  type: 'thinking'
  content: string
  durationMs: number
}

interface CitationNode extends BaseNode {
  type: 'citation'
  href: string
}

type AppNode = ThinkingNode | CitationNode
interface AppNodeSchema {
  thinking: ThinkingNode
  citation: CitationNode
}

interface LegacyThinkingProps {
  node: ThinkingNode
  ctx: SvelteRenderContext
  customId?: string
  isDark?: boolean
  typewriter?: boolean
}

declare const ThinkingComponent: Component<
  MarkstreamCustomComponentProps<ThinkingNode>
>
declare const CitationComponent: Component<
  MarkstreamCustomComponentProps<CitationNode>
>
declare const ThinkingWithRequiredExtra: Component<
  MarkstreamCustomComponentProps<ThinkingNode> & { compact: boolean }
>
declare const LegacyThinkingComponent: Component<LegacyThinkingProps>
declare const codeNode: ComponentProps<typeof CodeBlockNode>['node']
declare const imageNode: ComponentProps<typeof ImageNode>['node']
declare const renderContext: SvelteRenderContext

const standardRichProps = {
  context: renderContext,
  indexKey: 'code-0',
  node: codeNode,
} satisfies NodeProps<typeof codeNode>
const codeBlockComponentProps: ComponentProps<typeof CodeBlockNode> = standardRichProps
const legacyCodeBlockComponentProps: ComponentProps<typeof CodeBlockNode> = {
  ...standardRichProps,
  darkTheme: 'vitesse-dark',
  isDark: true,
  loading: false,
  monacoOptions: { fontSize: 14 },
  showHeader: false,
  stream: true,
}
const d2ComponentProps: ComponentProps<typeof D2BlockNode> = {
  ...standardRichProps,
  darkThemeId: 200,
  loading: false,
  maxHeight: '480px',
}
const infographicComponentProps: ComponentProps<typeof InfographicBlockNode> = {
  ...standardRichProps,
  estimatedPreviewHeightPx: 360,
  loading: false,
  showZoomControls: false,
}
const mermaidComponentProps: ComponentProps<typeof MermaidBlockNode> = {
  ...standardRichProps,
  loading: false,
  maxHeight: '480px',
  showModeToggle: false,
}
const imageComponentProps: ComponentProps<typeof ImageNode> = {
  context: renderContext,
  fallbackSrc: '/fallback.png',
  lazy: true,
  node: imageNode,
  usePlaceholder: false,
}
void codeBlockComponentProps
void d2ComponentProps
void imageComponentProps
void infographicComponentProps
void legacyCodeBlockComponentProps
void mermaidComponentProps

const components = defineCustomComponents<AppNodeSchema>({
  thinking: ThinkingComponent,
  citation: CitationComponent,
})
const legacyComponents = defineCustomComponents<AppNodeSchema>({
  thinking: LegacyThinkingComponent,
})
setCustomComponents('legacy', legacyComponents)
const registry = createCustomComponentRegistry<typeof components>()
registry.setCustomComponents('typed', components)
// @ts-expect-error The registry preserves each map entry's node contract.
registry.setCustomComponents({ thinking: CitationComponent })
// @ts-expect-error The registry preserves the component map's keys.
registry.setCustomComponents({ missing: ThinkingComponent })
void legacyComponents

const rendererComponents: RendererCustomComponentMap<AppNode> = {
  citation: CitationComponent,
  code_block: CodeBlockNode,
  thinking: ThinkingComponent,
}
const invalidRendererComponents: RendererCustomComponentMap<AppNode> = {
  // @ts-expect-error Renderer-local entries preserve their node discriminant.
  thinking: CitationComponent,
}
void invalidRendererComponents

defineCustomComponents<AppNodeSchema>({
  // @ts-expect-error NodeOutlet never supplies required component-specific extras.
  thinking: ThinkingWithRequiredExtra,
})

// @ts-expect-error CustomComponentMap accepts only a node-schema generic.
defineCustomComponents<AppNodeSchema, object>({})

const customNode: ThinkingNode = {
  type: 'thinking',
  raw: '<thinking>work</thinking>',
  content: 'work',
  durationMs: 20,
}
const customComponentProps: MarkstreamCustomComponentProps<ThinkingNode> = {
  context: renderContext,
  indexKey: 'thinking-0',
  node: customNode,
}
const legacyCustomComponentProps: MarkstreamCustomComponentProps<ThinkingNode> = {
  context: renderContext,
  ctx: renderContext,
  customId: 'legacy',
  fade: true,
  isDark: true,
  node: customNode,
  showHeader: false,
  typewriter: true,
}
const invalidNodeProps: NodeProps<ThinkingNode> = {
  node: customNode,
  // @ts-expect-error Compatibility aliases are limited to custom components.
  isDark: true,
}
void customComponentProps
void invalidNodeProps
void legacyCustomComponentProps

const input: NodeRendererInput<AppNode> = {
  customComponents: rendererComponents,
  nodes: [customNode],
}
const legacyInput: NodeRendererInput<AppNode> = {
  codeBlockDarkTheme: 'vitesse-dark',
  codeBlockLightTheme: 'vitesse-light',
  codeBlockMaxWidth: 960,
  codeBlockMinWidth: 320,
  codeBlockMonacoOptions: { fontSize: 14 },
  codeBlockStream: true,
  content: 'legacy',
  deferNodesUntilVisible: true,
  liveNodeBuffer: 20,
  themes: ['vitesse-dark'],
  viewportPriority: true,
}
void input
void legacyInput

const monacoOptions: CodeBlockMonacoOptions = {
  smoothHeightTransition: true,
}
void monacoOptions
void CodeBlockNode
const legacyMarkdownCodeBlockNode: typeof CodeBlockNode = MarkdownCodeBlockNode
const legacySvelteCodeBlockNode: typeof CodeBlockNode = SvelteCodeBlockNode
const legacyD2Controls = {
  disable: disableD2 satisfies typeof d2Runtime.disable,
  enable: enableD2 satisfies typeof d2Runtime.enable,
  isEnabled: isD2Enabled satisfies typeof d2Runtime.isEnabled,
  setLoader: setD2Loader satisfies typeof d2Runtime.setLoader,
}
const legacyKatexControls = {
  disable: disableKatex satisfies typeof katexRuntime.disable,
  enable: enableKatex satisfies typeof katexRuntime.enable,
  get: getKatex,
  isEnabled: isKatexEnabled satisfies typeof katexRuntime.isEnabled,
  setLoader: setKatexLoader satisfies typeof katexRuntime.setLoader,
}
const legacyMermaidControls = {
  disable: disableMermaid satisfies typeof mermaidRuntime.disable,
  enable: enableMermaid satisfies typeof mermaidRuntime.enable,
  get: getMermaid,
  isEnabled: isMermaidEnabled satisfies typeof mermaidRuntime.isEnabled,
  setLoader: setMermaidLoader satisfies typeof mermaidRuntime.setLoader,
}
const legacyMonacoControls = {
  isReady: isCodeBlockRuntimeReady satisfies typeof monacoRuntime.isReady,
  preload: preloadCodeBlockRuntime satisfies typeof monacoRuntime.preload,
  resetReadyForTest: resetCodeBlockRuntimeReadyForTest satisfies () => void,
}
const structuralMonacoRuntime: MonacoRuntime = {
  get: async () => null,
  isReady: () => false,
  preload: async () => false,
}
declare const legacyLoader: () => Promise<unknown>
const legacyD2Loader: D2Loader = legacyLoader
const legacyKatexLoader: KatexLoader = legacyLoader
const legacyMermaidLoader: MermaidLoader = legacyLoader
enableD2(legacyD2Loader)
enableKatex(legacyKatexLoader)
enableMermaid(legacyMermaidLoader)
setD2Loader(legacyD2Loader)
setKatexLoader(legacyKatexLoader)
setMermaidLoader(legacyMermaidLoader)
void getMermaid({
  customThemeOption: true,
  flowchart: {
    curve: 'basis',
    htmlLabels: false,
  },
})
const unsubscribeCustomComponents = subscribeCustomComponents(() => {})
const customComponentsRevision: number = getCustomComponentsRevision()
const registeredCustomComponents = getCustomNodeComponents('legacy')
unsubscribeCustomComponents()
void customComponentsRevision
void registeredCustomComponents
void legacyD2Controls
void legacyKatexControls
void legacyMarkdownCodeBlockNode
void legacyMermaidControls
void legacyMonacoControls
void structuralMonacoRuntime
void legacySvelteCodeBlockNode
const workerClientFactory: () => KaTeXWorkerClient = createKaTeXWorkerClient
const smoothStream = new SmoothMarkdownStream({ targetLatencyMs: 20 })
smoothStream.enqueue('stream')
smoothStream.destroy()
const translated: string = getSafeI18n().t('common.copy')
void translated
void smoothStream
const monacoRuntimeLoader: () => Promise<MonacoRuntimeModule | null>
  = monacoRuntime.get
declare const D2Class: D2Constructor
const d2Loader: D2RuntimeLoader = () => D2Class
d2Runtime.setLoader(d2Loader)
declare const katexLoader: KatexRuntimeLoader
const canonicalKatexLoader: Parameters<typeof katexRuntime.setLoader>[0] = katexLoader
declare const mermaidLoader: MermaidRuntimeLoader
const canonicalMermaidLoader: Parameters<typeof mermaidRuntime.setLoader>[0] = mermaidLoader
// @ts-expect-error D2 loaders must return the dependency's constructor.
d2Runtime.setLoader(() => 42)
void workerClientFactory
void canonicalKatexLoader
void canonicalMermaidLoader
void d2Loader
void monacoRuntimeLoader

function inspect(node: RenderableMarkdownNode<AppNode>): string {
  if (isNodeType(node, 'code_block'))
    return node.language
  if (isCustomNodeType<AppNode, 'thinking'>(node, 'thinking'))
    return String(node.durationMs)
  return node.type
}

inspect(customNode)
createMarkdownHtmlRenderer().renderMarkdownNodeToHtml<AppNode>(customNode)

const parsedNodes: ParsedMarkdownNode<AppNode>[]
  = createMarkdownNodeParser().parse<AppNode>({ content: 'Hello' })
const nestedNodes: ParsedMarkdownNode<AppNode>[]
  = parseNestedMarkdownToNodes<AppNode>({ nodes: [customNode] })
void parsedNodes
void nestedNodes

function assertKnownNodeTypesExhaustive(
  value: Exclude<
    KnownMarkdownNodeType,
    (typeof KNOWN_MARKDOWN_NODE_TYPES)[number]
  > extends never ? true : never,
): void {
  void value
}
assertKnownNodeTypesExhaustive(true)
