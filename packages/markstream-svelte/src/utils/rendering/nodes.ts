import type { BaseNode, CustomComponentAttrs } from 'stream-markdown-parser'

type NonNullCustomComponentAttrs = Exclude<CustomComponentAttrs, null>

export function copyNodes<TNode extends BaseNode>(
  nodes: readonly TNode[] | null | undefined,
): TNode[] {
  return nodes ? nodes.slice() : []
}

export function getNodeContent(node: BaseNode): string | undefined {
  return 'content' in node && typeof node.content === 'string'
    ? node.content
    : undefined
}

export function getNodeTag(node: BaseNode): string | undefined {
  return 'tag' in node && typeof node.tag === 'string'
    ? node.tag
    : undefined
}

export function getNodeAttrs(node: BaseNode): CustomComponentAttrs | undefined {
  if (!('attrs' in node) || !isCustomComponentAttrs(node.attrs))
    return undefined
  return node.attrs
}

export function isCustomComponentAttrs(value: unknown): value is NonNullCustomComponentAttrs {
  if (Array.isArray(value))
    return value.every(isAttributeTuple) || value.every(isNamedAttribute)

  if (typeof value !== 'object' || value === null)
    return false

  return Object.values(value).every(item => typeof item === 'string' || typeof item === 'boolean')
}

function isAttributeTuple(value: unknown): value is [string, string] {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === 'string'
    && typeof value[1] === 'string'
}

function isNamedAttribute(
  value: unknown,
): value is { name: string, value: string | boolean } {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && typeof value.name === 'string'
    && 'value' in value
    && (typeof value.value === 'string' || typeof value.value === 'boolean')
}
