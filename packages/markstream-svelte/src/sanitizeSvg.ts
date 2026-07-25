const DISALLOWED_STYLE_PATTERNS = [/javascript:/i, /expression\s*\(/i, /url\s*\(\s*javascript:/i, /@import/i]
const SAFE_URL_PROTOCOLS = /^(?:https?:|mailto:|tel:|#|\/|data:image\/(?:png|gif|jpe?g|webp);)/i

function neutralizeScriptProtocols(raw: string) {
  return raw
    .replace(/(["'])\s*javascript:/gi, '$1#')
    .replace(/\bjavascript:/gi, '#')
    .replace(/(["'])\s*vbscript:/gi, '$1#')
    .replace(/\bvbscript:/gi, '#')
    .replace(/\bdata:text\/html/gi, '#')
}

function sanitizeUrl(value: string | null | undefined) {
  if (!value)
    return ''
  const trimmed = value.trim()
  if (SAFE_URL_PROTOCOLS.test(trimmed))
    return trimmed
  return ''
}

function scrubSvgElement(svgEl: SVGElement) {
  const forbiddenTags = new Set(['script'])
  const nodes = [svgEl, ...Array.from(svgEl.querySelectorAll<SVGElement>('*'))]
  for (const node of nodes) {
    if (forbiddenTags.has(node.tagName.toLowerCase())) {
      node.remove()
      continue
    }

    const attrs = Array.from(node.attributes)
    for (const attr of attrs) {
      const name = attr.name
      if (/^on/i.test(name)) {
        node.removeAttribute(name)
        continue
      }

      if (name === 'style' && attr.value) {
        if (DISALLOWED_STYLE_PATTERNS.some(re => re.test(attr.value))) {
          node.removeAttribute(name)
          continue
        }
      }

      if ((name === 'href' || name === 'xlink:href') && attr.value) {
        const safe = sanitizeUrl(attr.value)
        if (!safe) {
          node.removeAttribute(name)
          continue
        }
        if (safe !== attr.value)
          node.setAttribute(name, safe)
      }
    }
  }
}

export function toSafeSvgMarkup(svg: string | null | undefined) {
  if (typeof DOMParser === 'undefined')
    return ''
  if (!svg)
    return ''

  const neutralized = neutralizeScriptProtocols(svg)
  const parsed = new DOMParser().parseFromString(neutralized, 'image/svg+xml')
  const svgEl = parsed.documentElement
  if (!isSvgElement(svgEl))
    return ''

  scrubSvgElement(svgEl)
  return svgEl.outerHTML
}

function isSvgElement(element: Element): element is SVGElement {
  return element.localName.toLowerCase() === 'svg'
    && element.namespaceURI === 'http://www.w3.org/2000/svg'
}
