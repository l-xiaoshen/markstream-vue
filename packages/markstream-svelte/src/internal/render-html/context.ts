import type {
  BaseNode,
  HtmlPolicy,
  MarkdownIt,
} from 'stream-markdown-parser'
import type { HtmlClassValue } from '../../utils/rendering/html'
import type { MarkdownRuntime } from '../markdownRuntime'
import {
  mergeCustomHtmlTags,
  normalizeCustomHtmlTagName,
} from 'stream-markdown-parser'

export interface RenderContextOptions {
  cacheKey?: string | undefined
  customHtmlTags?: readonly string[] | undefined
  allowHtml?: boolean | undefined
  htmlPolicy?: HtmlPolicy | undefined
  customNodeTag?: string | undefined
  customNodeClass?: HtmlClassValue | ((node: BaseNode) => HtmlClassValue) | undefined
}

export interface RenderContext {
  cacheKey: string
  markdown: MarkdownIt
  options: {
    allowHtml: boolean
    htmlPolicy: HtmlPolicy
    customNodeTag: string
    customNodeClass: HtmlClassValue | ((node: BaseNode) => HtmlClassValue) | undefined
  }
}

export type RenderNodesToHtml = (
  nodes: readonly BaseNode[] | null | undefined,
  context: RenderContext,
) => string

const DEFAULT_CACHE_KEY = 'markstream-svelte-html'
const DEFAULT_CUSTOM_NODE_TAG = 'div'

export function createRenderContext(
  options: RenderContextOptions,
  markdownRuntime: MarkdownRuntime,
): RenderContext {
  const customHtmlTags = mergeCustomHtmlTags(options.customHtmlTags)
  const cacheKey = options.cacheKey || DEFAULT_CACHE_KEY

  return {
    cacheKey,
    markdown: markdownRuntime.getMarkdown({
      cacheKey,
      customHtmlTags,
    }),
    options: {
      allowHtml: options.allowHtml !== false,
      htmlPolicy: options.htmlPolicy ?? 'safe',
      customNodeTag: normalizeCustomHtmlTagName(options.customNodeTag) || DEFAULT_CUSTOM_NODE_TAG,
      customNodeClass: options.customNodeClass,
    },
  }
}
