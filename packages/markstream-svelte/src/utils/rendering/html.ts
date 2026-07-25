import type { CustomComponentAttrs, HtmlPolicy } from 'stream-markdown-parser'
import { sanitizeHtmlAttrs } from 'stream-markdown-parser'

export type HtmlClassValue = string | readonly string[] | null | undefined

type HtmlAttributeValue = string | boolean
type HtmlAttributePair = readonly [name: string, value: HtmlAttributeValue]

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

export function sanitizeClassToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function serializeClassValue(value: HtmlClassValue): string {
  if (Array.isArray(value))
    return value.map(item => item.trim()).filter(Boolean).join(' ')
  return typeof value === 'string' ? value.trim() : ''
}

export function serializeCustomHtmlAttrs(
  attrs?: CustomComponentAttrs,
  extraClass = '',
  policy: HtmlPolicy = 'safe',
  tagName?: string,
): string {
  const record: Record<string, string> = {}
  const mergedClasses = [extraClass]

  for (const [name, value] of normalizeCustomAttrs(attrs)) {
    const safeName = name.trim()
    if (!safeName)
      continue
    if (safeName.toLowerCase() === 'class') {
      mergedClasses.push(String(value))
      continue
    }
    record[safeName] = value === true ? '' : String(value)
  }

  const rendered = Object.entries(sanitizeHtmlAttrs(record, policy, tagName))
    .map(([name, value]) => value === '' ? ` ${name}` : ` ${name}="${escapeAttr(String(value))}"`)

  const className = mergedClasses.map(value => value.trim()).filter(Boolean).join(' ')
  if (className)
    rendered.unshift(` class="${escapeAttr(className)}"`)
  return rendered.join('')
}

export function serializeSanitizedHtmlAttrs(attrs: Readonly<Record<string, string>>): string {
  return Object.entries(attrs)
    .map(([name, value]) => value === '' ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`)
    .join('')
}

export function clampHeadingLevel(level: number): number {
  return Math.min(6, Math.max(1, Math.trunc(level) || 1))
}

export function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : ''
}

function normalizeCustomAttrs(attrs?: CustomComponentAttrs): HtmlAttributePair[] {
  if (!attrs)
    return []

  if (Array.isArray(attrs)) {
    const pairs: HtmlAttributePair[] = []
    for (const item of attrs) {
      if (Array.isArray(item)) {
        const [name, value] = item
        pairs.push([String(name), value])
      }
      else {
        pairs.push([String(item.name), item.value])
      }
    }
    return pairs
  }

  return Object.entries(attrs)
}
