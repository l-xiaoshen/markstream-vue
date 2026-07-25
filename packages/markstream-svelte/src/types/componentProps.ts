import type { BaseNode } from 'stream-markdown-parser'
import type { SvelteRenderContext } from './renderer'

export interface NodeProps<TNode extends BaseNode> {
  node: TNode
}

export interface ContextualNodeProps<TNode extends BaseNode>
  extends NodeProps<TNode> {
  context?: SvelteRenderContext | undefined
}

export interface IndexedNodeProps<TNode extends BaseNode>
  extends ContextualNodeProps<TNode> {
  indexKey?: string | number | undefined
}
