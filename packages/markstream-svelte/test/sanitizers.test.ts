import { describe, expect, it } from 'vitest'
import { sanitizeHtmlContent } from '../src/sanitizeHtmlContent'
import { toSafeSvgMarkup } from '../src/sanitizeSvg'

describe('html sanitizer', () => {
  it('removes executable content while preserving safe markup', () => {
    const output = sanitizeHtmlContent(
      '<div onclick="run()"><script>alert(1)</script><a href="javascript:run()">safe</a><img src="https://example.com/a.png" onerror="run()"></div>',
    )

    expect(output).toContain('<div>')
    expect(output).toContain('safe')
    expect(output).toContain('https://example.com/a.png')
    expect(output).not.toMatch(/alert|javascript:|onerror|onclick|script/i)
  })

  it('escapes all markup under the escape policy', () => {
    expect(sanitizeHtmlContent('<em>safe</em>', 'escape'))
      .toBe('&lt;em&gt;safe&lt;/em&gt;')
  })
})

describe('svg sanitizer', () => {
  it('removes scripts, event handlers, and unsafe URLs', () => {
    const output = toSafeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><a href="javascript:run()"><rect onclick="run()" style="fill: url(javascript:run())"/></a><image href="https://example.com/a.png"/></svg>',
    )

    expect(output).toContain('https://example.com/a.png')
    expect(output).not.toMatch(/alert|javascript:|onclick|script/i)
  })
})
