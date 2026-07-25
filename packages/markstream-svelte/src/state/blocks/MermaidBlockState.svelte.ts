import type { CodeBlockNode } from 'stream-markdown-parser'
import type { Attachment } from 'svelte/attachments'
import type {
  NodeRendererMermaidProps,
  SvelteRenderContext,
} from '../../types/renderer'
import type { MermaidTheme } from '../../utils/mermaidPreview'
import type { RichBlockMode } from './RichBlockState.svelte'
import { tick, untrack } from 'svelte'
import {
  clampPreviewHeight,
  estimateMermaidPreviewHeight,
  parsePositiveNumber,
} from '../../utils/diagramLayout'
import {
  normalizeMermaidSource,
  normalizeRenderedMermaidCode,
} from '../../utils/mermaidPreview'
import { downloadSvgMarkup } from '../../utils/richBlockDom'
import { MermaidRenderer } from './MermaidRenderer.svelte'
import { RichBlockState } from './RichBlockState.svelte'

interface MermaidBlockInput {
  context?: SvelteRenderContext | undefined
  node: CodeBlockNode
}

export class MermaidBlockState {
  #input: MermaidBlockInput
  #final: boolean
  #maxHeight: string | null
  #modalHost = $state.raw<HTMLElement | null>(null)
  #options: NodeRendererMermaidProps
  #previewHost = $state.raw<HTMLElement | null>(null)
  #progressivePreview: boolean
  #theme: MermaidTheme

  canUsePreview: boolean
  collapsed: boolean
  copied: boolean
  modalOpen: boolean
  previewStyle: string
  renderError: string
  rendering: boolean
  resolvedIsDark: boolean
  resolvedLoading: boolean
  shouldRender: boolean
  showSource: boolean
  source: string
  svgMarkup: string
  zoom: number

  readonly chrome: RichBlockState
  readonly renderer: MermaidRenderer
  readonly closeModal: RichBlockState['closeModal']
  readonly copy: RichBlockState['copy']
  readonly resetZoom: RichBlockState['resetZoom']
  readonly showButtonTooltip: RichBlockState['showButtonTooltip']
  readonly showCopyTooltip: RichBlockState['showCopyTooltip']
  readonly zoomIn: RichBlockState['zoomIn']
  readonly zoomOut: RichBlockState['zoomOut']

  previewAttachment: Attachment<HTMLElement> = (element) => {
    this.#previewHost = element
    return () => {
      if (this.#previewHost === element)
        this.#previewHost = null
    }
  }

  constructor(private readonly getInput: () => MermaidBlockInput) {
    this.#input = $derived(this.getInput())
    this.#options = $derived(this.#input.context?.mermaidProps ?? {})
    this.#maxHeight = $derived(
      this.#options.maxHeight === undefined ? '500px' : this.#options.maxHeight,
    )
    this.source = $derived(normalizeMermaidSource(this.#input.node.code))
    const nodeLoading = $derived(this.#input.node.loading ?? true)
    this.resolvedLoading = $derived(nodeLoading)
    this.resolvedIsDark = $derived(this.#input.context?.isDark ?? false)
    this.#theme = $derived<MermaidTheme>(
      this.resolvedIsDark ? 'dark' : 'light',
    )
    this.#final = $derived(
      this.#input.context?.final ?? this.resolvedLoading === false,
    )
    this.#progressivePreview = $derived(
      this.resolvedLoading !== false || this.#final === false,
    )
    const maxPreviewHeight = $derived(
      this.#maxHeight === 'none'
        ? null
        : parsePositiveNumber(this.#maxHeight),
    )
    const previewHeight = $derived(clampPreviewHeight(
      parsePositiveNumber(this.#options.estimatedPreviewHeightPx)
      ?? estimateMermaidPreviewHeight(this.source),
      undefined,
      maxPreviewHeight ?? undefined,
    ))
    this.shouldRender = $derived(
      !(this.resolvedLoading && !this.source.trim()),
    )

    this.chrome = new RichBlockState({
      getIsDark: () => this.resolvedIsDark,
      getSource: () => this.source,
      onCopy: value => this.#input.context?.events?.onCopy?.(value),
    })
    this.renderer = new MermaidRenderer({
      getActive: () => !this.chrome.collapsed && !this.chrome.showSource,
      getDebounceMs: () => this.#options.renderDebounceMs ?? 300,
      getSnapshot: () => this.#createSnapshot(),
    })

    this.canUsePreview = $derived(
      Boolean(this.renderer.svgMarkup && !this.chrome.showSource),
    )
    this.collapsed = $derived(this.chrome.collapsed)
    this.copied = $derived(this.chrome.copied)
    this.modalOpen = $derived(this.chrome.modalOpen)
    this.previewStyle = $derived([
      `min-height: ${previewHeight}px`,
      this.#maxHeight && this.#maxHeight !== 'none'
        ? `max-height: ${this.#maxHeight}`
        : '',
      `transform: scale(${this.chrome.zoom})`,
    ].filter(Boolean).join('; '))
    this.renderError = $derived(this.renderer.renderError)
    this.rendering = $derived(this.renderer.rendering)
    this.showSource = $derived(this.chrome.showSource)
    this.svgMarkup = $derived(this.renderer.svgMarkup)
    this.zoom = $derived(this.chrome.zoom)

    this.closeModal = this.chrome.closeModal
    this.copy = this.chrome.copy
    this.resetZoom = this.chrome.resetZoom
    this.showButtonTooltip = this.chrome.showButtonTooltip
    this.showCopyTooltip = this.chrome.showCopyTooltip
    this.zoomIn = this.chrome.zoomIn
    this.zoomOut = this.chrome.zoomOut

    $effect(() => {
      const version = this.renderer.interactionVersion
      const preview = this.#previewHost
      const modal = this.chrome.modalOpen ? this.#modalHost : null
      const enabled = this.#options.enableMermaidInteractions === true
      if (!enabled || version <= 0)
        return

      let cancelled = false
      untrack(() => {
        void tick().then(() => {
          if (cancelled)
            return
          this.renderer.bindInteractions(preview)
          this.renderer.bindInteractions(modal)
        })
      })
      return () => {
        cancelled = true
      }
    })
  }

  #createSnapshot() {
    const normalizedSource = normalizeRenderedMermaidCode(this.source)
    const profileKey = [
      this.#theme,
      this.#options.isStrict ?? true,
      this.#options.enableMermaidInteractions === true,
    ].join('|')
    const signature = [
      this.source,
      profileKey,
      this.#final,
      this.#progressivePreview,
      this.#options.workerTimeoutMs ?? 1400,
      this.#options.parseTimeoutMs ?? 1800,
      this.#options.renderTimeoutMs ?? 2500,
      this.#options.fullRenderTimeoutMs ?? 4000,
    ].join('\n')
    return {
      fullRenderTimeoutMs: this.#options.fullRenderTimeoutMs ?? 4000,
      isStrict: this.#options.isStrict ?? true,
      normalizedSource,
      parseTimeoutMs: this.#options.parseTimeoutMs ?? 1800,
      profileKey,
      progressive: this.#progressivePreview,
      renderTimeoutMs: this.#options.renderTimeoutMs ?? 2500,
      signature,
      source: this.source,
      theme: this.#theme,
      workerTimeoutMs: this.#options.workerTimeoutMs ?? 1400,
    }
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
      downloadSvgMarkup(this.svgMarkup, `mermaid-diagram-${Date.now()}.svg`)
  }

  openModal = (): void => {
    this.chrome.openModal(Boolean(this.svgMarkup))
  }

  setModalHost = (element: HTMLElement | null): void => {
    this.#modalHost = element
  }

  switchMode = (mode: RichBlockMode): Promise<void> => {
    return this.chrome.switchMode(mode, this.#syncVisibility)
  }

  toggleCollapsed = (): Promise<void> => {
    return this.chrome.toggleCollapsed(this.#syncVisibility)
  }
}
