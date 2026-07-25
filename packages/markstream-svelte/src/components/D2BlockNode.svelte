<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { getSafeI18n } from '../i18n/safeI18n'
  import { D2BlockState } from '../state/blocks/D2BlockState.svelte'
  import RichBlockActionButton from './shared/RichBlockActionButton.svelte'
  import RichBlockFullscreenModal from './shared/RichBlockFullscreenModal.svelte'
  import RichBlockModeToggle from './shared/RichBlockModeToggle.svelte'
  import RichBlockZoomControls from './shared/RichBlockZoomControls.svelte'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserCodeBlockNode> = $props()

  const { t } = getSafeI18n()
  const options = $derived(context?.d2Props)
  const block = new D2BlockState(() => ({
    context,
    node,
  }))

  function showCopyTooltip(event: MouseEvent | FocusEvent): void {
    block.showCopyTooltip(
      event,
      t('common.copied') || 'Copied',
      t('common.copy') || 'Copy',
    )
  }
</script>

{#snippet copyIcon()}
  {#if block.copied}
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>
  {:else}
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>
  {/if}
{/snippet}

{#snippet exportIcon()}
  <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0-12l-4 4m4-4l4 4M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>
{/snippet}

{#snippet fullscreenIcon()}
  <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6v6m0-6l-7 7M3 21l7-7m-1 7H3v-6"/></svg>
{/snippet}

{#snippet collapseIcon()}
  <svg aria-hidden="true" role="img" style:transform={block.collapsed ? 'rotate(0deg)' : 'rotate(90deg)'} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg>
{/snippet}

{#if block.shouldRender}
  <div
    class:dark={block.resolvedIsDark}
    class:is-rendering={block.rendering || block.resolvedLoading}
    class="markstream-svelte-enhanced-block markstream-svelte-enhanced-block--d2"
    data-markstream-d2="1"
    data-markstream-mode={block.showSource
      ? 'source'
      : block.showLoading
        ? 'loading'
        : block.showSourceFallback
          ? 'fallback'
          : 'preview'}
  >
    {#if options?.showHeader !== false}
      <div class="markstream-svelte-enhanced-block__header d2-block-header">
        <div class="d2-header-title">
          <span class="d2-label">D2</span>
        </div>
        <div class="markstream-svelte-enhanced-block__actions d2-header-actions">
          {#if options?.showModeToggle !== false}
            <RichBlockModeToggle variant="d2" isDark={block.resolvedIsDark} isSource={block.showSource} onChange={(mode) => block.switchMode(mode)} previewLabel={t('common.preview') || 'Preview'} sourceLabel={t('common.source') || 'Source'} />
          {/if}
          {#if options?.showCopyButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon d2-action-btn" icon={copyIcon} label={block.copied ? (t('common.copied') || 'Copied') : (t('common.copy') || 'Copy')} onClick={() => void block.copy()} onShowTooltip={showCopyTooltip} />
          {/if}
          {#if options?.showExportButton !== false && block.svgMarkup}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon d2-action-btn" icon={exportIcon} label={t('common.export') || 'Export'} onClick={() => block.exportSvg()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.export') || 'Export')} />
          {/if}
          {#if options?.showFullscreenButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon d2-action-btn" disabled={!block.svgMarkup || block.showSource || block.collapsed} icon={fullscreenIcon} label={t('common.open') || 'Open'} onClick={() => block.openModal()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.open') || 'Open')} />
          {/if}
          {#if options?.showCollapseButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon d2-action-btn" icon={collapseIcon} label={block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse')} onClick={() => void block.toggleCollapsed()} onShowTooltip={(event) => block.showButtonTooltip(event, block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse'))} pressed={block.collapsed} />
          {/if}
        </div>
      </div>
    {/if}

    {#if !block.collapsed}
      <div class="markstream-svelte-enhanced-block__body d2-block-body">
        {#if block.showSourceFallback}
          <div class="d2-source">
            <pre class="d2-code"><code>{block.source}</code></pre>
            {#if block.renderError}
              <p class="d2-error">{block.renderError}</p>
            {/if}
          </div>
        {:else if block.showLoading}
          <div class="rich-block-loading" role="status" aria-live="polite">
            <span class="rich-block-spinner" aria-hidden="true"></span>
            <span>{t('common.preview')}</span>
          </div>
        {:else}
          {#if options?.showZoomControls !== false}
            <RichBlockZoomControls className="markstream-svelte-zoom-controls" isDark={block.resolvedIsDark} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="d2" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
          {/if}
          <div class="d2-render" style={block.renderStyle}>
            <div class="d2-svg" style={block.transformStyle}>{@html block.svgMarkup}</div>
            {#if block.renderError}
              <p class="d2-error">{block.renderError}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
    <RichBlockFullscreenModal closeLabel={t('common.close') || 'Close'} isDark={block.resolvedIsDark} markup={block.svgMarkup} onClose={() => block.closeModal()} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} open={block.modalOpen} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="d2" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
  </div>
{/if}
