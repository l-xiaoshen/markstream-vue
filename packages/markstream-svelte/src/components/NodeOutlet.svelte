<script lang="ts" generics="TCustomNode extends BaseNode = never">
  import type {
    BaseNode,
    HtmlBlockNode as ParserHtmlBlockNode,
    HtmlInlineNode as ParserHtmlInlineNode,
    TextNode as ParserTextNode,
  } from 'stream-markdown-parser'
  import type { NodeProps } from '../types/componentProps'
  import type { ParsedMarkdownNode } from '../types/nodes'
  import type { SvelteRenderContext } from '../types/renderer'
  import {
    hasCompleteHtmlTagContent,
    STANDARD_HTML_TAGS,
  } from 'stream-markdown-parser'
  import { createCustomComponentProps, getCustomNodeComponents } from '../customComponents'
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
    resolveNodeOutletCustomInputs,
  } from './shared/node-outlet-helpers'

  const EMPTY_RENDER_CONTEXT = { events: {} } satisfies SvelteRenderContext

  let {
    node,
    context = EMPTY_RENDER_CONTEXT,
    indexKey = undefined,
  }: NodeProps<ParsedMarkdownNode<TCustomNode>> = $props()

  let resolvedIndexKey = $derived(indexKey ?? 'node')
  let standardProps = $derived({
    context,
    indexKey: resolvedIndexKey,
  })
  let customComponentMap = $derived(context.customComponents || getCustomNodeComponents(context.customId))
  let CustomComponent = $derived(resolveNodeOutletCustomComponent(node, context, customComponentMap))
  let customNode = $derived(coerceCustomHtmlNode(node))
  let customInputs = $derived(resolveNodeOutletCustomInputs(node, context) ?? {})
  let customComponentProps = $derived(createCustomComponentProps(
    customNode,
    context,
    resolvedIndexKey,
    customInputs,
  ))
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
  <TextNode {node} {...standardProps} />
{:else if isNodeType(node, 'paragraph')}
  <ParagraphNode {node} {...standardProps} />
{:else if isNodeType(node, 'inline')}
  <RenderChildren nodes={node.children} {context} prefix={`${resolvedIndexKey}-inline`} />
{:else if isNodeType(node, 'heading')}
  <HeadingNode {node} {...standardProps} />
{:else if isNodeType(node, 'blockquote')}
  <BlockquoteNode {node} {...standardProps} />
{:else if isNodeType(node, 'list')}
  <ListNode {node} {...standardProps} />
{:else if isNodeType(node, 'list_item')}
  <ListItemNode {node} {...standardProps} />
{:else if isNodeType(node, 'table')}
  <TableNode {node} {...standardProps} />
{:else if isNodeType(node, 'definition_list')}
  <DefinitionListNode {node} {...standardProps} />
{:else if isNodeType(node, 'footnote')}
  <FootnoteNode {node} {...standardProps} />
{:else if isNodeType(node, 'footnote_reference')}
  <FootnoteReferenceNode {node} {...standardProps} />
{:else if isNodeType(node, 'footnote_anchor')}
  <FootnoteAnchorNode {node} {...standardProps} />
{:else if isNodeType(node, 'admonition')}
  <AdmonitionNode {node} {...standardProps} />
{:else if isNodeType(node, 'hardbreak')}
  <HardBreakNode {node} {...standardProps} />
{:else if isNodeType(node, 'link')}
  <LinkNode {node} {...standardProps} />
{:else if isNodeType(node, 'image')}
  <ImageNode {node} {...standardProps} />
{:else if isNodeType(node, 'inline_code')}
  <InlineCodeNode {node} {...standardProps} />
{:else if isNodeType(node, 'strong')}
  <StrongNode {node} {...standardProps} />
{:else if isNodeType(node, 'emphasis')}
  <EmphasisNode {node} {...standardProps} />
{:else if isNodeType(node, 'strikethrough')}
  <StrikethroughNode {node} {...standardProps} />
{:else if isNodeType(node, 'highlight')}
  <HighlightNode {node} {...standardProps} />
{:else if isNodeType(node, 'insert')}
  <InsertNode {node} {...standardProps} />
{:else if isNodeType(node, 'subscript')}
  <SubscriptNode {node} {...standardProps} />
{:else if isNodeType(node, 'superscript')}
  <SuperscriptNode {node} {...standardProps} />
{:else if isNodeType(node, 'checkbox') || isNodeType(node, 'checkbox_input')}
  <CheckboxNode {node} {...standardProps} />
{:else if isNodeType(node, 'emoji')}
  <EmojiNode {node} {...standardProps} />
{:else if isNodeType(node, 'reference')}
  <ReferenceNode {node} {...standardProps} />
{:else if isNodeType(node, 'html_block')}
  {#if shouldEscapeHtmlTag}
    <TextNode node={createEscapedTextNode(node)} {...standardProps} />
  {:else}
    <HtmlBlockNode node={coerceBuiltinHtmlNode(node)} {...standardProps} />
  {/if}
{:else if isNodeType(node, 'html_inline')}
  {#if shouldEscapeHtmlTag}
    <TextNode node={createEscapedTextNode(node)} {...standardProps} />
  {:else}
    <HtmlInlineNode node={coerceBuiltinHtmlNode(node)} {...standardProps} />
  {/if}
{:else if isNodeType(node, 'vmr_container')}
  <VmrContainerNode {node} {...standardProps} />
{:else if isNodeType(node, 'thematic_break')}
  <ThematicBreakNode {node} {...standardProps} />
{:else if isNodeType(node, 'math_inline')}
  <MathInlineNode {node} {...standardProps} />
{:else if isNodeType(node, 'math_block')}
  <MathBlockNode {node} {...standardProps} />
{:else if isNodeType(node, 'code_block')}
  <CodeBlockOutlet {node} {...standardProps} />
{:else if isNodeType(node, 'label_open') || isNodeType(node, 'label_close')}
  <span hidden></span>
{:else}
  <FallbackComponent {node} {...standardProps} />
{/if}
