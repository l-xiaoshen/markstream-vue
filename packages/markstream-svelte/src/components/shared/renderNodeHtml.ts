import type { BaseNode } from 'stream-markdown-parser'
import type { SvelteRenderContext } from '../../types/renderer'
import { renderMarkdownNodeToHtml } from '../../renderMarkdownHtml'

export function renderNodeHtml(node: BaseNode | null | undefined, context?: SvelteRenderContext) {
  return renderMarkdownNodeToHtml(node, {
    cacheKey: context?.customId ? `markstream-svelte-${context.customId}` : 'markstream-svelte-node',
    customHtmlTags: context?.customHtmlTags,
    allowHtml: context?.allowHtml !== false,
    htmlPolicy: context?.htmlPolicy ?? 'safe',
  })
}
