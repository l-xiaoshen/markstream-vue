import type {
  CodeBlockMonacoOptions,
  CodeBlockMonacoTheme,
  SmoothMarkdownStreamOptions,
} from 'markstream-svelte'

export const PLAYGROUND_CUSTOM_ID = 'playground-demo'
export const PLAYGROUND_CUSTOM_HTML_TAGS = ['thinking']

export const THEMES = [
  'andromeeda',
  'aurora-x',
  'ayu-dark',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dark-plus',
  'dracula',
  'github-dark',
  'github-light',
  'gruvbox-dark-medium',
  'gruvbox-light-medium',
  'material-theme',
  'min-dark',
  'min-light',
  'monokai',
  'night-owl',
  'one-dark-pro',
  'one-light',
  'rose-pine',
  'rose-pine-dawn',
  'tokyo-night',
  'vitesse-dark',
  'vitesse-light',
] as const satisfies readonly CodeBlockMonacoTheme[]

export type PlaygroundTheme = (typeof THEMES)[number]

const diffHideUnchangedRegions = {
  enabled: true,
  contextLineCount: 2,
  minimumLineCount: 4,
  revealLineCount: 5,
}

export const PLAYGROUND_MONACO_OPTIONS: CodeBlockMonacoOptions = {
  renderSideBySide: false,
  useInlineViewWhenSpaceIsLimited: true,
  maxComputationTime: 0,
  ignoreTrimWhitespace: false,
  renderIndicators: true,
  diffAlgorithm: 'legacy',
  diffHideUnchangedRegions,
  hideUnchangedRegions: diffHideUnchangedRegions,
}

export const PLAYGROUND_SMOOTH_STREAMING_OPTIONS: SmoothMarkdownStreamOptions = {
  catchUpLatencyMs: 120,
  catchUpThreshold: 240,
  maxCharsPerCommit: 240,
  maxCharsPerSecond: 12000,
  maxCommitFps: 60,
  minCharsPerSecond: 4000,
  startDelayMs: 0,
  targetLatencyMs: 240,
}
