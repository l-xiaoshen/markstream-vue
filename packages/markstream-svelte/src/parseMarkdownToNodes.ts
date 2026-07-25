import type { BaseNode } from 'stream-markdown-parser'
import type { MarkdownRuntime } from './internal/markdownRuntime'
import type { ParsedMarkdownNode } from './types/nodes'
import type { NodeRendererProps } from './types/renderer'
import {
  createMarkdownRuntime,
  defaultMarkdownRuntime,
} from './internal/markdownRuntime'
import { copyNodes } from './utils/rendering/nodes'

export interface MarkdownNodeParser {
  parse: <TCustomNode extends BaseNode = never>(
    props: NodeRendererProps<TCustomNode>,
  ) => ParsedMarkdownNode<TCustomNode>[]
}

function createParser(markdownRuntime: MarkdownRuntime): MarkdownNodeParser {
  return {
    parse(props) {
      if (Array.isArray(props.nodes))
        return copyNodes(props.nodes)

      const content = props.content ?? ''
      if (!content)
        return []

      return markdownRuntime.parse(content, {
        cacheKey: props.customId || 'markstream-svelte',
        customHtmlTags: props.customHtmlTags,
        customMarkdownIt: props.customMarkdownIt,
        final: props.final,
        parseOptions: props.parseOptions,
      })
    },
  }
}

export function createMarkdownNodeParser(): MarkdownNodeParser {
  return createParser(createMarkdownRuntime())
}

const defaultMarkdownNodeParser = createParser(defaultMarkdownRuntime)

export function resolveParsedNodes<TCustomNode extends BaseNode = never>(
  props: NodeRendererProps<TCustomNode>,
): ParsedMarkdownNode<TCustomNode>[] {
  return defaultMarkdownNodeParser.parse(props)
}
