import type {
  BaseNode,
  HtmlPolicy,
  ParseOptions,
} from 'stream-markdown-parser'
import type { MarkdownRuntime } from './internal/markdownRuntime'
import type { RenderableMarkdownNode } from './types/nodes'
import type { HtmlClassValue } from './utils/rendering/html'
import { mergeCustomHtmlTags } from 'stream-markdown-parser'
import {
  createMarkdownRuntime,
  defaultMarkdownRuntime,
} from './internal/markdownRuntime'
import { createRenderContext } from './internal/render-html/context'
import {
  renderNestedInputToHtml,
  renderNodesToHtml,
  renderNodeToHtml,
} from './internal/render-html/renderer'

export interface MarkstreamSvelteRenderOptions<TCustomNode extends BaseNode = never> {
  content?: string | null
  nodes?: readonly RenderableMarkdownNode<TCustomNode>[] | null
  final?: boolean
  parseOptions?: ParseOptions
  customHtmlTags?: readonly string[]
  allowHtml?: boolean
  htmlPolicy?: HtmlPolicy
}

export interface NestedMarkdownHtmlOptions {
  cacheKey?: string | undefined
  customHtmlTags?: readonly string[] | undefined
  allowHtml?: boolean | undefined
  htmlPolicy?: HtmlPolicy | undefined
  customNodeTag?: string | undefined
  customNodeClass?: HtmlClassValue | ((node: RenderableMarkdownNode<BaseNode>) => HtmlClassValue) | undefined
}

export interface NestedMarkdownHtmlInput<TCustomNode extends BaseNode = never> {
  node?: RenderableMarkdownNode<TCustomNode> | null | undefined
  nodes?: readonly RenderableMarkdownNode<TCustomNode>[] | null | undefined
  content?: string | null | undefined
}

export interface MarkdownHtmlRenderer {
  renderMarkdownToHtml: <TCustomNode extends BaseNode = never>(
    input: MarkstreamSvelteRenderOptions<TCustomNode>,
  ) => string
  renderNestedMarkdownToHtml: <TCustomNode extends BaseNode = never>(
    input: NestedMarkdownHtmlInput<TCustomNode>,
    options?: NestedMarkdownHtmlOptions,
  ) => string
  renderMarkdownNodesToHtml: <TCustomNode extends BaseNode = never>(
    nodes: readonly RenderableMarkdownNode<TCustomNode>[] | null | undefined,
    options?: NestedMarkdownHtmlOptions,
  ) => string
  renderMarkdownNodeToHtml: <TCustomNode extends BaseNode = never>(
    node: RenderableMarkdownNode<TCustomNode> | null | undefined,
    options?: NestedMarkdownHtmlOptions,
  ) => string
}

function createRenderer(markdownRuntime: MarkdownRuntime): MarkdownHtmlRenderer {
  function getContext(options: NestedMarkdownHtmlOptions) {
    return createRenderContext(options, markdownRuntime)
  }

  return {
    renderMarkdownToHtml(input) {
      const customHtmlTags = mergeCustomHtmlTags(
        input.customHtmlTags,
        input.parseOptions?.customHtmlTags,
      )
      const context = getContext({
        allowHtml: input.allowHtml,
        customHtmlTags,
        htmlPolicy: input.htmlPolicy,
      })
      const nodes = input.nodes ?? markdownRuntime.parse(input.content ?? '', {
        cacheKey: context.cacheKey,
        customHtmlTags,
        final: input.final,
        parseOptions: input.parseOptions,
      })
      return renderNodesToHtml(nodes, context)
    },
    renderNestedMarkdownToHtml: (input, options = {}) =>
      renderNestedInputToHtml(input, getContext(options)),
    renderMarkdownNodesToHtml: (nodes, options = {}) =>
      renderNodesToHtml(nodes, getContext(options)),
    renderMarkdownNodeToHtml: (node, options = {}) =>
      renderNodeToHtml(node, getContext(options)),
  }
}

export function createMarkdownHtmlRenderer(): MarkdownHtmlRenderer {
  return createRenderer(createMarkdownRuntime())
}

const defaultMarkdownHtmlRenderer = createRenderer(defaultMarkdownRuntime)

export function renderMarkdownToHtml<TCustomNode extends BaseNode = never>(
  input: MarkstreamSvelteRenderOptions<TCustomNode>,
): string {
  return defaultMarkdownHtmlRenderer.renderMarkdownToHtml(input)
}

export function renderNestedMarkdownToHtml<TCustomNode extends BaseNode = never>(
  input: NestedMarkdownHtmlInput<TCustomNode>,
  options: NestedMarkdownHtmlOptions = {},
): string {
  return defaultMarkdownHtmlRenderer.renderNestedMarkdownToHtml(input, options)
}

export function renderMarkdownNodesToHtml<TCustomNode extends BaseNode = never>(
  nodes: readonly RenderableMarkdownNode<TCustomNode>[] | null | undefined,
  options: NestedMarkdownHtmlOptions = {},
): string {
  return defaultMarkdownHtmlRenderer.renderMarkdownNodesToHtml(nodes, options)
}

export function renderMarkdownNodeToHtml<TCustomNode extends BaseNode = never>(
  node: RenderableMarkdownNode<TCustomNode> | null | undefined,
  options: NestedMarkdownHtmlOptions = {},
): string {
  return defaultMarkdownHtmlRenderer.renderMarkdownNodeToHtml(node, options)
}
