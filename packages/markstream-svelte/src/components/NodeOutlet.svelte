<script lang="ts">
  import { STANDARD_HTML_TAGS } from "stream-markdown-parser";
  import { getCustomNodeComponents } from "../customComponents";
  import AdmonitionNode from "./AdmonitionNode.svelte";
  import BlockquoteNode from "./BlockquoteNode.svelte";
  import CheckboxNode from "./CheckboxNode.svelte";
  import CodeBlockNode from "./CodeBlockNode.svelte";
  import D2BlockNode from "./D2BlockNode.svelte";
  import DefinitionListNode from "./DefinitionListNode.svelte";
  import EmojiNode from "./EmojiNode.svelte";
  import EmphasisNode from "./EmphasisNode.svelte";
  import FallbackComponent from "./FallbackComponent.svelte";
  import FootnoteAnchorNode from "./FootnoteAnchorNode.svelte";
  import FootnoteNode from "./FootnoteNode.svelte";
  import FootnoteReferenceNode from "./FootnoteReferenceNode.svelte";
  import HardBreakNode from "./HardBreakNode.svelte";
  import HeadingNode from "./HeadingNode.svelte";
  import HighlightNode from "./HighlightNode.svelte";
  import HtmlBlockNode from "./HtmlBlockNode.svelte";
  import HtmlInlineNode from "./HtmlInlineNode.svelte";
  import ImageNode from "./ImageNode.svelte";
  import InfographicBlockNode from "./InfographicBlockNode.svelte";
  import InlineCodeNode from "./InlineCodeNode.svelte";
  import InsertNode from "./InsertNode.svelte";
  import LinkNode from "./LinkNode.svelte";
  import ListItemNode from "./ListItemNode.svelte";
  import ListNode from "./ListNode.svelte";
  import MathBlockNode from "./MathBlockNode.svelte";
  import MathInlineNode from "./MathInlineNode.svelte";
  import MermaidBlockNode from "./MermaidBlockNode.svelte";
  import ParagraphNode from "./ParagraphNode.svelte";
  import PreCodeNode from "./PreCodeNode.svelte";
  import ReferenceNode from "./ReferenceNode.svelte";
  import StrikethroughNode from "./StrikethroughNode.svelte";
  import StrongNode from "./StrongNode.svelte";
  import SubscriptNode from "./SubscriptNode.svelte";
  import SuperscriptNode from "./SuperscriptNode.svelte";
  import TableNode from "./TableNode.svelte";
  import TextNode from "./TextNode.svelte";
  import ThematicBreakNode from "./ThematicBreakNode.svelte";
  import VmrContainerNode from "./VmrContainerNode.svelte";
  import type {
    SvelteRenderableNode,
    SvelteRenderContext,
  } from "./shared/node-helpers";
  import { hasCompleteHtmlTagContent } from "./shared/node-helpers";
  import {
    coerceBuiltinHtmlNode,
    resolveHtmlTag,
    resolveNodeOutletCodeMode,
    resolveNodeOutletCustomComponent,
    resolveNodeOutletCustomInputs,
  } from "./shared/node-outlet-helpers";

  type Props = {
    node: SvelteRenderableNode;
    context?: SvelteRenderContext;
    indexKey?: string | number;
  };
  let { node, context = undefined, indexKey = undefined }: Props = $props();

  let customComponentMap = $derived(
    context?.customComponents || getCustomNodeComponents(context?.customId),
  );
  let CustomComponent = $derived(
    resolveNodeOutletCustomComponent(node, context, customComponentMap),
  );

  function resolveShouldEscapeHtmlTag(htmlTag: string) {
    if (node.type !== "html_block" && node.type !== "html_inline") return false;
    if (context?.htmlPolicy === "escape") return true;
    if (!htmlTag) return false;
    const customHtmlTags = context?.customHtmlTags ?? [];
    const isWhitelisted = customHtmlTags.some(
      (t) => String(t).toLowerCase() === htmlTag,
    );
    if (isWhitelisted) return false;
    if (STANDARD_HTML_TAGS.has(htmlTag)) return false;
    return !hasCompleteHtmlTagContent(node.content ?? node.raw, htmlTag);
  }
</script>

{#if CustomComponent}
  <CustomComponent {node} {context} {indexKey} />
{:else if node.type === "text"}
  <TextNode {node} {context} {indexKey} typewriter={context?.typewriter} />
{:else if node.type === "paragraph"}
  <ParagraphNode {node} {context} {indexKey} />
{:else if node.type === "heading"}
  <HeadingNode {node} {context} {indexKey} />
{:else if node.type === "blockquote"}
  <BlockquoteNode {node} {context} {indexKey} />
{:else if node.type === "list"}
  <ListNode {node} {context} {indexKey} />
{:else if node.type === "list_item"}
  <ListItemNode {node} {context} {indexKey} />
{:else if node.type === "table"}
  <TableNode {node} {context} />
{:else if node.type === "definition_list"}
  <DefinitionListNode {node} {context} />
{:else if node.type === "footnote"}
  <FootnoteNode {node} {context} />
{:else if node.type === "footnote_reference"}
  <FootnoteReferenceNode {node} />
{:else if node.type === "footnote_anchor"}
  <FootnoteAnchorNode {node} />
{:else if node.type === "admonition"}
  <AdmonitionNode {node} {context} />
{:else if node.type === "hardbreak"}
  <HardBreakNode />
{:else if node.type === "link"}
  <LinkNode
    {node}
    {context}
    {indexKey}
    showTooltip={typeof context?.showTooltips === "boolean"
      ? context?.showTooltips
      : undefined}
  />
{:else if node.type === "image"}
  <ImageNode {node} />
{:else if node.type === "inline_code"}
  <InlineCodeNode {node} />
{:else if node.type === "strong"}
  <StrongNode {node} {context} {indexKey} />
{:else if node.type === "emphasis"}
  <EmphasisNode {node} {context} {indexKey} />
{:else if node.type === "strikethrough"}
  <StrikethroughNode {node} {context} {indexKey} />
{:else if node.type === "highlight"}
  <HighlightNode {node} {context} {indexKey} />
{:else if node.type === "insert"}
  <InsertNode {node} {context} {indexKey} />
{:else if node.type === "subscript"}
  <SubscriptNode {node} {context} {indexKey} />
{:else if node.type === "superscript"}
  <SuperscriptNode {node} {context} {indexKey} />
{:else if node.type === "checkbox" || node.type === "checkbox_input"}
  <CheckboxNode {node} />
{:else if node.type === "emoji"}
  <EmojiNode {node} />
{:else if node.type === "reference"}
  <ReferenceNode {node} {context} />
{:else if node.type === "html_block"}
  {#if resolveShouldEscapeHtmlTag(resolveHtmlTag(node))}
    <TextNode
      node={{
        type: "text",
        content: node.content ?? node.raw ?? "",
        raw: node.content ?? node.raw ?? "",
      }}
      {context}
      {indexKey}
    />
  {:else}
    {@const htmlRenderNode = coerceBuiltinHtmlNode(node)}
    <HtmlBlockNode node={htmlRenderNode} {context} />
  {/if}
{:else if node.type === "html_inline"}
  {#if resolveShouldEscapeHtmlTag(resolveHtmlTag(node))}
    <TextNode
      node={{
        type: "text",
        content: node.content ?? node.raw ?? "",
        raw: node.content ?? node.raw ?? "",
      }}
      {context}
      {indexKey}
    />
  {:else}
    {@const htmlRenderNode = coerceBuiltinHtmlNode(node)}
    <HtmlInlineNode node={htmlRenderNode} {context} />
  {/if}
{:else if node.type === "vmr_container"}
  <VmrContainerNode {node} {context} />
{:else if node.type === "thematic_break"}
  <ThematicBreakNode />
{:else if node.type === "math_inline"}
  <MathInlineNode {node} />
{:else if node.type === "math_block"}
  <MathBlockNode {node} />
{:else if node.type === "code_block"}
  {@const codeMode = resolveNodeOutletCodeMode(node, context)}
  {@const customInputs = resolveNodeOutletCustomInputs(node, context)}
  {#if codeMode === "mermaid"}
    <MermaidBlockNode {node} {context} {...customInputs} />
  {:else if codeMode === "d2"}
    <D2BlockNode {node} {context} {...customInputs} />
  {:else if codeMode === "infographic"}
    <InfographicBlockNode {node} {context} {...customInputs} />
  {:else if codeMode === "pre"}
    <PreCodeNode {node} />
  {:else}
    {#key `${String(indexKey ?? "code-block")}:${String(node.language ?? "")}:${node.diff ? "diff" : "code"}`}
      <CodeBlockNode {node} {context} {...customInputs} />
    {/key}
  {/if}
{:else}
  <FallbackComponent {node} {context} />
{/if}
