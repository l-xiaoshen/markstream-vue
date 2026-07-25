import type { BaseNode } from 'stream-markdown-parser'
import type { SvelteRenderContext } from './renderer'

export interface NodeProps<TNode extends BaseNode = BaseNode> {
  node: TNode
  context?: SvelteRenderContext | undefined
  indexKey?: string | number | undefined
}
