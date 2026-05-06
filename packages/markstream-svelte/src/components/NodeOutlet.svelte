<script lang="ts">
  import type { SvelteRenderableNode, SvelteRenderContext } from './shared/node-helpers'
  import { STANDARD_HTML_TAGS } from 'stream-markdown-parser'
  import { getCustomNodeComponents } from '../customComponents'
  import AdmonitionNode from './AdmonitionNode.svelte'
  import BlockquoteNode from './BlockquoteNode.svelte'
  import CheckboxNode from './CheckboxNode.svelte'
  import CodeBlockNode from './CodeBlockNode.svelte'
  import D2BlockNode from './D2BlockNode.svelte'
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
  import InfographicBlockNode from './InfographicBlockNode.svelte'
  import InlineCodeNode from './InlineCodeNode.svelte'
  import InsertNode from './InsertNode.svelte'
  import LinkNode from './LinkNode.svelte'
  import ListItemNode from './ListItemNode.svelte'
  import ListNode from './ListNode.svelte'
  import MathBlockNode from './MathBlockNode.svelte'
  import MathInlineNode from './MathInlineNode.svelte'
  import MermaidBlockNode from './MermaidBlockNode.svelte'
  import ParagraphNode from './ParagraphNode.svelte'
  import PreCodeNode from './PreCodeNode.svelte'
  import ReferenceNode from './ReferenceNode.svelte'
  import StrikethroughNode from './StrikethroughNode.svelte'
  import StrongNode from './StrongNode.svelte'
  import SubscriptNode from './SubscriptNode.svelte'
  import SuperscriptNode from './SuperscriptNode.svelte'
  import TableNode from './TableNode.svelte'
  import TextNode from './TextNode.svelte'
  import ThematicBreakNode from './ThematicBreakNode.svelte'
  import VmrContainerNode from './VmrContainerNode.svelte'
  import { hasCompleteHtmlTagContent } from './shared/node-helpers'
  import {
    coerceBuiltinHtmlNode,
    coerceCustomHtmlNode,
    resolveHtmlTag,
    resolveNodeOutletCodeMode,
    resolveNodeOutletCustomComponent,
    resolveNodeOutletCustomInputs,
  } from './shared/node-outlet-helpers'

  type Props = {
    node: SvelteRenderableNode
    context?: SvelteRenderContext
    indexKey?: string | number
  };
  let {
    node,
    context = undefined,
    indexKey = undefined,
  }: Props = $props()

  let resolvedType = $derived(String(node.type || ''))
  let customComponentMap = $derived(context?.customComponents || getCustomNodeComponents(context?.customId))
  let CustomComponent = $derived(resolveNodeOutletCustomComponent(node, context, customComponentMap))
  let customNode = $derived(coerceCustomHtmlNode(node))
  let customInputs = $derived(resolveNodeOutletCustomInputs(node, context) || {})
  let codeMode = $derived(resolveNodeOutletCodeMode(node, context))
  let htmlTag = $derived(resolveHtmlTag(node))
  let shouldEscapeHtmlTag = $derived(resolveShouldEscapeHtmlTag())
  let htmlRenderNode = $derived(coerceBuiltinHtmlNode(node, resolvedType) as SvelteRenderableNode)
  let codeBlockInstanceKey = $derived(`${String(indexKey ?? 'code-block')}:${String(node.language ?? '')}:${node.diff ? 'diff' : 'code'}`)
  let escapedTextNode = $derived({
    type: 'text',
    content: String(node.content ?? node.raw ?? ''),
    raw: String(node.content ?? node.raw ?? ''),
  } as SvelteRenderableNode)

  function resolveShouldEscapeHtmlTag() {
    if (resolvedType !== 'html_block' && resolvedType !== 'html_inline')
      return false
    if (context?.htmlPolicy === 'escape')
      return true
    if (!htmlTag)
      return false
    const customHtmlTags = context?.customHtmlTags ?? []
    const isWhitelisted = customHtmlTags.some(t => String(t).toLowerCase() === htmlTag)
    if (isWhitelisted)
      return false
    if (STANDARD_HTML_TAGS.has(htmlTag))
      return false
    return !hasCompleteHtmlTagContent(node.content ?? node.raw, htmlTag)
  }
</script>

{#if CustomComponent}
  <CustomComponent
    node={customNode}
    context={context}
    ctx={context}
    customId={context?.customId}
    isDark={context?.isDark}
    indexKey={indexKey}
    typewriter={context?.typewriter}
    {...customInputs}
  />
{:else if node.type === 'text' || node.type === 'text_special'}
  <TextNode node={node} {context} {indexKey} typewriter={context?.typewriter} />
{:else if node.type === 'paragraph'}
  <ParagraphNode node={node} {context} {indexKey} />
{:else if node.type === 'heading'}
  <HeadingNode node={node} {context} {indexKey} />
{:else if node.type === 'blockquote'}
  <BlockquoteNode node={node} {context} {indexKey} />
{:else if node.type === 'list'}
  <ListNode node={node} {context} {indexKey} />
{:else if node.type === 'list_item'}
  <ListItemNode node={node} {context} {indexKey} />
{:else if node.type === 'table'}
  <TableNode node={node} {context} />
{:else if node.type === 'definition_list'}
  <DefinitionListNode node={node} {context} />
{:else if node.type === 'footnote'}
  <FootnoteNode node={node} {context} />
{:else if node.type === 'footnote_reference'}
  <FootnoteReferenceNode node={node} />
{:else if node.type === 'footnote_anchor'}
  <FootnoteAnchorNode node={node} />
{:else if node.type === 'admonition'}
  <AdmonitionNode node={node} {context} />
{:else if node.type === 'hardbreak'}
  <HardBreakNode />
{:else if node.type === 'link'}
  <LinkNode node={node} {context} {indexKey} showTooltip={typeof context?.showTooltips === 'boolean' ? context?.showTooltips : undefined} />
{:else if node.type === 'image'}
  <ImageNode node={node} />
{:else if node.type === 'inline_code'}
  <InlineCodeNode node={node} />
{:else if node.type === 'strong'}
  <StrongNode node={node} {context} {indexKey} />
{:else if node.type === 'emphasis'}
  <EmphasisNode node={node} {context} {indexKey} />
{:else if node.type === 'strikethrough'}
  <StrikethroughNode node={node} {context} {indexKey} />
{:else if node.type === 'highlight'}
  <HighlightNode node={node} {context} {indexKey} />
{:else if node.type === 'insert'}
  <InsertNode node={node} {context} {indexKey} />
{:else if node.type === 'subscript'}
  <SubscriptNode node={node} {context} {indexKey} />
{:else if node.type === 'superscript'}
  <SuperscriptNode node={node} {context} {indexKey} />
{:else if node.type === 'checkbox' || node.type === 'checkbox_input'}
  <CheckboxNode node={node} />
{:else if node.type === 'emoji'}
  <EmojiNode node={node} />
{:else if node.type === 'reference'}
  <ReferenceNode node={node} {context} />
{:else if node.type === 'html_block'}
  {#if shouldEscapeHtmlTag}
    <TextNode node={escapedTextNode as SvelteRenderableNode<'text'>} {context} {indexKey} />
  {:else}
    <HtmlBlockNode node={htmlRenderNode as SvelteRenderableNode<'html_block'>} {context} />
  {/if}
{:else if node.type === 'html_inline'}
  {#if shouldEscapeHtmlTag}
    <TextNode node={escapedTextNode as SvelteRenderableNode<'text'>} {context} {indexKey} />
  {:else}
    <HtmlInlineNode node={htmlRenderNode as SvelteRenderableNode<'html_inline'>} {context} />
  {/if}
{:else if node.type === 'vmr_container'}
  <VmrContainerNode node={node} {context} />
{:else if node.type === 'thematic_break'}
  <ThematicBreakNode />
{:else if node.type === 'math_inline'}
  <MathInlineNode node={node} />
{:else if node.type === 'math_block'}
  <MathBlockNode node={node} />
{:else if node.type === 'code_block'}
  {#if codeMode === 'mermaid'}
    <MermaidBlockNode node={node} {context} {...customInputs} />
  {:else if codeMode === 'd2'}
    <D2BlockNode node={node} {context} {...customInputs} />
  {:else if codeMode === 'infographic'}
    <InfographicBlockNode node={node} {context} {...customInputs} />
  {:else if codeMode === 'pre'}
    <PreCodeNode node={node} />
  {:else}
    {#key codeBlockInstanceKey}
      <CodeBlockNode node={node} {context} {...customInputs} />
    {/key}
  {/if}
{:else if node.type === 'label_open' || node.type === 'label_close'}
  <span hidden></span>
{:else}
  <FallbackComponent {node} {context} />
{/if}
