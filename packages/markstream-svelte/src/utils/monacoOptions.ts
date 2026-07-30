import type { MonacoOptions, MonacoTheme } from 'stream-monaco'
import type {
  CodeBlockDiffHideUnchangedRegions,
  CodeBlockDiffHideUnchangedRegionsOptions,
  CodeBlockMonacoOptions,
  CodeBlockMonacoTheme,
} from '../types/monaco'

const DEFAULT_DIFF_HIDE_UNCHANGED_REGIONS = {
  enabled: true,
  contextLineCount: 2,
  minimumLineCount: 4,
  revealLineCount: 5,
} as const satisfies CodeBlockDiffHideUnchangedRegionsOptions

const DISABLED_DIFF_HIDE_UNCHANGED_REGIONS = {
  enabled: false,
  contextLineCount: 0,
  minimumLineCount: Number.POSITIVE_INFINITY,
  revealLineCount: 0,
} as const satisfies CodeBlockDiffHideUnchangedRegionsOptions

export interface ResolveMonacoOptionsInput {
  options: CodeBlockMonacoOptions
  themes: readonly CodeBlockMonacoTheme[]
  fontSize: number
  expanded: boolean
  diff: boolean
  streaming: boolean
}

function normalizeHideUnchangedRegions(
  value: CodeBlockDiffHideUnchangedRegionsOptions | undefined,
): CodeBlockDiffHideUnchangedRegionsOptions | undefined
function normalizeHideUnchangedRegions(
  value: CodeBlockDiffHideUnchangedRegions | undefined,
): CodeBlockDiffHideUnchangedRegions | undefined
function normalizeHideUnchangedRegions(
  value: CodeBlockDiffHideUnchangedRegions | undefined,
): CodeBlockDiffHideUnchangedRegions | undefined {
  if (value === undefined || typeof value === 'boolean')
    return value
  return {
    ...DEFAULT_DIFF_HIDE_UNCHANGED_REGIONS,
    ...value,
    enabled: value.enabled ?? true,
  }
}

export function resolveMonacoOptions({
  options,
  themes,
  fontSize,
  expanded,
  diff,
  streaming,
}: ResolveMonacoOptionsInput): MonacoOptions {
  const maxHeight = expanded ? 900 : (options.MAX_HEIGHT ?? 500)
  const common: MonacoOptions = {
    ...options,
    MAX_HEIGHT: maxHeight,
    readOnly: options.readOnly ?? true,
    minimap: options.minimap ?? { enabled: false },
    lineNumbers: options.lineNumbers ?? 'on',
    wordWrap: options.wordWrap ?? 'on',
    wrappingIndent: options.wrappingIndent ?? 'same',
    revealDebounceMs: options.revealDebounceMs ?? 75,
    fontSize,
    themes: [...themes] satisfies MonacoTheme[],
  }

  if (!diff)
    return common

  const configuredDiffRegions = normalizeHideUnchangedRegions(
    options.diffHideUnchangedRegions,
  ) ?? DEFAULT_DIFF_HIDE_UNCHANGED_REGIONS
  const configuredRegions = normalizeHideUnchangedRegions(
    options.hideUnchangedRegions,
  )
  const activeDiffRegions = streaming
    ? DISABLED_DIFF_HIDE_UNCHANGED_REGIONS
    : configuredDiffRegions
  const activeRegions = streaming
    ? DISABLED_DIFF_HIDE_UNCHANGED_REGIONS
    : configuredRegions

  return {
    maxComputationTime: 0,
    diffAlgorithm: 'legacy',
    ignoreTrimWhitespace: false,
    renderIndicators: true,
    diffUpdateThrottleMs: 120,
    renderLineHighlight: 'none',
    renderLineHighlightOnlyWhenFocus: true,
    selectionHighlight: false,
    occurrencesHighlight: 'off',
    matchBrackets: 'never',
    lineDecorationsWidth: 4,
    lineNumbersMinChars: 2,
    glyphMargin: false,
    renderOverviewRuler: false,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    scrollBeyondLastLine: false,
    useInlineViewWhenSpaceIsLimited: false,
    diffLineStyle: 'background',
    diffAppearance: 'auto',
    diffUnchangedRegionStyle: 'line-info',
    diffHunkActionsOnHover: false,
    ...common,
    ...(activeRegions === undefined
      ? {}
      : { hideUnchangedRegions: activeRegions }),
    diffHideUnchangedRegions: activeDiffRegions,
  }
}

export function getMonacoThemeName(
  theme: CodeBlockMonacoTheme | undefined,
  fallback: string,
): string {
  if (typeof theme === 'string')
    return theme || fallback
  return resolveThemeObjectName(theme) ?? fallback
}

function resolveThemeObjectName(theme: unknown): string | undefined {
  if (typeof theme !== 'object' || theme === null)
    return undefined
  if ('name' in theme && typeof theme.name === 'string')
    return theme.name
  if ('default' in theme)
    return resolveThemeObjectName(theme.default)
  return undefined
}

function isThemeArray(
  value: CodeBlockMonacoTheme | readonly CodeBlockMonacoTheme[],
): value is readonly CodeBlockMonacoTheme[] {
  return Array.isArray(value)
}

export function createMonacoThemeList(
  ...groups: ReadonlyArray<
    CodeBlockMonacoTheme | readonly CodeBlockMonacoTheme[] | undefined
  >
): CodeBlockMonacoTheme[] {
  const themes: CodeBlockMonacoTheme[] = ['vitesse-dark', 'vitesse-light']
  for (const group of groups) {
    if (!group)
      continue
    if (isThemeArray(group))
      themes.push(...group)
    else
      themes.push(group)
  }
  return themes
}
