import type {
  ListItemNode,
  ListNode,
  ParagraphNode,
  TextNode,
} from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'
import { parseNestedMarkdownToNodes } from '../src/parseNestedMarkdownToNodes'
import { renderNestedMarkdownToHtml } from '../src/renderMarkdownHtml'

describe('nested rendering', () => {
  it('uses item-based children for list nodes', () => {
    const text: TextNode = {
      type: 'text',
      content: 'Nested item',
      raw: 'Nested item',
    }
    const paragraph: ParagraphNode = {
      type: 'paragraph',
      children: [text],
      raw: 'Nested item',
    }
    const item: ListItemNode = {
      type: 'list_item',
      children: [paragraph],
      raw: '- Nested item',
    }
    const list: ListNode = {
      type: 'list',
      items: [item],
      ordered: false,
      raw: '- Nested item',
    }

    expect(parseNestedMarkdownToNodes({ node: list })).toEqual([item])
    expect(renderNestedMarkdownToHtml({ node: list })).toContain(
      '<li><p>Nested item</p></li>',
    )
  })
})
