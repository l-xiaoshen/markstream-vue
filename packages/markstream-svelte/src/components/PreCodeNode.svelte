<script lang="ts">
  import type { SvelteRenderableNode } from './shared/node-helpers'
  import { encodeDataPayload, sanitizeClassToken } from './shared/node-helpers'

  type Props = {
    node: SvelteRenderableNode<'code_block'>
  };
  let {
    node
  }: Props = $props()

  let languageRaw = $derived((node.language || '').trim())
  let language = $derived(sanitizeClassToken(languageRaw))
  let code = $derived(node.code || '')
  let diff = $derived(Boolean(node.diff))
  let loading = $derived(node.loading === true)
</script>

{#if !(loading && !code.trim())}
  <pre data-markstream-code-block="1" data-markstream-language={languageRaw || undefined} data-markstream-loading={loading ? '1' : undefined} data-markstream-diff={diff ? '1' : undefined} data-markstream-original={diff ? encodeDataPayload(node.originalCode || '') : undefined} data-markstream-updated={diff ? encodeDataPayload(node.updatedCode || '') : undefined} aria-busy={loading ? 'true' : undefined}><code class={language ? `language-${language}` : undefined}>{code}</code></pre>
{/if}
