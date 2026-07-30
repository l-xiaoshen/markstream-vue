import type { CodeBlockMonacoOptions } from '../types/monaco'
import type {
  NodeRendererCodeBlockProps,
  NodeRendererD2Props,
  NodeRendererInfographicProps,
  NodeRendererMermaidProps,
} from '../types/renderer'

export interface EnhanceRenderedHtmlOptions {
  final?: boolean | undefined
  isDark?: boolean | undefined
  renderCodeBlocksAsPre?: boolean | undefined
  monacoOptions?: CodeBlockMonacoOptions | undefined
  d2ThemeId?: number | null | undefined
  d2DarkThemeId?: number | null | undefined
  showTooltips?: boolean | undefined
  codeBlockProps?: NodeRendererCodeBlockProps | undefined
  mermaidProps?: NodeRendererMermaidProps | undefined
  d2Props?: NodeRendererD2Props | undefined
  infographicProps?: NodeRendererInfographicProps | undefined
  onCopy?: ((code: string) => void) | undefined
  isCancelled?: (() => boolean) | undefined
}

export interface Disposable {
  dispose: () => void
}

export interface RenderedHtmlEnhancementHandle extends Disposable {}

export type DisposeRenderedHtmlEnhancement = () => void

export interface EnhancementLifecycle extends RenderedHtmlEnhancementHandle {
  isActive: () => boolean
  register: (disposable: Disposable | DisposeRenderedHtmlEnhancement) => void
}
