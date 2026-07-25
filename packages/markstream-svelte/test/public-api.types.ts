import type { Component, ComponentProps } from 'svelte'
import type {
  BaseNode,
  CodeBlockMonacoOptions,
  D2Constructor,
  D2Loader,
  KNOWN_MARKDOWN_NODE_TYPES,
  KnownMarkdownNodeType,
  MarkstreamCustomComponentProps,
  MonacoRuntimeModule,
  NodeRendererInput,
  ParsedMarkdownNode,
  RenderableMarkdownNode,
  RendererCustomComponentMap,
  SvelteRenderContext,
} from '../dist/index.js'
import type {
  D2BlockNode,
  ImageNode,
  InfographicBlockNode,
  MermaidBlockNode,
  NodeProps,
} from '../dist/nodes.js'
import type { KaTeXWorkerClient } from '../dist/workers.js'
import {
  createCustomComponentRegistry,
  createMarkdownHtmlRenderer,
  createMarkdownNodeParser,
  d2Runtime,
  defineCustomComponents,
  getSafeI18n,
  isCustomNodeType,
  isNodeType,
  monacoRuntime,
  parseNestedMarkdownToNodes,
  SmoothMarkdownStream,
} from '../dist/index.js'
import { CodeBlockNode } from '../dist/nodes.js'
import { createKaTeXWorkerClient } from '../dist/workers.js'
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

declare const ThinkingComponent: Component<
  MarkstreamCustomComponentProps<ThinkingNode>
>
declare const CitationComponent: Component<
  MarkstreamCustomComponentProps<CitationNode>
>
declare const ThinkingWithRequiredExtra: Component<
  MarkstreamCustomComponentProps<ThinkingNode> & { compact: boolean }
>
declare const codeNode: ComponentProps<typeof CodeBlockNode>['node']
declare const imageNode: ComponentProps<typeof ImageNode>['node']
declare const renderContext: SvelteRenderContext

const standardRichProps = {
  context: renderContext,
  indexKey: 'code-0',
  node: codeNode,
} satisfies NodeProps<typeof codeNode>
const codeBlockComponentProps: ComponentProps<typeof CodeBlockNode> = standardRichProps
const d2ComponentProps: ComponentProps<typeof D2BlockNode> = standardRichProps
const infographicComponentProps: ComponentProps<typeof InfographicBlockNode> = standardRichProps
const mermaidComponentProps: ComponentProps<typeof MermaidBlockNode> = standardRichProps
const invalidCodeBlockComponentProps: ComponentProps<typeof CodeBlockNode> = {
  ...standardRichProps,
  // @ts-expect-error Renderer settings belong in context.codeBlockProps.
  showHeader: false,
}
const imageComponentProps: ComponentProps<typeof ImageNode> = {
  context: renderContext,
  node: imageNode,
}
const invalidImageComponentProps: ComponentProps<typeof ImageNode> = {
  node: imageNode,
  // @ts-expect-error Image settings belong in context.imageProps.
  lazy: true,
}
void codeBlockComponentProps
void d2ComponentProps
void imageComponentProps
void infographicComponentProps
void invalidCodeBlockComponentProps
void invalidImageComponentProps
void mermaidComponentProps

const components = defineCustomComponents<AppNodeSchema>({
  thinking: ThinkingComponent,
  citation: CitationComponent,
})
const registry = createCustomComponentRegistry<typeof components>()
registry.setCustomComponents('typed', components)
// @ts-expect-error The registry preserves each map entry's node contract.
registry.setCustomComponents({ thinking: CitationComponent })
// @ts-expect-error The registry preserves the component map's keys.
registry.setCustomComponents({ missing: ThinkingComponent })

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
const invalidCustomComponentProps: MarkstreamCustomComponentProps<ThinkingNode> = {
  node: customNode,
  // @ts-expect-error Renderer settings are available through context only.
  isDark: true,
}
void customComponentProps
void invalidCustomComponentProps

const input: NodeRendererInput<AppNode> = {
  customComponents: rendererComponents,
  nodes: [customNode],
}
void input

const monacoOptions: CodeBlockMonacoOptions = {
  smoothHeightTransition: true,
}
void monacoOptions
void CodeBlockNode
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
const d2Loader: D2Loader = () => D2Class
d2Runtime.setLoader(d2Loader)
// @ts-expect-error D2 loaders must return the dependency's constructor.
d2Runtime.setLoader(() => 42)
void workerClientFactory
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
