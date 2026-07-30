function humanizeKey(key: string): string {
  const suffix = key.split('.').pop() || key
  return suffix
    .replace(/[_-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim()
}

export type I18nMessages = Readonly<{ [key: string]: string }>

export interface SafeI18nService {
  setMessages: (messages: I18nMessages) => void
  t: (key: string) => string
}

const builtinMessages: I18nMessages = {
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.decrease': 'Decrease',
  'common.reset': 'Reset',
  'common.increase': 'Increase',
  'common.expand': 'Expand',
  'common.collapse': 'Collapse',
  'common.preview': 'Preview',
  'common.source': 'Source',
  'common.export': 'Export',
  'common.open': 'Open',
  'common.close': 'Close',
  'common.zoomIn': 'Zoom in',
  'common.zoomOut': 'Zoom out',
  'common.resetZoom': 'Reset zoom',
  'artifacts.htmlPreviewTitle': 'HTML Preview',
  'artifacts.svgPreviewTitle': 'SVG Preview',
  'image.preview': 'Preview image',
  'image.loadError': 'Image failed to load',
  'image.loading': 'Loading image...',
}

export function createSafeI18nService(
  initialMessages: I18nMessages = builtinMessages,
): SafeI18nService {
  const messages = new Map(Object.entries(initialMessages))

  return {
    setMessages: (nextMessages) => {
      for (const [key, value] of Object.entries(nextMessages))
        messages.set(key, value)
    },
    t: key => messages.get(key) ?? humanizeKey(key),
  }
}

const defaultI18nService = createSafeI18nService()

export function setDefaultI18nMap(map: I18nMessages): void {
  defaultI18nService.setMessages(map)
}

export function getSafeI18n(): Pick<SafeI18nService, 't'> {
  return defaultI18nService
}
