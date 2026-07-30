<script lang="ts">
  import { hideTooltip, showTooltipForAnchor } from '../../tooltip/singletonTooltip'

  type RichBlockZoomVariant = 'd2' | 'infographic' | 'mermaid'

  type Props = {
    className: string
    closeLabel?: string
    isDark: boolean
    onClose?: () => void
    onReset: () => void
    onZoomIn: () => void
    onZoomOut: () => void
    resetLabel: string
    showTooltips?: boolean
    variant: RichBlockZoomVariant
    zoom: number
    zoomInLabel: string
    zoomOutLabel: string
  }

  let {
    className,
    closeLabel = undefined,
    isDark,
    onClose = undefined,
    onReset,
    onZoomIn,
    onZoomOut,
    resetLabel,
    showTooltips = true,
    variant,
    zoom,
    zoomInLabel,
    zoomOutLabel,
  }: Props = $props()

  const iconButtonClass = $derived(
    variant === 'mermaid'
      ? 'mermaid-btn mermaid-action-btn mermaid-btn--icon'
      : variant === 'd2'
        ? 'markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon d2-action-btn'
        : 'markstream-svelte-enhanced-block__action markstream-svelte-enhanced-block__action--icon infographic-action-btn',
  )
  const resetButtonClass = $derived(
    variant === 'mermaid'
      ? 'mermaid-btn mermaid-action-btn mermaid-zoom-reset'
      : variant === 'd2'
        ? 'markstream-svelte-enhanced-block__action d2-action-btn infographic-zoom-reset'
        : 'markstream-svelte-enhanced-block__action infographic-action-btn infographic-zoom-reset',
  )

  function showTooltip(
    event: MouseEvent | FocusEvent,
    text: string,
  ): void {
    if (!showTooltips)
      return
    const target = event.currentTarget
    if (!(target instanceof HTMLElement))
      return
    showTooltipForAnchor(target, text, 'top', false, undefined, isDark)
  }
</script>

<div class={className}>
  <button type="button" class={iconButtonClass} aria-label={zoomInLabel} onblur={() => hideTooltip()} onclick={onZoomIn} onfocus={(event) => showTooltip(event, zoomInLabel)} onmouseleave={() => hideTooltip()} onmouseenter={(event) => showTooltip(event, zoomInLabel)}>
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M11 8v6m-3-3h6"/></g></svg>
  </button>
  <button type="button" class={iconButtonClass} aria-label={zoomOutLabel} onblur={() => hideTooltip()} onclick={onZoomOut} onfocus={(event) => showTooltip(event, zoomOutLabel)} onmouseleave={() => hideTooltip()} onmouseenter={(event) => showTooltip(event, zoomOutLabel)}>
    <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M8 11h6"/></g></svg>
  </button>
  <button type="button" class={resetButtonClass} aria-label={resetLabel} onblur={() => hideTooltip()} onclick={onReset} onfocus={(event) => showTooltip(event, resetLabel)} onmouseleave={() => hideTooltip()} onmouseenter={(event) => showTooltip(event, resetLabel)}>{Math.round(zoom * 100)}%</button>
  {#if closeLabel && onClose}
    <button type="button" class={iconButtonClass} aria-label={closeLabel} onclick={onClose}>
      <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  {/if}
</div>
