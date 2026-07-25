<script lang="ts" generics="TCustomNode extends BaseNode = never">
  import type {
    BaseNode,
    HtmlBlockNode as ParserHtmlBlockNode,
    HtmlInlineNode as ParserHtmlInlineNode,
    TextNode as ParserTextNode,
  } from 'stream-markdown-parser'
  import type { MarkstreamCustomComponentProps } from '../customComponents'
  import type { IndexedNodeProps } from '../types/componentProps'
  import type { ParsedMarkdownNode } from '../types/nodes'
  import type { SvelteRenderContext } from '../types/renderer'
  import {
    hasCompleteHtmlTagContent,
    STANDARD_HTML_TAGS,
  } from 'stream-markdown-parser'
  import { getCustomNodeComponents } from '../customComponents'
  import { isNodeType } from '../types/nodes'
  import AdmonitionNode from './AdmonitionNode.svelte'
  import BlockquoteNode from './BlockquoteNode.svelte'
  import CheckboxNode from './CheckboxNode.svelte'
  import CodeBlockOutlet from './CodeBlockOutlet.svelte'
  import DefinitionListNode from './DefinitionListNode.svelte'
  import EmojiNode from './EmojiNode.svelte'
  import EmphasisNode from './EmphasisNode.svelte'
  import FallbackComponent from './FallbackComponent.svelte'
  import FootnoteAnchorNode from './FootnoteAnchorNode.svelte'
  import FootnoteNode from './FootnoteNode.svelte'
  import FootnoteReferenceNode from './FootnoteReferenceNode.svelte'
  import HardBreakNode from './HardBreakNode.svelte'
  import HeadingNode from './HeadingNode.svelte'
  import HighlightNode from './HighlightNode.svelte'
  import HtmlBlockNode from './HtmlBlockNode.svelte'
  import HtmlInlineNode from './HtmlInlineNode.svelte'
  import ImageNode from './ImageNode.svelte'
  import InlineCodeNode from './InlineCodeNode.svelte'
  import InsertNode from './InsertNode.svelte'
  import LinkNode from './LinkNode.svelte'
  import ListItemNode from './ListItemNode.svelte'
  import ListNode from './ListNode.svelte'
  import MathBlockNode from './MathBlockNode.svelte'
  import MathInlineNode from './MathInlineNode.svelte'
  import ParagraphNode from './ParagraphNode.svelte'
  import ReferenceNode from './ReferenceNode.svelte'
  import RenderChildren from './RenderChildren.svelte'
  import StrikethroughNode from './StrikethroughNode.svelte'
  import StrongNode from './StrongNode.svelte'
  import SubscriptNode from './SubscriptNode.svelte'
  import SuperscriptNode from './SuperscriptNode.svelte'
  import TableNode from './TableNode.svelte'
  import TextNode from './TextNode.svelte'
  import ThematicBreakNode from './ThematicBreakNode.svelte'
  import VmrContainerNode from './VmrContainerNode.svelte'
  import {
    coerceBuiltinHtmlNode,
    coerceCustomHtmlNode,
    resolveHtmlTag,
    resolveNodeOutletCustomComponent,
  } from './shared/node-outlet-helpers'

  const EMPTY_RENDER_CONTEXT = { events: {} } satisfies SvelteRenderContext

  let {
    node,
    context = EMPTY_RENDER_CONTEXT,
    indexKey = undefined,
  }: IndexedNodeProps<ParsedMarkdownNode<TCustomNode>> = $props()

  let resolvedIndexKey = $derived(indexKey ?? 'node')
  let customComponentMap = $derived(context.customComponents || getCustomNodeComponents(context.customId))
  let CustomComponent = $derived(resolveNodeOutletCustomComponent(node, context, customComponentMap))
  let customNode = $derived(coerceCustomHtmlNode(node))
  let customComponentProps = $derived({
    node: customNode,
    context,
    indexKey: resolvedIndexKey,
  } satisfies MarkstreamCustomComponentProps<typeof customNode>)
  let htmlTag = $derived(resolveHtmlTag(node))
  let shouldEscapeHtmlTag = $derived(resolveShouldEscapeHtmlTag())

  function resolveShouldEscapeHtmlTag(): boolean {
    if (!isNodeType(node, 'html_block') && !isNodeType(node, 'html_inline'))
      return false
    if (context.htmlPolicy === 'escape')
      return true
    if (!htmlTag)
      return false
    const customHtmlTags = context.customHtmlTags ?? []
    const isWhitelisted = customHtmlTags.some(t => String(t).toLowerCase() === htmlTag)
    if (isWhitelisted)
      return false
    if (STANDARD_HTML_TAGS.has(htmlTag))
      return false
    return !hasCompleteHtmlTagContent(node.content, htmlTag)
  }

  function createEscapedTextNode(
    htmlNode: ParserHtmlBlockNode | ParserHtmlInlineNode,
  ): ParserTextNode {
    return {
      type: 'text',
      content: htmlNode.content,
      raw: htmlNode.content,
    }
  }
</script>

{#if CustomComponent}
  <CustomComponent {...customComponentProps} />
{:else if isNodeType(node, 'text') || isNodeType(node, 'text_special')}
  <TextNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'paragraph')}
  <ParagraphNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'inline')}
  <RenderChildren nodes={node.children} {context} prefix={`${resolvedIndexKey}-inline`} />
{:else if isNodeType(node, 'heading')}
  <HeadingNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'blockquote')}
  <BlockquoteNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'list')}
  <ListNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'list_item')}
  <ListItemNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'table')}
  <TableNode {node} {context} />
{:else if isNodeType(node, 'definition_list')}
  <DefinitionListNode {node} {context} />
{:else if isNodeType(node, 'footnote')}
  <FootnoteNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'footnote_reference')}
  <FootnoteReferenceNode {node} />
{:else if isNodeType(node, 'footnote_anchor')}
  <FootnoteAnchorNode {node} />
{:else if isNodeType(node, 'admonition')}
  <AdmonitionNode {node} {context} />
{:else if isNodeType(node, 'hardbreak')}
  <HardBreakNode />
{:else if isNodeType(node, 'link')}
  <LinkNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'image')}
  <ImageNode {node} {context} />
{:else if isNodeType(node, 'inline_code')}
  <InlineCodeNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'strong')}
  <StrongNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'emphasis')}
  <EmphasisNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'strikethrough')}
  <StrikethroughNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'highlight')}
  <HighlightNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'insert')}
  <InsertNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'subscript')}
  <SubscriptNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'superscript')}
  <SuperscriptNode {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'checkbox') || isNodeType(node, 'checkbox_input')}
  <CheckboxNode {node} />
{:else if isNodeType(node, 'emoji')}
  <EmojiNode {node} />
{:else if isNodeType(node, 'reference')}
  <ReferenceNode {node} {context} />
{:else if isNodeType(node, 'html_block')}
  {#if shouldEscapeHtmlTag}
    <TextNode node={createEscapedTextNode(node)} {context} indexKey={resolvedIndexKey} />
  {:else}
    <HtmlBlockNode node={coerceBuiltinHtmlNode(node)} {context} />
  {/if}
{:else if isNodeType(node, 'html_inline')}
  {#if shouldEscapeHtmlTag}
    <TextNode node={createEscapedTextNode(node)} {context} indexKey={resolvedIndexKey} />
  {:else}
    <HtmlInlineNode node={coerceBuiltinHtmlNode(node)} {context} />
  {/if}
{:else if isNodeType(node, 'vmr_container')}
  <VmrContainerNode {node} {context} />
{:else if isNodeType(node, 'thematic_break')}
  <ThematicBreakNode />
{:else if isNodeType(node, 'math_inline')}
  <MathInlineNode {node} {context} />
{:else if isNodeType(node, 'math_block')}
  <MathBlockNode {node} {context} />
{:else if isNodeType(node, 'code_block')}
  <CodeBlockOutlet {node} {context} indexKey={resolvedIndexKey} />
{:else if isNodeType(node, 'label_open') || isNodeType(node, 'label_close')}
  <span hidden></span>
{:else}
  <FallbackComponent {node} {context} />
{/if}
