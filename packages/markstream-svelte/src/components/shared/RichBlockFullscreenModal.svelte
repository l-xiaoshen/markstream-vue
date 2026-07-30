<script lang="ts">
  import RichBlockZoomControls from './RichBlockZoomControls.svelte'

  type RichBlockModalVariant = 'd2' | 'infographic' | 'mermaid'

  type Props = {
    closeLabel: string
    isDark: boolean
    markup: string
    onClose: () => void
    onContentElement?: (element: HTMLElement | null) => void
    onReset: () => void
    onZoomIn: () => void
    onZoomOut: () => void
    open: boolean
    resetLabel: string
    variant: RichBlockModalVariant
    zoom: number
    zoomInLabel: string
    zoomOutLabel: string
  }

  let {
    closeLabel,
    isDark,
    markup,
    onClose,
    onContentElement = undefined,
    onReset,
    onZoomIn,
    onZoomOut,
    open,
    resetLabel,
    variant,
    zoom,
    zoomInLabel,
    zoomOutLabel,
  }: Props = $props()

  function portal(element: HTMLElement) {
    document.body.appendChild(element)
    return () => element.remove()
  }

  function contentAttachment(element: HTMLElement) {
    onContentElement?.(element)
    return () => onContentElement?.(null)
  }

  function dialogAttachment(element: HTMLElement) {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    queueMicrotask(() => {
      if (element.isConnected)
        element.focus()
    })
    return () => {
      if (previousFocus?.isConnected)
        previousFocus.focus()
    }
  }

  function onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget)
      onClose()
  }

  function onModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab')
      return

    const dialog = event.currentTarget
    if (!(dialog instanceof HTMLElement))
      return
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), '
      + 'select:not([disabled]), textarea:not([disabled]), '
      + '[tabindex]:not([tabindex="-1"])',
    )).filter(element => !element.hasAttribute('hidden'))
    const first = focusable.at(0)
    const last = focusable.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialog.focus()
    }
    else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

{#if open}
  <div {@attach portal} class:dark={isDark} class="markstream-svelte markstream-svelte-modal-root">
    <div {@attach dialogAttachment} class={variant === 'infographic' ? 'mermaid-modal-overlay infographic-modal-overlay' : 'mermaid-modal-overlay'} role="dialog" aria-modal="true" tabindex="-1" onclick={onOverlayClick} onkeydown={onModalKeydown}>
      <div class={variant === 'infographic' ? 'mermaid-modal-panel infographic-modal-panel' : 'mermaid-modal-panel'}>
        <RichBlockZoomControls
          className="mermaid-modal-controls"
          {closeLabel}
          {isDark}
          {onReset}
          {onZoomIn}
          {onZoomOut}
          {resetLabel}
          showTooltips={false}
          {variant}
          {zoom}
          {zoomInLabel}
          {zoomOutLabel}
          onClose={onClose}
        />
        <div class="mermaid-modal-body">
          <div
            {@attach contentAttachment}
            class={variant === 'infographic'
              ? 'mermaid-modal-content infographic-modal-content'
              : variant === 'd2'
                ? 'mermaid-modal-content d2-svg'
                : 'mermaid-modal-content markstream-svelte-mermaid'}
            style={`transform: scale(${zoom});`}
          >{@html markup}</div>
        </div>
      </div>
    </div>
  </div>
{/if}
