<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { getSafeI18n } from '../i18n/safeI18n'
  import { CodeBlockState } from '../state/blocks/CodeBlockState.svelte'
  import { hideTooltip } from '../tooltip/singletonTooltip'
  import HtmlPreviewFrame from './HtmlPreviewFrame.svelte'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserCodeBlockNode> = $props()

  const { t } = getSafeI18n()
  const options = $derived(context?.codeBlockProps)
  const block = new CodeBlockState(() => ({
    context,
    htmlPreviewTitle: t('artifacts.htmlPreviewTitle'),
    node,
    svgPreviewTitle: t('artifacts.svgPreviewTitle'),
  }))
  let LanguageIcon = $derived(block.languageIcon)

  function showCopyTooltip(event: MouseEvent | FocusEvent): void {
    block.showCopyTooltip(
      event,
      t('common.copied') || 'Copied',
      t('common.copy') || 'Copy',
    )
  }
</script>

{#if block.shouldRender}
  <div
    class:is-dark={block.resolvedIsDark}
    class:is-plain-text={block.monacoLanguage === 'plaintext'}
    class:is-rendering={block.resolvedLoading}
    class:is-diff={block.diff}
    class="code-block-container"
    data-markstream-code-block="1"
    data-markstream-enhanced={block.editorReady ? 'true' : 'false'}
    style={block.containerStyle}
  >
    {#if options?.showHeader !== false}
      <div class="code-block-header">
        <div class="code-block-header__meta">
          <span class="code-block-language-icon" aria-hidden="true"><LanguageIcon /></span>
          <span class="code-block-header__label">{block.diff ? `Diff / ${block.displayLanguage}` : block.displayLanguage}</span>
        </div>
        <div class="code-block-header__actions">
          {#if options?.showCopyButton !== false}
            <button type="button" class="code-action-btn" aria-label={block.copied ? t('common.copied') : t('common.copy')} onblur={() => hideTooltip()} onclick={() => void block.copy()} onfocus={showCopyTooltip} onmouseleave={() => hideTooltip()} onmouseenter={showCopyTooltip}>
              {#if block.copied}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5" /></svg>
              {:else}
                <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></g></svg>
              {/if}
            </button>
          {/if}
          {#if options?.showFontSizeButtons !== false && options?.enableFontSizeControl !== false}
            <button type="button" class="code-action-btn" aria-label={t('common.decrease')} onblur={() => hideTooltip()} onclick={() => block.changeFontSize(block.codeFontSize - 1)} onfocus={(event) => block.showButtonTooltip(event, t('common.decrease') || 'Decrease')} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, t('common.decrease') || 'Decrease')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" /></svg>
            </button>
            <button type="button" class="code-action-btn" aria-label={t('common.reset')} onblur={() => hideTooltip()} onclick={() => block.changeFontSize(block.defaultCodeFontSize)} onfocus={(event) => block.showButtonTooltip(event, t('common.reset') || 'Reset')} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, t('common.reset') || 'Reset')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8m0-5v5h5" /></svg>
            </button>
            <button type="button" class="code-action-btn" aria-label={t('common.increase')} onblur={() => hideTooltip()} onclick={() => block.changeFontSize(block.codeFontSize + 1)} onfocus={(event) => block.showButtonTooltip(event, t('common.increase') || 'Increase')} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, t('common.increase') || 'Increase')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14" /></svg>
            </button>
          {/if}
          {#if block.isPreviewable && options?.showPreviewButton !== false}
            <button type="button" class="code-action-btn" aria-label={t('common.preview')} onblur={() => hideTooltip()} onclick={() => block.togglePreview()} onfocus={(event) => block.showButtonTooltip(event, t('common.preview') || 'Preview')} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, t('common.preview') || 'Preview')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></g></svg>
            </button>
          {/if}
          {#if options?.showExpandButton !== false}
            <button type="button" class="code-action-btn" aria-pressed={block.expanded} aria-label={block.expanded ? t('common.collapse') : t('common.expand')} onblur={() => hideTooltip()} onclick={() => block.toggleExpanded()} onfocus={(event) => block.showButtonTooltip(event, block.expanded ? (t('common.collapse') || 'Collapse') : (t('common.expand') || 'Expand'))} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, block.expanded ? (t('common.collapse') || 'Collapse') : (t('common.expand') || 'Expand'))}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={block.expanded ? 'm14 10l7-7m-1 7h-6V4M3 21l7-7m-6 0h6v6' : 'M15 3h6v6m0-6l-7 7M3 21l7-7m-1 7H3v-6'} /></svg>
            </button>
          {/if}
          {#if options?.showCollapseButton !== false}
            <button type="button" class="code-action-btn" aria-pressed={block.collapsed} aria-label={block.collapsed ? t('common.expand') : t('common.collapse')} onblur={() => hideTooltip()} onclick={() => void block.toggleCollapsed()} onfocus={(event) => block.showButtonTooltip(event, block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse'))} onmouseleave={() => hideTooltip()} onmouseenter={(event) => block.showButtonTooltip(event, block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse'))}>
              <svg style:rotate={block.collapsed ? '0deg' : '90deg'} viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6" /></svg>
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if !block.collapsed}
      <div class:code-block-body--expanded={block.expanded} class="code-block-body">
        {#if !block.shouldDelayEditor}
          <div {@attach (element) => block.editorAttachment(element)} class:is-hidden={block.showPreFallback} class="code-editor-container"></div>
        {/if}
        {#if block.showPreFallback}
          <pre class="code-pre-fallback"><code class={block.preLanguageClass ? `language-${block.preLanguageClass}` : undefined}>{block.code}</code></pre>
        {/if}
      </div>
    {/if}

    {#if block.previewOpen && block.isPreviewable}
      <HtmlPreviewFrame code={block.code} title={block.previewTitle} isDark={block.resolvedIsDark} htmlPreviewAllowScripts={options?.htmlPreviewAllowScripts ?? false} htmlPreviewSandbox={options?.htmlPreviewSandbox} onClose={() => block.closePreview()} />
    {/if}
  </div>
{/if}
