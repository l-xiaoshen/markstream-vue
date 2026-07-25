import { describe, expect, it } from 'vitest'
import { buildRenderContext } from '../src/components/shared/node-helpers'

describe('render context', () => {
  it('normalizes code settings once at the renderer boundary', () => {
    const context = buildRenderContext({
      codeBlockDarkTheme: 'vitesse-light',
      codeBlockLightTheme: 'vitesse-dark',
      codeBlockMaxWidth: 960,
      codeBlockMinWidth: 320,
      codeBlockMonacoOptions: {
        fontSize: 12,
        wordWrap: 'on',
      },
      codeBlockProps: {
        darkTheme: 'vitesse-dark',
        minWidth: 0,
        monacoOptions: {
          fontSize: 15,
        },
        showHeader: false,
        stream: false,
        themes: ['vitesse-dark'],
      },
      codeBlockStream: true,
      themes: ['vitesse-light'],
    })

    expect(context.codeBlockProps).toEqual({
      darkTheme: 'vitesse-dark',
      lightTheme: 'vitesse-dark',
      maxWidth: 960,
      minWidth: 0,
      monacoOptions: {
        fontSize: 15,
        wordWrap: 'on',
      },
      showHeader: false,
      stream: false,
      themes: ['vitesse-dark'],
    })
  })
})
