<script lang="ts">
  import type { MathBlockNode as ParserMathBlockNode } from 'stream-markdown-parser'
  import type { ContextualNodeProps } from '../types/componentProps'
  import { KatexRenderer } from '../state/blocks/KatexRenderer.svelte'

  let {
    node,
    context = undefined,
  }: ContextualNodeProps<ParserMathBlockNode> = $props()

  const source = $derived(node.content || node.markup || node.raw)
  const raw = $derived(node.raw || source)
  const renderer = new KatexRenderer({
    getSource: () => source,
    getRaw: () => raw,
    getDisplayMode: () => true,
    getLoading: () => context?.final !== true && node.loading === true,
    getWorkerTimeoutMs: () => context?.mathProps?.workerTimeoutMs ?? 3000,
    getWorkerWaitTimeoutMs: () => context?.mathProps?.workerWaitTimeoutMs ?? 2000,
    getWorkerRetries: () => context?.mathProps?.workerRetries ?? 1,
  })
</script>

<div class="math-block markstream-nested-math-block" data-markstream-katex-managed="1">
  <div
    class="markstream-nested-math-block__render"
    class:math-rendering={renderer.state.kind === 'loading'}
  >
    {#if renderer.state.kind === 'ready'}
      {@html renderer.state.html}
    {:else if renderer.state.kind === 'fallback'}
      {renderer.state.text}
    {/if}
  </div>
  {#if renderer.state.kind === 'loading'}
    <div class="math-inline__loading" role="status" aria-live="polite">
      <span class="math-inline__spinner" aria-hidden="true"></span>
      <span class="sr-only">Loading</span>
    </div>
  {/if}
</div>
