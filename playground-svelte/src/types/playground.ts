import type { CustomMarkdownNode } from 'markstream-svelte'

export type ThinkingNodeData = CustomMarkdownNode<'thinking'>

export interface PlaygroundNodeSchema {
  thinking: ThinkingNodeData
}

export type PlaygroundPath = '/' | '/test'
export type RenderMode = 'monaco' | 'markdown' | 'pre'
