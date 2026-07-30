export function clearElement(target: HTMLElement | null | undefined) {
  if (!target)
    return

  try {
    target.replaceChildren()
  }
  catch {
    target.innerHTML = ''
  }
}

export function downloadSvgMarkup(svgMarkup: string, filename: string) {
  if (!svgMarkup || typeof document === 'undefined' || typeof URL === 'undefined')
    return

  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function resolveCssSize(
  value: string | number | null | undefined,
  fallback?: string,
) {
  if (value == null || value === '')
    return fallback ?? null
  return typeof value === 'number' ? `${value}px` : String(value)
}
