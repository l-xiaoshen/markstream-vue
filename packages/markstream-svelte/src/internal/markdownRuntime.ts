import type {
  MarkdownIt,
  ParsedNode,
  ParseOptions,
} from 'stream-markdown-parser'
import {
  getMarkdown,
  mergeCustomHtmlTags,
  parseMarkdownToStructure,
} from 'stream-markdown-parser'
import { hydrateCustomTagContent } from '../hydrateCustomTagContent'

export interface MarkdownRuntimeOptions {
  cacheKey: string
  customHtmlTags?: readonly string[] | undefined
  customMarkdownIt?: ((markdown: MarkdownIt) => MarkdownIt) | undefined
}

export interface MarkdownRuntimeParseOptions extends MarkdownRuntimeOptions {
  final?: boolean | undefined
  parseOptions?: ParseOptions | undefined
}

export interface MarkdownRuntime {
  getMarkdown: (options: MarkdownRuntimeOptions) => MarkdownIt
  parse: (content: string, options: MarkdownRuntimeParseOptions) => ParsedNode[]
}

export function createMarkdownRuntime(): MarkdownRuntime {
  const markdownCache = new Map<string, MarkdownIt>()
  const customizerIds = new WeakMap<
    NonNullable<MarkdownRuntimeOptions['customMarkdownIt']>,
    number
  >()
  let nextCustomizerId = 0

  function getCustomizerCacheKey(
    customizer: MarkdownRuntimeOptions['customMarkdownIt'],
  ): string {
    if (!customizer)
      return 'default'

    const cached = customizerIds.get(customizer)
    if (cached !== undefined)
      return `custom-${cached}`

    nextCustomizerId += 1
    customizerIds.set(customizer, nextCustomizerId)
    return `custom-${nextCustomizerId}`
  }

  function resolveMarkdown(options: MarkdownRuntimeOptions): MarkdownIt {
    const customHtmlTags = mergeCustomHtmlTags(options.customHtmlTags)
    const cacheKey = [
      options.cacheKey,
      customHtmlTags.join(','),
      getCustomizerCacheKey(options.customMarkdownIt),
    ].join('::')
    let markdown = markdownCache.get(cacheKey)

    if (!markdown) {
      markdown = getMarkdown(cacheKey, { customHtmlTags })
      if (options.customMarkdownIt)
        markdown = options.customMarkdownIt(markdown)
      markdownCache.set(cacheKey, markdown)
    }

    return markdown
  }

  return {
    getMarkdown: resolveMarkdown,
    parse(content, options) {
      if (!content)
        return []

      const customHtmlTags = mergeCustomHtmlTags(
        options.customHtmlTags,
        options.parseOptions?.customHtmlTags,
      )
      const parseOptions = resolveParseOptions(options, customHtmlTags)
      const markdown = resolveMarkdown({
        cacheKey: options.cacheKey,
        customHtmlTags,
        customMarkdownIt: options.customMarkdownIt,
      })

      return hydrateCustomTagContent(
        parseMarkdownToStructure(content, markdown, parseOptions),
        content,
        customHtmlTags,
      )
    },
  }
}

export const defaultMarkdownRuntime = createMarkdownRuntime()

function resolveParseOptions(
  options: MarkdownRuntimeParseOptions,
  customHtmlTags: readonly string[],
): ParseOptions {
  const parseOptions: ParseOptions = {
    ...(options.parseOptions ?? {}),
  }
  if (typeof options.final === 'boolean')
    parseOptions.final = options.final
  if (customHtmlTags.length > 0)
    parseOptions.customHtmlTags = customHtmlTags
  return parseOptions
}
