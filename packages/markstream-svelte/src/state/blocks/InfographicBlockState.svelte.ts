import type { CodeBlockNode } from 'stream-markdown-parser'
import type { Attachment } from 'svelte/attachments'
import type {
  NodeRendererInfographicProps,
  SvelteRenderContext,
} from '../../types/renderer'
import type { RichBlockMode } from './RichBlockState.svelte'
import { tick } from 'svelte'
import {
  clampPreviewHeight,
  estimateInfographicPreviewHeight,
  parsePositiveNumber,
} from '../../utils/diagramLayout'
import { downloadSvgMarkup } from '../../utils/richBlockDom'
import { InfographicRenderer } from './InfographicRenderer.svelte'
import { RichBlockState } from './RichBlockState.svelte'

interface InfographicBlockInput {
  context?: SvelteRenderContext | undefined
  node: CodeBlockNode
}

export class InfographicBlockState {
  #input: InfographicBlockInput
  #final: boolean
  #maxHeight: string | null
  #options: NodeRendererInfographicProps
  #progressivePreview: boolean

  collapsed: boolean
  copied: boolean
  hasPreview: boolean
  modalMarkup: string
  modalOpen: boolean
  previewStyle: string
  renderError: string
  rendering: boolean
  resolvedIsDark: boolean
  resolvedLoading: boolean
  shouldRender: boolean
  showSource: boolean
  source: string
  transformStyle: string
  zoom: number

  readonly chrome: RichBlockState
  readonly renderer: InfographicRenderer
  readonly renderAttachment: Attachment<HTMLDivElement>
  readonly closeModal: RichBlockState['closeModal']
  readonly copy: RichBlockState['copy']
  readonly resetZoom: RichBlockState['resetZoom']
  readonly showButtonTooltip: RichBlockState['showButtonTooltip']
  readonly showCopyTooltip: RichBlockState['showCopyTooltip']
  readonly zoomIn: RichBlockState['zoomIn']
  readonly zoomOut: RichBlockState['zoomOut']

  constructor(private readonly getInput: () => InfographicBlockInput) {
    this.#input = $derived(this.getInput())
    this.#options = $derived(this.#input.context?.infographicProps ?? {})
    this.#maxHeight = $derived(
      this.#options.maxHeight === undefined ? '500px' : this.#options.maxHeight,
    )
    this.source = $derived(this.#input.node.code)
    const nodeLoading = $derived(this.#input.node.loading ?? true)
    this.resolvedLoading = $derived(nodeLoading)
    this.#final = $derived(
      this.#input.context?.final ?? this.resolvedLoading === false,
    )
    this.#progressivePreview = $derived(
      this.resolvedLoading !== false || this.#final === false,
    )
    this.resolvedIsDark = $derived(this.#input.context?.isDark ?? false)
    const maxPreviewHeight = $derived(
      this.#maxHeight === 'none'
        ? null
        : parsePositiveNumber(this.#maxHeight),
    )
    const previewHeight = $derived(clampPreviewHeight(
      parsePositiveNumber(this.#options.estimatedPreviewHeightPx)
      ?? estimateInfographicPreviewHeight(this.source),
      320,
      maxPreviewHeight ?? undefined,
    ))
    this.previewStyle = $derived([
      `min-height: ${previewHeight}px`,
      this.#maxHeight && this.#maxHeight !== 'none'
        ? `max-height: ${this.#maxHeight}`
        : '',
    ].filter(Boolean).join('; '))
    this.shouldRender = $derived(
      !(this.resolvedLoading && !this.source.trim()),
    )

    this.chrome = new RichBlockState({
      getIsDark: () => this.resolvedIsDark,
      getSource: () => this.source,
      onCopy: value => this.#input.context?.events?.onCopy?.(value),
    })
    this.renderer = new InfographicRenderer({
      getActive: () => !this.chrome.collapsed && !this.chrome.showSource,
      getDebounceMs: () => this.#progressivePreview
        ? (this.#options.renderDebounceMs ?? 120)
        : 0,
      getFinal: () => this.#final,
      getIsDark: () => this.resolvedIsDark,
      getProgressive: () => this.#progressivePreview,
      getSource: () => this.source,
    })

    this.collapsed = $derived(this.chrome.collapsed)
    this.copied = $derived(this.chrome.copied)
    this.hasPreview = $derived(this.renderer.hasPreview)
    this.modalMarkup = $derived(this.renderer.markup)
    this.modalOpen = $derived(this.chrome.modalOpen)
    this.renderError = $derived(this.renderer.renderError)
    this.rendering = $derived(this.renderer.rendering)
    this.showSource = $derived(this.chrome.showSource)
    this.transformStyle = $derived(
      `transform: scale(${this.chrome.zoom}); transform-origin: center center;`,
    )
    this.zoom = $derived(this.chrome.zoom)

    this.renderAttachment = this.renderer.attachment
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
    const svg = this.renderer.getRenderedSvg()
    if (svg)
      downloadSvgMarkup(svg, `infographic-${Date.now()}.svg`)
  }

  openModal = (): void => {
    this.chrome.openModal(Boolean(this.modalMarkup))
  }

  switchMode = (mode: RichBlockMode): Promise<void> => {
    return this.chrome.switchMode(mode, this.#syncVisibility)
  }

  toggleCollapsed = (): Promise<void> => {
    return this.chrome.toggleCollapsed(this.#syncVisibility)
  }
}
