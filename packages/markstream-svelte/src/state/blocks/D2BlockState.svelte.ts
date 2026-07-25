import type { CodeBlockNode } from 'stream-markdown-parser'
import type { NodeRendererD2Props, SvelteRenderContext } from '../../types/renderer'
import type { RichBlockMode } from './RichBlockState.svelte'
import { tick } from 'svelte'
import { downloadSvgMarkup } from '../../utils/richBlockDom'
import { D2Renderer } from './D2Renderer.svelte'
import { RichBlockState } from './RichBlockState.svelte'

interface D2BlockInput {
  context?: SvelteRenderContext | undefined
  node: CodeBlockNode
}

export class D2BlockState {
  #input: D2BlockInput
  #documentStreaming: boolean
  #maxHeight: string | null
  #options: NodeRendererD2Props

  collapsed: boolean
  copied: boolean
  modalOpen: boolean
  renderError: string
  rendering: boolean
  renderStyle: string
  resolvedIsDark: boolean
  resolvedLoading: boolean
  shouldRender: boolean
  showLoading: boolean
  showSource: boolean
  showSourceFallback: boolean
  source: string
  svgMarkup: string
  transformStyle: string
  zoom: number

  readonly chrome: RichBlockState
  readonly renderer: D2Renderer
  readonly closeModal: RichBlockState['closeModal']
  readonly copy: RichBlockState['copy']
  readonly resetZoom: RichBlockState['resetZoom']
  readonly showButtonTooltip: RichBlockState['showButtonTooltip']
  readonly showCopyTooltip: RichBlockState['showCopyTooltip']
  readonly zoomIn: RichBlockState['zoomIn']
  readonly zoomOut: RichBlockState['zoomOut']

  constructor(private readonly getInput: () => D2BlockInput) {
    this.#input = $derived(this.getInput())
    this.#options = $derived(this.#input.context?.d2Props ?? {})
    this.#maxHeight = $derived(
      this.#options.maxHeight === undefined ? '500px' : this.#options.maxHeight,
    )
    this.source = $derived(this.#input.node.code)
    this.resolvedLoading = $derived(this.#input.node.loading === true)
    this.#documentStreaming = $derived(
      this.#input.context?.final === false || this.resolvedLoading,
    )
    this.resolvedIsDark = $derived(this.#input.context?.isDark ?? false)
    this.shouldRender = $derived(
      !(this.resolvedLoading && !this.source.trim()),
    )
    this.renderStyle = $derived(
      this.#maxHeight && this.#maxHeight !== 'none'
        ? `max-height: ${this.#maxHeight}`
        : '',
    )

    this.chrome = new RichBlockState({
      getIsDark: () => this.resolvedIsDark,
      getSource: () => this.source,
      onCopy: value => this.#input.context?.events?.onCopy?.(value),
    })
    this.renderer = new D2Renderer({
      getActive: () => !this.chrome.collapsed && !this.chrome.showSource,
      getDarkThemeId: () => this.#options.darkThemeId,
      getDebounceMs: () => this.#documentStreaming
        ? (this.#options.renderDebounceMs ?? 120)
        : 0,
      getIsDark: () => this.resolvedIsDark,
      getSource: () => this.source,
      getThemeId: () => this.#options.themeId,
    })

    this.collapsed = $derived(this.chrome.collapsed)
    this.copied = $derived(this.chrome.copied)
    this.modalOpen = $derived(this.chrome.modalOpen)
    this.renderError = $derived(this.renderer.renderError)
    this.rendering = $derived(this.renderer.rendering)
    this.showSource = $derived(this.chrome.showSource)
    this.showLoading = $derived(
      !this.chrome.showSource
      && !this.renderer.svgMarkup
      && !this.renderer.renderError,
    )
    this.showSourceFallback = $derived(
      this.chrome.showSource
      || (!this.renderer.svgMarkup && Boolean(this.renderer.renderError)),
    )
    this.svgMarkup = $derived(this.renderer.svgMarkup)
    this.transformStyle = $derived(
      `transform: scale(${this.chrome.zoom}); transform-origin: center center;`,
    )
    this.zoom = $derived(this.chrome.zoom)

    this.closeModal = this.chrome.closeModal
    this.copy = this.chrome.copy
    this.resetZoom = this.chrome.resetZoom
    this.showButtonTooltip = this.chrome.showButtonTooltip
    this.showCopyTooltip = this.chrome.showCopyTooltip
    this.zoomIn = this.chrome.zoomIn
    this.zoomOut = this.chrome.zoomOut
  }

  #syncVisibility = async (visible: boolean): Promise<void> => {
    if (!visible) {
      this.renderer.suspend()
      return
    }
    await tick()
    this.renderer.requestRender(true)
  }

  exportSvg = (): void => {
    if (this.svgMarkup)
      downloadSvgMarkup(this.svgMarkup, `d2-diagram-${Date.now()}.svg`)
  }

  openModal = (): void => {
    this.chrome.openModal(Boolean(this.svgMarkup))
  }

  switchMode = (mode: RichBlockMode): Promise<void> => {
    return this.chrome.switchMode(mode, this.#syncVisibility)
  }

  toggleCollapsed = (): Promise<void> => {
    return this.chrome.toggleCollapsed(this.#syncVisibility)
  }
}
