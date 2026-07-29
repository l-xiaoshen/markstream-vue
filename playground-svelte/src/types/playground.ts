import type { CustomMarkdownNode } from 'markstream-svelte'

export type ThinkingNodeData = CustomMarkdownNode<'thinking'>

export interface PlaygroundNodeSchema {
  thinking: ThinkingNodeData
}

export type RenderMode = 'monaco' | 'markdown' | 'pre'
