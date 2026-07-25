<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { IndexedNodeProps } from '../types/componentProps'
  import type { SvelteRenderContext } from '../types/renderer'
  import CodeBlockNode from './CodeBlockNode.svelte'
  import D2BlockNode from './D2BlockNode.svelte'
  import InfographicBlockNode from './InfographicBlockNode.svelte'
  import MermaidBlockNode from './MermaidBlockNode.svelte'
  import PreCodeNode from './PreCodeNode.svelte'
  import { resolveNodeOutletCodeMode } from './shared/node-outlet-helpers'

  const EMPTY_RENDER_CONTEXT = { events: {} } satisfies SvelteRenderContext

  let {
    node,
    context = EMPTY_RENDER_CONTEXT,
    indexKey = undefined,
  }: IndexedNodeProps<ParserCodeBlockNode> = $props()

  const codeMode = $derived(resolveNodeOutletCodeMode(node, context))
  const codeBlockInstanceKey = $derived(
    `${String(indexKey ?? 'node')}:${node.language}:${node.diff ? 'diff' : 'code'}`,
  )
</script>

{#if codeMode === 'mermaid'}
  <MermaidBlockNode {node} {context} />
{:else if codeMode === 'd2'}
  <D2BlockNode {node} {context} />
{:else if codeMode === 'infographic'}
  <InfographicBlockNode {node} {context} />
{:else if codeMode === 'pre'}
  <PreCodeNode {node} />
{:else}
  {#key codeBlockInstanceKey}
    <CodeBlockNode {node} {context} />
  {/key}
{/if}
