import type { BaseNode, MarkdownIt, ParseOptions } from 'stream-markdown-parser'
import type { MarkdownRuntime } from './internal/markdownRuntime'
import {
  createMarkdownRuntime,
  defaultMarkdownRuntime,
} from './internal/markdownRuntime'
import { getRenderableNodeChildren } from './types/nodes'
import { copyNodes, getNodeContent } from './utils/rendering/nodes'

export interface NestedMarkdownNodesInput<TNode extends BaseNode = BaseNode> {
  node?: TNode | null
  nodes?: readonly TNode[] | null
  content?: string | null
}

export interface NestedMarkdownNodesOptions {
  cacheKey?: string
  final?: boolean
  parseOptions?: ParseOptions
  customHtmlTags?: readonly string[]
  customMarkdownIt?: (markdown: MarkdownIt) => MarkdownIt
}

const DEFAULT_CACHE_KEY = 'markstream-svelte-nested-nodes'

export interface NestedMarkdownParser {
  parse: {
    <TNode extends BaseNode>(
      input: NestedMarkdownNodesInput<TNode> & { nodes: readonly TNode[] },
      options?: NestedMarkdownNodesOptions,
    ): TNode[]
    (
      input: NestedMarkdownNodesInput,
      options?: NestedMarkdownNodesOptions,
    ): BaseNode[]
  }
}

function createParser(markdownRuntime: MarkdownRuntime): NestedMarkdownParser {
  function parse<TNode extends BaseNode>(
    input: NestedMarkdownNodesInput<TNode> & { nodes: readonly TNode[] },
    options?: NestedMarkdownNodesOptions,
  ): TNode[]
  function parse(
    input: NestedMarkdownNodesInput,
    options?: NestedMarkdownNodesOptions,
  ): BaseNode[]
  function parse(
    input: NestedMarkdownNodesInput,
    options: NestedMarkdownNodesOptions = {},
  ): BaseNode[] {
    if (Array.isArray(input.nodes))
      return copyNodes(input.nodes)

    const nestedNode = input.node
    if (nestedNode) {
      const children = getRenderableNodeChildren(nestedNode)
      if (children.length > 0)
        return copyNodes(children)
    }

    const content = resolveContent(input)
    if (!content)
      return []

    return markdownRuntime.parse(content, {
      cacheKey: options.cacheKey || DEFAULT_CACHE_KEY,
      customHtmlTags: options.customHtmlTags,
      customMarkdownIt: options.customMarkdownIt,
      final: options.final ?? resolveFinalFromNode(input.node),
      parseOptions: options.parseOptions,
    })
  }

  return { parse }
}

export function createNestedMarkdownParser(): NestedMarkdownParser {
  return createParser(createMarkdownRuntime())
}

const defaultNestedMarkdownParser = createParser(defaultMarkdownRuntime)

export function parseNestedMarkdownToNodes<TNode extends BaseNode>(
  input: NestedMarkdownNodesInput<TNode> & { nodes: readonly TNode[] },
  options?: NestedMarkdownNodesOptions,
): TNode[]
export function parseNestedMarkdownToNodes(
  input: NestedMarkdownNodesInput,
  options?: NestedMarkdownNodesOptions,
): BaseNode[]
export function parseNestedMarkdownToNodes(
  input: NestedMarkdownNodesInput,
  options: NestedMarkdownNodesOptions = {},
): BaseNode[] {
  return defaultNestedMarkdownParser.parse(input, options)
}

function resolveContent(input: NestedMarkdownNodesInput) {
  if (typeof input.content === 'string')
    return input.content
  return input.node ? getNodeContent(input.node) ?? '' : ''
}

function resolveFinalFromNode(node?: BaseNode | null) {
  if (!node)
    return undefined
  if (typeof node.loading === 'boolean')
    return !node.loading
  return undefined
}
