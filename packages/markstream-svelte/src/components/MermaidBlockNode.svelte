<script lang="ts">
  import type { CodeBlockNode as ParserCodeBlockNode } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import type { NodeRendererMermaidProps } from '../types/renderer'
  import { getSafeI18n } from '../i18n/safeI18n'
  import { MermaidBlockState } from '../state/blocks/MermaidBlockState.svelte'
  import MermaidLanguageIcon from './shared/MermaidLanguageIcon.svelte'
  import RichBlockActionButton from './shared/RichBlockActionButton.svelte'
  import RichBlockFullscreenModal from './shared/RichBlockFullscreenModal.svelte'
  import RichBlockModeToggle from './shared/RichBlockModeToggle.svelte'
  import RichBlockZoomControls from './shared/RichBlockZoomControls.svelte'
  import { mergeLegacyNodeOptions } from './shared/node-helpers'

  /** @deprecated Pass these settings through `context.mermaidProps`. */
  interface LegacyMermaidNodeProps extends NodeRendererMermaidProps {
    isDark?: boolean | undefined
    loading?: boolean | undefined
  }

  interface Props extends NodeProps<ParserCodeBlockNode>, LegacyMermaidNodeProps {}

  let {
    node,
    context = undefined,
    indexKey: _indexKey = undefined,
    isDark = undefined,
    loading = undefined,
    ...directOptions
  }: Props = $props()

  const { t } = getSafeI18n()
  const resolvedNode = $derived(
    loading === undefined ? node : { ...node, loading },
  )
  const resolvedContext = $derived(mergeLegacyNodeOptions(context, {
    isDark,
    mermaidProps: directOptions,
  }))
  const options = $derived(resolvedContext.mermaidProps)
  const block = new MermaidBlockState(() => ({
    context: resolvedContext,
    node: resolvedNode,
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
  <svg style:rotate={block.collapsed ? '0deg' : '90deg'} viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6" /></svg>
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
    class:is-rendering={block.resolvedLoading || block.rendering}
    class="mermaid-block"
    data-markstream-mermaid="1"
    data-markstream-mode={block.showSource ? 'source' : block.canUsePreview ? 'preview' : 'fallback'}
  >
    {#if options?.showHeader !== false}
      <div class="mermaid-header">
        <div class="mermaid-header__title">
          <span class="icon-slot action-icon" aria-hidden="true"><MermaidLanguageIcon /></span>
          <span class="mermaid-title__text">Mermaid</span>
        </div>
        {#if options?.showModeToggle !== false}
          <RichBlockModeToggle variant="mermaid" isDark={block.resolvedIsDark} isSource={block.showSource} onChange={(mode) => block.switchMode(mode)} previewLabel={t('common.preview') || 'Preview'} sourceLabel={t('common.source') || 'Source'} />
        {/if}
        <div class="mermaid-actions">
          {#if options?.showCollapseButton !== false}
            <RichBlockActionButton className="mermaid-btn mermaid-action-btn mermaid-btn--icon" icon={collapseIcon} label={block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse')} onClick={() => void block.toggleCollapsed()} onShowTooltip={(event) => block.showButtonTooltip(event, block.collapsed ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Collapse'))} pressed={block.collapsed} />
          {/if}
          {#if options?.showCopyButton !== false}
            <RichBlockActionButton className="mermaid-btn mermaid-action-btn mermaid-btn--icon" icon={copyIcon} label={block.copied ? (t('common.copied') || 'Copied') : (t('common.copy') || 'Copy')} onClick={() => void block.copy()} onShowTooltip={showCopyTooltip} />
          {/if}
          {#if options?.showExportButton !== false}
            <RichBlockActionButton className="mermaid-btn mermaid-action-btn mermaid-btn--icon" disabled={!block.svgMarkup || block.showSource || block.collapsed} icon={exportIcon} label={t('common.export') || 'Export'} onClick={() => block.exportSvg()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.export') || 'Export')} />
          {/if}
          {#if options?.showFullscreenButton !== false}
            <RichBlockActionButton className="mermaid-btn mermaid-action-btn mermaid-btn--icon" disabled={!block.svgMarkup || block.showSource || block.collapsed} icon={fullscreenIcon} label={t('common.open') || 'Open'} onClick={() => block.openModal()} onShowTooltip={(event) => block.showButtonTooltip(event, t('common.open') || 'Open')} />
          {/if}
        </div>
      </div>
    {/if}

    {#if !block.collapsed}
      <div class="mermaid-body">
        {#if block.showSource}
          <pre class="mermaid-source"><code>{block.source}</code></pre>
        {:else}
          {#if options?.showZoomControls !== false}
            <RichBlockZoomControls className="markstream-svelte-zoom-controls" isDark={block.resolvedIsDark} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="mermaid" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
          {/if}
          <div {@attach (element) => block.previewAttachment(element)} class="mermaid-preview markstream-svelte-mermaid" style={block.previewStyle}>
            {#if block.svgMarkup}
              {@html block.svgMarkup}
            {:else if block.renderError}
              <pre class="mermaid-source"><code>{block.source}</code></pre>
            {:else}
              <div class="mermaid-loading"><span class="mermaid-spinner"></span> {t('common.preview')}</div>
            {/if}
          </div>
          {#if block.renderError}
            <div class="mermaid-error">{block.renderError}</div>
          {/if}
        {/if}
      </div>
    {/if}

    <RichBlockFullscreenModal closeLabel={t('common.close') || 'Close'} isDark={block.resolvedIsDark} markup={block.svgMarkup} onClose={() => block.closeModal()} onContentElement={(element) => block.setModalHost(element)} onReset={() => block.resetZoom()} onZoomIn={() => block.zoomIn()} onZoomOut={() => block.zoomOut()} open={block.modalOpen} resetLabel={t('common.resetZoom') || 'Reset zoom'} variant="mermaid" zoom={block.zoom} zoomInLabel={t('common.zoomIn') || 'Zoom in'} zoomOutLabel={t('common.zoomOut') || 'Zoom out'} />
  </div>
{/if}
