export async function copyTextToClipboard(source: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source)
      return true
    }
  }
  catch {
    // Fall through to the textarea fallback below.
  }

  if (typeof document === 'undefined')
    return false

  const textarea = document.createElement('textarea')
  textarea.value = source
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  }
  catch {
    return false
  }
  finally {
    textarea.remove()
  }
}
