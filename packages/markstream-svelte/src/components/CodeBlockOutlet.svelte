<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
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
  }: NodeProps<ParserCodeBlockNode> = $props()

  const codeMode = $derived(resolveNodeOutletCodeMode(node, context))
  const standardProps = $derived({ node, context, indexKey })
  const codeBlockInstanceKey = $derived(
    `${String(indexKey ?? 'node')}:${node.language}:${node.diff ? 'diff' : 'code'}`,
  )
</script>

{#if codeMode === 'mermaid'}
  <MermaidBlockNode {...standardProps} />
{:else if codeMode === 'd2'}
  <D2BlockNode {...standardProps} />
{:else if codeMode === 'infographic'}
  <InfographicBlockNode {...standardProps} />
{:else if codeMode === 'pre'}
  <PreCodeNode {...standardProps} />
{:else}
  {#key codeBlockInstanceKey}
    <CodeBlockNode {...standardProps} />
  {/key}
{/if}
