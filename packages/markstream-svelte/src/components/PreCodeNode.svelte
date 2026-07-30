<script lang="ts">
  import type { CodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { encodeDataPayload } from '../utils/rendering/base64'
  import { sanitizeClassToken } from '../utils/rendering/html'

  let {
    node
  }: NodeProps<CodeBlockNode> = $props()

  let languageRaw = $derived(node.language.trim())
  let language = $derived(sanitizeClassToken(languageRaw))
  let code = $derived(node.code)
  let diff = $derived(node.diff === true)
  let loading = $derived(node.loading === true)
</script>

{#if !(loading && !code.trim())}
  <pre data-markstream-code-block="1" data-markstream-language={languageRaw || undefined} data-markstream-loading={loading ? '1' : undefined} data-markstream-diff={diff ? '1' : undefined} data-markstream-original={diff ? encodeDataPayload(node.originalCode ?? '') : undefined} data-markstream-updated={diff ? encodeDataPayload(node.updatedCode ?? '') : undefined} aria-busy={loading ? 'true' : undefined}><code class={language ? `language-${language}` : undefined}>{code}</code></pre>
{/if}
