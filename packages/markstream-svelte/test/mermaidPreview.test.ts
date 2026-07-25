import { describe, expect, it } from 'vitest'
import {
  applyMermaidTheme,
  getSafeMermaidPrefixCandidate,
  normalizeMermaidSource,
} from '../src/utils/mermaidPreview'

describe('mermaid streaming helpers', () => {
  it('normalizes streamed class syntax', () => {
    expect(normalizeMermaidSource('A]::class'))
      .toBe('A]:::class')
  })

  it('does not duplicate an existing init directive', () => {
    const source = '%%{init: {"theme": "forest"}}%%\ngraph TD\nA-->B'
    expect(applyMermaidTheme(source, 'dark')).toBe(source)
  })

  it('removes a dangling streamed edge', () => {
    expect(getSafeMermaidPrefixCandidate('graph TD\nA-->B\nB--'))
      .toBe('graph TD\nA-->B')
  })
})
