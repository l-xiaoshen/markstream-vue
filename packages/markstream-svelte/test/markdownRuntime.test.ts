import type { MarkdownIt } from 'stream-markdown-parser'
import { describe, expect, it, vi } from 'vitest'
import { createMarkdownRuntime } from '../src/internal/markdownRuntime'

describe('markdown runtime', () => {
  it('applies each MarkdownIt customizer once per cached configuration', () => {
    const runtime = createMarkdownRuntime()
    const customize = vi.fn((markdown: MarkdownIt) => markdown)
    const options = {
      cacheKey: 'customized',
      customHtmlTags: ['thinking'],
      customMarkdownIt: customize,
    }

    const first = runtime.getMarkdown(options)
    const second = runtime.getMarkdown(options)

    expect(second).toBe(first)
    expect(customize).toHaveBeenCalledTimes(1)
  })

  it('isolates different customizers that share a caller cache key', () => {
    const runtime = createMarkdownRuntime()
    const customizeFirst = vi.fn((markdown: MarkdownIt) => markdown)
    const customizeSecond = vi.fn((markdown: MarkdownIt) => markdown)

    const first = runtime.getMarkdown({
      cacheKey: 'shared',
      customMarkdownIt: customizeFirst,
    })
    const second = runtime.getMarkdown({
      cacheKey: 'shared',
      customMarkdownIt: customizeSecond,
    })

    expect(second).not.toBe(first)
    expect(customizeFirst).toHaveBeenCalledTimes(1)
    expect(customizeSecond).toHaveBeenCalledTimes(1)
  })
})
