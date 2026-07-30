import type { CodeBlockNode } from 'stream-markdown-parser'
import type { MonacoOptions } from 'stream-monaco'
import type { Component } from 'svelte'
import type { CodeBlockMonacoOptions } from '../../types/monaco'
import type {
  NodeRendererCodeBlockProps,
  SvelteRenderContext,
} from '../../types/renderer'
import { onMount } from 'svelte'
import {
  createMonacoThemeList,
  getMonacoThemeName,
  resolveMonacoOptions,
} from '../../utils/monacoOptions'
import {
  resolveCodeBlockLanguage,
  resolveCodeBlockSource,
  shouldDeferCodeBlockLanguage,
} from '../../utils/rendering/codeBlock'
import { resolveCssSize } from '../../utils/richBlockDom'
import { MonacoEditor } from './MonacoEditor.svelte'
import { RichBlockState } from './RichBlockState.svelte'

interface CodeBlockInput {
  context?: SvelteRenderContext | undefined
  htmlPreviewTitle: string
  node: CodeBlockNode
  svgPreviewTitle: string
}

export class CodeBlockState {
  #input: CodeBlockInput
  #language: ReturnType<typeof resolveCodeBlockLanguage>
  #options: NodeRendererCodeBlockProps
  #source: ReturnType<typeof resolveCodeBlockSource>
  #resolvedStream: boolean
  #mergedMonacoOptions: CodeBlockMonacoOptions
  #resolvedMonacoOptions: MonacoOptions
  #requestedTheme: string
  #editorRefreshDelayMs: number
  #shouldDeferStreamingLanguage: boolean

  mounted = $state(false)
  expanded = $state(false)
  previewOpen = $state(false)
  codeFontSize = $state(13)

  code: string
  collapsed: boolean
  containerStyle: string
  copied: boolean
  defaultCodeFontSize: number
  diff: boolean
  displayLanguage: string
  editorReady: boolean
  isPreviewable: boolean
  languageIcon: Component
  monacoLanguage: string
  preLanguageClass: string
  previewTitle: string
  resolvedIsDark: boolean
  resolvedLoading: boolean
  shouldDelayEditor: boolean
  shouldRender: boolean
  showPreFallback: boolean

  readonly chrome: RichBlockState
  readonly editor: MonacoEditor

  constructor(private readonly getInput: () => CodeBlockInput) {
    this.#input = $derived(this.getInput())
    this.#options = $derived(this.#input.context?.codeBlockProps ?? {})
    this.#language = $derived(resolveCodeBlockLanguage(this.#input.node.language))
    this.#source = $derived(resolveCodeBlockSource(this.#input.node))
    this.resolvedLoading = $derived(this.#input.node.loading === true)
    this.#resolvedStream = $derived(this.#options.stream ?? true)
    this.resolvedIsDark = $derived(this.#input.context?.isDark ?? false)
    this.#mergedMonacoOptions = $derived(this.#options.monacoOptions ?? {})
    const themeList = $derived(createMonacoThemeList(
      this.#options.darkTheme,
      this.#options.lightTheme,
      this.#options.themes,
    ))
    this.#requestedTheme = $derived(getMonacoThemeName(
      this.resolvedIsDark
        ? this.#options.darkTheme
        : this.#options.lightTheme,
      this.resolvedIsDark ? 'vitesse-dark' : 'vitesse-light',
    ))
    this.defaultCodeFontSize = $derived(this.#mergedMonacoOptions.fontSize ?? 13)
    this.#resolvedMonacoOptions = $derived(resolveMonacoOptions({
      options: this.#mergedMonacoOptions,
      themes: themeList,
      fontSize: this.codeFontSize,
      expanded: this.expanded,
      diff: this.#source.diff,
      streaming: this.#resolvedStream !== false && this.resolvedLoading !== false,
    }))
    this.#editorRefreshDelayMs = $derived(
      this.#resolvedStream !== false && this.resolvedLoading
        ? (this.#mergedMonacoOptions.revealDebounceMs ?? 75)
        : 0,
    )
    const minWidth = $derived(resolveCssSize(
      this.#options.minWidth,
    ))
    const maxWidth = $derived(resolveCssSize(
      this.#options.maxWidth,
    ))
    this.containerStyle = $derived([
      minWidth ? `min-width: ${minWidth}` : '',
      maxWidth ? `max-width: ${maxWidth}` : '',
    ].filter(Boolean).join('; '))
    this.isPreviewable = $derived(
      this.#options.isShowPreview !== false
      && (this.#language.canonical === 'html' || this.#language.canonical === 'svg'),
    )
    this.previewTitle = $derived(
      this.#language.canonical === 'svg'
        ? this.#input.svgPreviewTitle
        : this.#input.htmlPreviewTitle,
    )
    this.shouldDelayEditor = $derived(
      this.#resolvedStream === false && this.resolvedLoading,
    )
    const documentStreaming = $derived(
      this.#input.context?.final === false || this.resolvedLoading,
    )
    this.#shouldDeferStreamingLanguage = $derived(shouldDeferCodeBlockLanguage(
      this.#language.raw,
      this.#resolvedStream !== false,
      documentStreaming,
    ))
    this.shouldRender = $derived(
      !(this.resolvedLoading && !this.#source.code.trim()),
    )

    this.chrome = new RichBlockState({
      getIsDark: () => this.resolvedIsDark,
      getSource: () => this.#source.code,
      onCopy: value => this.#input.context?.events?.onCopy?.(value),
    })
    this.editor = new MonacoEditor({
      getCode: () => this.#source.code,
      getOriginalCode: () => this.#source.originalCode,
      getUpdatedCode: () => this.#source.updatedCode,
      getLanguage: () => this.#language.monaco,
      getTheme: () => this.#requestedTheme,
      getOptions: () => this.#resolvedMonacoOptions,
      getEditorKind: () => this.#source.diff ? 'diff' : 'single',
      getRefreshDelayMs: () => this.#editorRefreshDelayMs,
      shouldRender: () => (
        this.mounted
        && this.shouldRender
        && !this.chrome.collapsed
        && !this.shouldDelayEditor
        && !this.#shouldDeferStreamingLanguage
      ),
    })
    this.code = $derived(this.#source.code)
    this.collapsed = $derived(this.chrome.collapsed)
    this.copied = $derived(this.chrome.copied)
    this.diff = $derived(this.#source.diff)
    this.displayLanguage = $derived(this.#language.display)
    this.editorReady = $derived(this.editor.state.kind === 'ready')
    this.languageIcon = $derived(this.#language.icon)
    this.monacoLanguage = $derived(this.#language.monaco)
    this.preLanguageClass = $derived(this.#language.preClass)
    this.showPreFallback = $derived(
      this.shouldDelayEditor
      || this.#shouldDeferStreamingLanguage
      || this.editor.state.kind !== 'ready',
    )
    this.codeFontSize = this.defaultCodeFontSize

    onMount(() => {
      this.mounted = true
      return () => {
        this.mounted = false
      }
    })
  }

  editorAttachment(element: HTMLDivElement) {
    return this.editor.attachment(element)
  }

  copy(): Promise<void> {
    return this.chrome.copy()
  }

  showButtonTooltip(
    ...args: Parameters<RichBlockState['showButtonTooltip']>
  ): void {
    this.chrome.showButtonTooltip(...args)
  }

  showCopyTooltip(
    ...args: Parameters<RichBlockState['showCopyTooltip']>
  ): void {
    this.chrome.showCopyTooltip(...args)
  }

  changeFontSize(next: number): void {
    if (this.#options.enableFontSizeControl === false)
      return
    this.codeFontSize = Math.min(24, Math.max(10, next))
    this.editor.layout()
  }

  closePreview(): void {
    this.previewOpen = false
  }

  toggleCollapsed(): Promise<void> {
    return this.chrome.toggleCollapsed()
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded
  }

  togglePreview(): void {
    this.previewOpen = !this.previewOpen
  }
}
