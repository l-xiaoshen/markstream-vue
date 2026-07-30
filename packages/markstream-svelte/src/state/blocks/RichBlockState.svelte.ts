import type { TooltipPlacement } from '../../tooltip/singletonTooltip'
import { onDestroy } from 'svelte'
import { showTooltipForAnchor } from '../../tooltip/singletonTooltip'
import { copyTextToClipboard } from '../../utils/rendering/clipboard'

export type RichBlockMode = 'preview' | 'source'
export type RichBlockVisibilityHandler = (visible: boolean) => void | Promise<void>

interface RichBlockStateOptions {
  getIsDark: () => boolean
  getSource: () => string
  onCopy?: ((source: string) => void) | undefined
}

export class RichBlockState {
  copied = $state(false)
  collapsed = $state(false)
  showSource = $state(false)
  modalOpen = $state(false)
  zoom = $state(1)

  #copyTimer: ReturnType<typeof setTimeout> | undefined
  #destroyed = false

  constructor(private readonly options: RichBlockStateOptions) {
    onDestroy(() => {
      this.#destroyed = true
      this.#clearCopyTimer()
    })
  }

  #clearCopyTimer(): void {
    if (this.#copyTimer === undefined)
      return
    clearTimeout(this.#copyTimer)
    this.#copyTimer = undefined
  }

  async copy(): Promise<void> {
    const source = this.options.getSource()
    if (!await copyTextToClipboard(source))
      return
    if (this.#destroyed)
      return

    this.options.onCopy?.(source)
    this.copied = true
    this.#clearCopyTimer()
    this.#copyTimer = setTimeout(() => {
      this.copied = false
      this.#copyTimer = undefined
    }, 1000)
  }

  async switchMode(
    mode: RichBlockMode,
    onVisibilityChange?: RichBlockVisibilityHandler,
  ): Promise<void> {
    const nextShowSource = mode === 'source'
    if (this.showSource === nextShowSource)
      return
    this.showSource = nextShowSource
    await onVisibilityChange?.(!this.collapsed && !this.showSource)
  }

  async toggleCollapsed(
    onVisibilityChange?: RichBlockVisibilityHandler,
  ): Promise<void> {
    this.collapsed = !this.collapsed
    await onVisibilityChange?.(!this.collapsed && !this.showSource)
  }

  showButtonTooltip(
    event: MouseEvent | FocusEvent,
    text: string,
    placement: TooltipPlacement = 'top',
  ): void {
    const target = event.currentTarget
    if (
      !(target instanceof HTMLElement)
      || (target instanceof HTMLButtonElement && target.disabled)
    ) {
      return
    }
    showTooltipForAnchor(
      target,
      text,
      placement,
      false,
      undefined,
      this.options.getIsDark(),
    )
  }

  showCopyTooltip(
    event: MouseEvent | FocusEvent,
    copiedLabel: string,
    copyLabel: string,
  ): void {
    this.showButtonTooltip(event, this.copied ? copiedLabel : copyLabel)
  }

  closeModal(): void {
    this.modalOpen = false
  }

  openModal(canOpen = true): void {
    if (canOpen)
      this.modalOpen = true
  }

  resetZoom(): void {
    this.zoom = 1
  }

  zoomIn(): void {
    this.zoom = Math.min(3, Math.round((this.zoom + 0.1) * 10) / 10)
  }

  zoomOut(): void {
    this.zoom = Math.max(0.5, Math.round((this.zoom - 0.1) * 10) / 10)
  }
}
