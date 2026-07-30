import type {
  BaseNode,
  CustomComponentAttrs,
  FootnoteAnchorNode,
  InlineNode,
  ParsedNode,
} from 'stream-markdown-parser'

/**
 * Parser-internal text emitted while recovering an incomplete stream.
 */
export interface TextSpecialNode extends BaseNode {
  type: 'text_special'
  content: string
}

/**
 * Parser markers are intentionally not rendered.
 */
export interface LabelOpenNode extends BaseNode {
  type: 'label_open'
}

export interface LabelCloseNode extends BaseNode {
  type: 'label_close'
}

export type ParserMarkerNode = LabelOpenNode | LabelCloseNode

/**
 * Nodes produced by parsing markdown content. Unlike `RenderableMarkdownNode`,
 * this keeps the parser's catch-all nodes because their concrete shape cannot
 * be inferred from a runtime custom-tag configuration.
 */
export type ParsedMarkdownNode<TCustomNode extends BaseNode = never>
  = | ParsedNode
    | InlineNode
    | FootnoteAnchorNode
    | TextSpecialNode
    | ParserMarkerNode
    | TCustomNode

/**
 * Built-in nodes supported by the Svelte renderer.
 *
 * `ParsedNode` also contains catch-all nodes with `type: string`. Distributing
 * over the union and removing those broad members preserves literal
 * discriminants while inheriting all concrete parser node shapes upstream.
 */
type DiscriminatedParsedNode<TNode extends BaseNode>
  = TNode extends BaseNode
    ? string extends TNode['type']
      ? never
      : TNode
    : never

type ConcreteParsedNode = DiscriminatedParsedNode<ParsedNode>

/**
 * These nodes are emitted by parser paths but are currently absent from the
 * upstream `ParsedNode` union.
 */
export type KnownMarkdownNode
  = | ConcreteParsedNode
    | InlineNode
    | FootnoteAnchorNode
    | TextSpecialNode
    | ParserMarkerNode

export type KnownMarkdownNodeType = KnownMarkdownNode['type']

export type MarkdownNodeOfType<TType extends KnownMarkdownNodeType>
  = Extract<KnownMarkdownNode, { type: TType }>

export type KnownMarkdownNodeSchema = {
  [TType in KnownMarkdownNodeType]: MarkdownNodeOfType<TType>
}

/**
 * A caller-owned custom node. Consumers should supply literal tag and attribute
 * types instead of relying on an untyped property bag.
 */
export interface CustomMarkdownNode<
  TType extends string,
  TAttributes extends CustomComponentAttrs = CustomComponentAttrs,
  TChild extends BaseNode = BaseNode,
> extends BaseNode {
  type: TType
  tag: TType
  content: string
  attrs?: TAttributes
  children?: readonly TChild[]
  autoClosed?: boolean
}

/**
 * Nodes accepted by public rendering APIs. Callers that own custom node shapes
 * can pass their union as `TCustomNode`.
 */
export type RenderableMarkdownNode<TCustomNode extends BaseNode = never>
  = KnownMarkdownNode | TCustomNode

export type RenderableMarkdownNodeFromSchema<
  TSchema extends { [TKey in keyof TSchema]: BaseNode },
> = RenderableMarkdownNode<TSchema[keyof TSchema]>

export const KNOWN_MARKDOWN_NODE_TYPES = [
  'text',
  'text_special',
  'heading',
  'paragraph',
  'inline',
  'list',
  'list_item',
  'code_block',
  'inline_code',
  'link',
  'image',
  'thematic_break',
  'blockquote',
  'table',
  'table_row',
  'table_cell',
  'strong',
  'emphasis',
  'strikethrough',
  'highlight',
  'insert',
  'subscript',
  'superscript',
  'checkbox',
  'checkbox_input',
  'emoji',
  'definition_list',
  'definition_item',
  'footnote',
  'footnote_reference',
  'footnote_anchor',
  'admonition',
  'vmr_container',
  'hardbreak',
  'math_inline',
  'math_block',
  'reference',
  'html_block',
  'html_inline',
  'label_open',
  'label_close',
] as const satisfies readonly KnownMarkdownNodeType[]

const knownNodeTypes: ReadonlySet<string> = new Set(KNOWN_MARKDOWN_NODE_TYPES)

export function isKnownMarkdownNode(node: BaseNode): node is KnownMarkdownNode {
  return knownNodeTypes.has(node.type)
}

export function isNodeType<TType extends KnownMarkdownNodeType>(
  node: BaseNode,
  type: TType,
): node is MarkdownNodeOfType<TType> {
  return node.type === type
}

export function isCustomNodeType<
  TCustomNode extends BaseNode,
  TType extends TCustomNode['type'],
>(
  node: BaseNode,
  type: TType,
): node is Extract<TCustomNode, { type: TType }> {
  return node.type === type
}

export function hasNodeChildren(
  node: BaseNode,
): node is BaseNode & { children: readonly BaseNode[] } {
  return 'children' in node && Array.isArray(node.children)
}

export function hasNodeItems(
  node: BaseNode,
): node is BaseNode & { items: readonly BaseNode[] } {
  return 'items' in node && Array.isArray(node.items)
}

export function getRenderableNodeChildren(node: BaseNode): readonly BaseNode[] {
  if (hasNodeChildren(node))
    return node.children
  if (hasNodeItems(node))
    return node.items
  return []
}

export function hasLoadingNodeTree(nodes: readonly BaseNode[]): boolean {
  return nodes.some(node => (
    node.loading === true
    || hasLoadingNodeTree(getRenderableNodeChildren(node))
  ))
}
