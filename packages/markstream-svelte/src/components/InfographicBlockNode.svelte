<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import { getSafeI18n } from '../i18n/safeI18n'
  import { InfographicBlockState } from '../state/blocks/InfographicBlockState.svelte'
  import InfographicIcon from './shared/InfographicIcon.svelte'
  import RichBlockActionButton from './shared/RichBlockActionButton.svelte'
  import RichBlockFullscreenModal from './shared/RichBlockFullscreenModal.svelte'
  import RichBlockModeToggle from './shared/RichBlockModeToggle.svelte'
  import RichBlockZoomControls from './shared/RichBlockZoomControls.svelte'

  let {
    node,
    context = undefined,
  }: NodeProps<ParserCodeBlockNode> = $props()

  const { t } = getSafeI18n()
  const options = $derived(context?.infographicProps)
  const block = new InfographicBlockState(() => ({
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

{#snippet collapseIcon()}
  <svg aria-hidden="true" role="img" style:transform={block.collapsed ? 'rotate(0deg)' : 'rotate(90deg)'} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg>
{/snippet}

{#snippet copyIcon()}
  {#if block.copied}
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>
  {:else}
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>
  {/if}
{/snippet}

{#snippet exportIcon()}
  <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10l5 5l5-5"/></g></svg>
{/snippet}

{#snippet fullscreenIcon()}
  <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6v6m0-6l-7 7M3 21l7-7m-1 7H3v-6"/></svg>
{/snippet}

{#if block.shouldRender}
  <div
    class:dark={block.resolvedIsDark}
    class:is-rendering={block.rendering || block.resolvedLoading}
    class="markstream-svelte-enhanced-block markstream-svelte-enhanced-block--infographic"
    data-markstream-infographic="1"
    data-markstream-mode={block.showSource ? 'source' : block.hasPreview ? 'preview' : 'fallback'}
  >
    {#if options?.showHeader !== false}
      <div class="markstream-svelte-enhanced-block__header infographic-block-header">
        <div class="markstream-svelte-enhanced-block__title">
          <span class="markstream-svelte-enhanced-block__title-icon icon-slot action-icon" aria-hidden="true"><InfographicIcon /></span>
          <span class="markstream-svelte-enhanced-block__title-text infographic-label">Infographic</span>
        </div>
        {#if options?.showModeToggle !== false}
          <RichBlockModeToggle variant="infographic" isDark={block.resolvedIsDark} isSource={block.showSource} onChange={(mode) => block.switchMode(mode)} previewLabel={t('common.preview') || 'Preview'} sourceLabel={t('common.source') || 'Source'} />
        {/if}
        <div class="markstream-svelte-enhanced-block__actions infographic-header-actions">
          {#if options?.showCollapseButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon infographic-action-btn" icon={collapseIcon} label={block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse')} onClick={() => void block.toggleCollapsed()} onShowTooltip={(event) => block.showButtonTooltip(event, block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse'))} pressed={block.collapsed} />
          {/if}
          {#if options?.showCopyButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon infographic-action-btn" icon={copyIcon} label={block.copied ? (t('common.copied') || 'Copied') : (t('common.copy') || 'Copy')} onClick={() => void block.copy()} onShowTooltip={showCopyTooltip} />
          {/if}
          {#if options?.showExportButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon infographic-action-btn" disabled={!block.hasPreview || block.showSource || block.collapsed} icon={exportIcon} label={t('common.export') || 'Export'} onClick={() => block.exportSvg()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.export') || 'Export')} />
          {/if}
          {#if options?.showFullscreenButton !== false}
            <RichBlockActionButton className="markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon infographic-action-btn" disabled={!block.hasPreview || block.showSource || block.collapsed} icon={fullscreenIcon} label={t('common.open') || 'Open'} onClick={() => block.openModal()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.open') || 'Open')} />
          {/if}
        </div>
      </div>
    {/if}

    <div
      class="markstream-svelte-enhanced-block__body infographic-block-body"
      hidden={block.collapsed}
    >
      {#if block.showSource}
        <div class="infographic-source">
          <pre class="infographic-source-code"><code>{block.source}</code></pre>
        </div>
      {:else}
        {#if options?.showZoomControls !== false}
          <RichBlockZoomControls className="markstream-svelte-zoom-controls" isDark={block.resolvedIsDark} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="infographic" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
        {/if}
        <div class="infographic-render" style={block.previewStyle}>
          <div {@attach (element) => block.renderAttachment(element)} style={block.transformStyle}></div>
          {#if block.renderError}
            <p class="rich-block-error infographic-error">{block.renderError}</p>
          {/if}
        </div>
      {/if}
    </div>

    <RichBlockFullscreenModal closeLabel={t('common.close') || 'Close'} isDark={block.resolvedIsDark} markup={block.modalMarkup} onClose={() => block.closeModal()} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} open={block.modalOpen} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="infographic" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
  </div>
{/if}
