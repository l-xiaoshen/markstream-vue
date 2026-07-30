import type { MonacoOptions, UseMonacoReturn } from 'stream-monaco'

export type MonacoEditorKind = 'single' | 'diff'

interface Disposable {
  dispose: () => void
}

export function createMonacoEditorLayout(options: {
  getEditorKind: () => MonacoEditorKind | null
  getHelpers: () => UseMonacoReturn | null
  getHost: () => HTMLDivElement | null
  getOptions: () => MonacoOptions
  isReady: () => boolean
}) {
  let frame: number | undefined
  let disposables: Disposable[] = []
  let applyingLayout = false
  let lastKind: MonacoEditorKind | null = null
  let lastWidth = -1
  let lastHeight = -1

  function clearFrame(): void {
    if (frame === undefined || typeof window === 'undefined')
      return
    if (typeof window.cancelAnimationFrame === 'function')
      window.cancelAnimationFrame(frame)
    frame = undefined
  }

  function clearSubscriptions(): void {
    for (const disposable of disposables) {
      try {
        disposable.dispose()
      }
      catch {
        // Monaco may dispose subscriptions with its editor.
      }
    }
    disposables = []
  }

  function clear(): void {
    clearSubscriptions()
    clearFrame()
    lastKind = null
    lastWidth = -1
    lastHeight = -1
  }

  function bind(kind: MonacoEditorKind): void {
    clearSubscriptions()
    lastKind = null
    const helpers = options.getHelpers()
    if (!helpers)
      return

    if (kind === 'diff') {
      const diffEditor = helpers.getDiffEditorView()
      const original = diffEditor?.getOriginalEditor()
      const modified = diffEditor?.getModifiedEditor()
      if (diffEditor)
        disposables.push(diffEditor.onDidUpdateDiff(request))
      if (original) {
        disposables.push(original.onDidContentSizeChange(request))
        disposables.push(original.onDidLayoutChange(request))
      }
      if (modified) {
        disposables.push(modified.onDidContentSizeChange(request))
        disposables.push(modified.onDidLayoutChange(request))
      }
      return
    }

    const editor = helpers.getEditorView()
    if (editor) {
      disposables.push(editor.onDidContentSizeChange(request))
      disposables.push(editor.onDidLayoutChange(request))
    }
  }

  function layoutNow(): void {
    const helpers = options.getHelpers()
    const host = options.getHost()
    const kind = options.getEditorKind()
    if (!helpers || !host || !kind || !options.isReady())
      return

    const maxHeight = resolveMaxHeight(options.getOptions().MAX_HEIGHT)
    const contentHeight = kind === 'diff'
      ? Math.max(
          helpers.getDiffEditorView()?.getOriginalEditor().getContentHeight() ?? 0,
          helpers.getDiffEditorView()?.getModifiedEditor().getContentHeight() ?? 0,
        )
      : (helpers.getEditorView()?.getContentHeight() ?? 0)
    if (contentHeight <= 0)
      return

    const minHeight = resolveMinHeight(host)
    const preferredHeight = Math.max(contentHeight + 1, minHeight)
    const height = Math.ceil(
      Number.isFinite(maxHeight)
        ? Math.min(preferredHeight, maxHeight)
        : preferredHeight,
    )
    const width = Math.ceil(host.clientWidth)
    if (kind === lastKind && width === lastWidth && height === lastHeight)
      return

    lastKind = kind
    lastWidth = width
    lastHeight = height
    host.style.height = `${height}px`
    host.style.minHeight = `${height}px`
    host.style.maxHeight = Number.isFinite(maxHeight)
      ? `${Math.ceil(maxHeight)}px`
      : 'none'

    const dimension = width > 0 ? { width, height } : undefined
    applyingLayout = true
    try {
      if (kind === 'diff')
        helpers.getDiffEditorView()?.layout(dimension)
      else
        helpers.getEditorView()?.layout(dimension)
    }
    finally {
      applyingLayout = false
    }
  }

  function request(): void {
    if (typeof window === 'undefined' || frame !== undefined || applyingLayout)
      return
    if (typeof window.requestAnimationFrame !== 'function') {
      layoutNow()
      return
    }
    frame = window.requestAnimationFrame(() => {
      frame = undefined
      layoutNow()
    })
  }

  return { bind, clear, request }
}

function resolveMaxHeight(value: MonacoOptions['MAX_HEIGHT']): number {
  if (value === 'none' || value == null)
    return Number.POSITIVE_INFINITY
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500
}

function resolveMinHeight(host: HTMLDivElement): number {
  const value = window.getComputedStyle(host.parentElement ?? host).minHeight
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}
