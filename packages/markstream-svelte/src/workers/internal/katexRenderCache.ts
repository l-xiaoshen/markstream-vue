export interface KaTeXRenderCache {
  get: (content: string, displayMode: boolean) => string | undefined
  set: (content: string, displayMode: boolean, html: string) => void
}

export function createKaTeXRenderCache(maxEntries: number): KaTeXRenderCache {
  const entries = new Map<string, string>()
  const keyFor = (content: string, displayMode: boolean) => (
    `${displayMode ? 'd' : 'i'}:${content}`
  )

  return {
    get: (content, displayMode) => entries.get(keyFor(content, displayMode)),
    set: (content, displayMode, html) => {
      entries.set(keyFor(content, displayMode), html)
      if (entries.size <= maxEntries)
        return

      const oldestKey = entries.keys().next().value
      if (oldestKey !== undefined)
        entries.delete(oldestKey)
    },
  }
}
