import type {
  DiffAppearance,
  DiffHideUnchangedRegions,
  DiffHunkActionContext,
  DiffHunkActionKind,
  DiffHunkSide,
  DiffLineStyle,
  DiffUnchangedRegionStyle,
  MonacoLanguage,
  MonacoOptions,
  MonacoTheme,
} from 'stream-monaco'

export type CodeBlockDiffAppearance = DiffAppearance
export type CodeBlockDiffHideUnchangedRegions = DiffHideUnchangedRegions
export type CodeBlockDiffHideUnchangedRegionsOptions
  = Exclude<DiffHideUnchangedRegions, boolean>
export type CodeBlockDiffHunkActionContext = DiffHunkActionContext
export type CodeBlockDiffHunkActionKind = DiffHunkActionKind
export type CodeBlockDiffHunkSide = DiffHunkSide
export type CodeBlockDiffLineStyle = DiffLineStyle
export type CodeBlockDiffUnchangedRegionStyle = DiffUnchangedRegionStyle
export type CodeBlockMonacoLanguage = MonacoLanguage
export type CodeBlockMonacoOptions = MonacoOptions
export type CodeBlockMonacoTheme = MonacoTheme
export type CodeBlockMonacoThemeObject = Exclude<MonacoTheme, string>
