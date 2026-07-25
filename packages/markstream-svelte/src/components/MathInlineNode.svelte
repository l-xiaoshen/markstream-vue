<script lang="ts">
  import type { MathInlineNode as ParserMathInlineNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { KatexRenderer } from '../state/blocks/KatexRenderer.svelte'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserMathInlineNode> = $props()

  const source = $derived(node.content || node.markup || node.raw)
  const raw = $derived(node.raw || source)
  const displayMode = $derived(node.markup === '$$')
  const renderer = new KatexRenderer({
    getSource: () => source,
    getRaw: () => raw,
    getDisplayMode: () => displayMode,
    getLoading: () => context?.final !== true && node.loading === true,
    getWorkerTimeoutMs: () => context?.mathProps?.workerTimeoutMs ?? 1500,
    getWorkerWaitTimeoutMs: () => context?.mathProps?.workerWaitTimeoutMs ?? 1500,
    getWorkerRetries: () => context?.mathProps?.workerRetries ?? 1,
  })
</script>

<span
  class="math-inline-wrapper markstream-nested-math"
  data-display={displayMode ? 'block' : 'inline'}
  data-markstream-katex-managed="1"
>
  <span class="math-inline" class:math-inline--hidden={renderer.state.kind === 'loading'}>
    {#if renderer.state.kind === 'ready'}
      {@html renderer.state.html}
    {:else if renderer.state.kind === 'fallback'}
      {renderer.state.text}
    {/if}
  </span>
  {#if renderer.state.kind === 'loading'}
    <span class="math-inline__loading" role="status" aria-live="polite">
      <span class="math-inline__spinner" aria-hidden="true"></span>
      <span class="sr-only">Loading</span>
    </span>
  {/if}
</span>
