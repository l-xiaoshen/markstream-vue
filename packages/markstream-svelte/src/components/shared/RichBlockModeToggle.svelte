<script lang="ts">
  import { hideTooltip, showTooltipForAnchor } from '../../tooltip/singletonTooltip'

  type RichBlockMode = 'preview' | 'source'
  type RichBlockModeVariant = 'd2' | 'infographic' | 'mermaid'

  type Props = {
    isDark: boolean
    isSource: boolean
    onChange: (mode: RichBlockMode) => void | Promise<void>
    previewLabel: string
    sourceLabel: string
    variant: RichBlockModeVariant
  }

  let {
    isDark,
    isSource,
    onChange,
    previewLabel,
    sourceLabel,
    variant,
  }: Props = $props()

  const containerClass = $derived({
    d2: 'd2-mode-toggle',
    infographic: 'infographic-mode-toggle',
    mermaid: 'mermaid-toggle',
  }[variant])

  function buttonClass(mode: RichBlockMode): string {
    const active = mode === 'source' ? isSource : !isSource
    if (variant === 'mermaid') {
      return [
        'mermaid-toggle-btn',
        active ? 'mermaid-toggle-btn--active' : '',
      ].filter(Boolean).join(' ')
    }
    return [
      'markstream-svelte-enhanced-block__action',
      'mode-btn',
      `${variant}-mode-btn`,
      active ? 'is-active' : '',
    ].filter(Boolean).join(' ')
  }

  function showTooltip(
    event: MouseEvent | FocusEvent,
    text: string,
  ): void {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement))
      return
    showTooltipForAnchor(target, text, 'top', false, undefined, isDark)
  }
</script>

<div class={containerClass}>
  <button type="button" class={buttonClass('preview')} onblur={() => hideTooltip()} onclick={() => onChange('preview')} onfocus={(event) => showTooltip(event, previewLabel)} onmouseleave={() => hideTooltip()} onmouseenter={(event) => showTooltip(event, previewLabel)}>
    {#if variant === 'd2'}
      {previewLabel}
    {:else}
      <span class={variant === 'mermaid' ? 'mermaid-action-content' : 'markstream-svelte-enhanced-block__action-content'}>
        <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></g></svg>
        <span>{previewLabel}</span>
      </span>
    {/if}
  </button>
  <button type="button" class={buttonClass('source')} onblur={() => hideTooltip()} onclick={() => onChange('source')} onfocus={(event) => showTooltip(event, sourceLabel)} onmouseleave={() => hideTooltip()} onmouseenter={(event) => showTooltip(event, sourceLabel)}>
    {#if variant === 'd2'}
      {sourceLabel}
    {:else}
      <span class={variant === 'mermaid' ? 'mermaid-action-content' : 'markstream-svelte-enhanced-block__action-content'}>
        <svg aria-hidden="true" role="img" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 18l6-6l-6-6M8 6l-6 6l6 6"/></svg>
        <span>{sourceLabel}</span>
      </span>
    {/if}
  </button>
</div>
