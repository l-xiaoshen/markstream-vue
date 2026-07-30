import type { BaseNode } from 'stream-markdown-parser'
import {
  normalizeCustomHtmlTags,
  normalizeCustomHtmlTagName as normalizeTagName,
} from 'stream-markdown-parser'
import { hasNodeChildren, isKnownMarkdownNode } from './types/nodes'
import { copyNodes, getNodeTag } from './utils/rendering/nodes'

interface CustomTagSegment {
  tag: string
  start: number
  end: number
  innerContent: string
  raw: string
  loading: boolean
}

interface CustomTagOpen {
  tag: string
  start: number
  openEnd: number
}

type SegmentQueues = Map<string, CustomTagSegment[]>

const TAG_TOKEN_RE = /<\/?([A-Z][\w:-]*)(?:\s[^<>]*)?>/gi

export function hydrateCustomTagContent<TNode extends BaseNode>(
  nodes: readonly TNode[] | null | undefined,
  source: string,
  customHtmlTags?: readonly string[],
): TNode[] {
  const sourceNodes = copyNodes(nodes)
  const tagSet = new Set(normalizeCustomHtmlTags(customHtmlTags))
  if (!source || tagSet.size === 0 || sourceNodes.length === 0)
    return sourceNodes

  const segments = collectCustomTagSegments(source, tagSet)
  if (segments.length === 0)
    return sourceNodes

  const segmentQueues = createSegmentQueues(segments)
  return sourceNodes.map(node => hydrateNodeTree(node, tagSet, segmentQueues))
}

function hydrateNodeTree<TNode extends BaseNode>(
  node: TNode,
  tagSet: ReadonlySet<string>,
  segmentQueues: SegmentQueues,
): TNode {
  const cloned: TNode = { ...node }
  const tag = resolveCustomTagName(cloned, tagSet)
  if (tag) {
    const segment = consumeNextSegment(segmentQueues, tag)
    if (segment) {
      Object.assign(cloned, {
        tag,
        type: tag,
        content: segment.innerContent,
        raw: segment.raw,
        ...(typeof cloned.loading === 'boolean' ? {} : { loading: segment.loading }),
      })
    }
  }

  cloneNestedNodeCollections(cloned, tagSet, segmentQueues)
  return cloned
}

function cloneNestedNodeCollections(
  node: BaseNode,
  tagSet: ReadonlySet<string>,
  segmentQueues: SegmentQueues,
): void {
  function cloneNodes<TNode extends BaseNode>(nodes: readonly TNode[]): TNode[] {
    return nodes.map(child => hydrateNodeTree(child, tagSet, segmentQueues))
  }

  if (!isKnownMarkdownNode(node)) {
    if (hasNodeChildren(node))
      Object.assign(node, { children: cloneNodes(node.children) })
    return
  }

  switch (node.type) {
    case 'heading':
    case 'paragraph':
    case 'inline':
    case 'list_item':
    case 'link':
    case 'blockquote':
    case 'table_cell':
    case 'strong':
    case 'emphasis':
    case 'strikethrough':
    case 'highlight':
    case 'insert':
    case 'subscript':
    case 'superscript':
    case 'footnote':
    case 'admonition':
    case 'vmr_container':
    case 'html_block':
    case 'html_inline':
      node.children = cloneNodes(node.children ?? [])
      return
    case 'list':
      node.items = cloneNodes(node.items)
      return
    case 'table':
      node.header = hydrateNodeTree(node.header, tagSet, segmentQueues)
      node.rows = cloneNodes(node.rows)
      return
    case 'table_row':
      node.cells = cloneNodes(node.cells)
      return
    case 'definition_list':
      node.items = cloneNodes(node.items)
      return
    case 'definition_item':
      node.term = cloneNodes(node.term)
      node.definition = cloneNodes(node.definition)
      return
    case 'text':
    case 'text_special':
    case 'code_block':
    case 'inline_code':
    case 'image':
    case 'thematic_break':
    case 'checkbox':
    case 'checkbox_input':
    case 'emoji':
    case 'footnote_reference':
    case 'footnote_anchor':
    case 'hardbreak':
    case 'math_inline':
    case 'math_block':
    case 'reference':
    case 'label_open':
    case 'label_close':
      return
    default:
      assertNever(node)
  }
}

function collectCustomTagSegments(
  source: string,
  tagSet: ReadonlySet<string>,
): CustomTagSegment[] {
  const stack: CustomTagOpen[] = []
  const segments: CustomTagSegment[] = []
  let match: RegExpExecArray | null

  TAG_TOKEN_RE.lastIndex = 0
  while ((match = TAG_TOKEN_RE.exec(source)) !== null) {
    const raw = match[0]
    const tag = normalizeTagName(match[1])
    if (!tag || !tagSet.has(tag))
      continue

    if (!raw.startsWith('</')) {
      stack.push({
        tag,
        start: match.index,
        openEnd: TAG_TOKEN_RE.lastIndex,
      })
      continue
    }

    const openIndex = findLastOpenIndex(stack, tag)
    if (openIndex < 0)
      continue

    const open = stack[openIndex]
    if (!open)
      continue
    stack.splice(openIndex, 1)
    const closeStart = match.index
    const closeEnd = TAG_TOKEN_RE.lastIndex
    segments.push({
      tag,
      start: open.start,
      end: closeEnd,
      innerContent: source.slice(open.openEnd, closeStart),
      raw: source.slice(open.start, closeEnd),
      loading: false,
    })
  }

  for (const open of stack) {
    segments.push({
      tag: open.tag,
      start: open.start,
      end: source.length,
      innerContent: source.slice(open.openEnd),
      raw: source.slice(open.start),
      loading: true,
    })
  }

  return segments.sort((left, right) => {
    if (left.start !== right.start)
      return left.start - right.start
    return right.end - left.end
  })
}

function findLastOpenIndex(stack: readonly CustomTagOpen[], tag: string): number {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index]?.tag === tag)
      return index
  }
  return -1
}

function createSegmentQueues(segments: readonly CustomTagSegment[]): SegmentQueues {
  const queues: SegmentQueues = new Map()
  for (const segment of segments) {
    const queue = queues.get(segment.tag)
    if (queue)
      queue.push(segment)
    else
      queues.set(segment.tag, [segment])
  }
  return queues
}

function consumeNextSegment(queues: SegmentQueues, tag: string): CustomTagSegment | null {
  return queues.get(tag)?.shift() ?? null
}

function resolveCustomTagName(node: BaseNode, tagSet: ReadonlySet<string>): string {
  const byTag = normalizeTagName(getNodeTag(node))
  if (byTag && tagSet.has(byTag))
    return byTag

  const byType = normalizeTagName(node.type)
  return byType && tagSet.has(byType) ? byType : ''
}

function assertNever(node: never): never {
  throw new Error(`Unhandled known Markdown node: ${JSON.stringify(node)}`)
}
