import type { RenderOptions } from '@terrastruct/d2'
import type { CodeBlockNode } from 'stream-markdown-parser'
import type { MermaidModule } from '../src/optional/mermaid'
import { describe, expect, it, vi } from 'vitest'
import {
  resolveNodeOutletCodeMode,
  resolveNodeOutletCustomInputs,
} from '../src/components/shared/node-outlet-helpers'
import { renderD2Svg } from '../src/utils/rendering/d2'
import { renderKatexMarkup } from '../src/utils/rendering/katex'
import { resolveMermaidRenderSource } from '../src/utils/rendering/mermaid'

describe('rich block rendering pipelines', () => {
  it('keeps rich diagram routing when plain code uses pre rendering', () => {
    const codeNode = (language: string): CodeBlockNode => ({
      type: 'code_block',
      code: 'a -> b',
      language,
      raw: 'a -> b',
    })
    const context = {
      events: {},
      renderCodeBlocksAsPre: true,
    }

    expect(resolveNodeOutletCodeMode(codeNode('text'), context)).toBe('pre')
    expect(resolveNodeOutletCodeMode(codeNode('mermaid'), context)).toBe('mermaid')
    expect(resolveNodeOutletCodeMode(codeNode('d2'), context)).toBe('d2')
    expect(resolveNodeOutletCodeMode(codeNode('infographic'), context)).toBe('infographic')
  })

  it('forwards legacy rich options to custom code renderers', () => {
    const node: CodeBlockNode = {
      type: 'code_block',
      code: 'graph TD\nA --> B',
      language: 'mermaid',
      raw: 'graph TD\nA --> B',
    }

    const inputs = resolveNodeOutletCustomInputs(node, {
      events: {},
      mermaidProps: {
        legacyOption: 'kept',
        maxHeight: '480px',
        showHeader: false,
      },
    })

    expect(inputs).toMatchObject({
      legacyOption: 'kept',
      maxHeight: '480px',
      showHeader: false,
    })
    expect(inputs?.estimatedPreviewHeightPx).toBeTypeOf('number')
  })

  it('runs D2 compile and render through the shared pipeline', async () => {
    const diagram = { root: true }
    const renderOptions: RenderOptions = { sketch: true }
    const compile = vi.fn(async () => ({
      diagram,
      renderOptions,
    }))
    const render = vi.fn(async () => (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>'
    ))

    const markup = await renderD2Svg({
      darkThemeId: 200,
      isDark: true,
      source: 'a -> b',
      svgClass: 'd2-root',
      themeId: 100,
    }, {
      getRenderer: async () => ({ compile, render }),
    })

    expect(compile).toHaveBeenCalledWith('a -> b')
    expect(render).toHaveBeenCalledWith(
      diagram,
      { sketch: true, themeID: 200 },
    )
    expect(markup).toContain('class="d2-root"')
  })

  it('falls back from recoverable KaTeX worker failures', async () => {
    const cache = vi.fn()
    const renderToString = vi.fn(() => '<span class="katex">x</span>')
    const html = await renderKatexMarkup({
      displayMode: false,
      source: 'x',
      throwOnError: false,
    }, {
      getRenderer: async () => ({ renderToString }),
      renderInWorker: async () => {
        throw Object.assign(new Error('worker unavailable'), {
          code: 'WORKER_INIT_ERROR',
        })
      },
      setCache: cache,
    })

    expect(html).toContain('class="katex"')
    expect(renderToString).toHaveBeenCalledWith('x', {
      displayMode: false,
      throwOnError: false,
    })
    expect(cache).toHaveBeenCalledWith('x', false, html)
  })

  it('selects a renderable Mermaid prefix for streamed input', async () => {
    const source = 'graph TD\nA-->B\nB--'
    const prefix = 'graph TD\nA-->B'
    const mermaid: Pick<MermaidModule, 'parse' | 'render'> = {
      parse: vi.fn(async (value: string) => {
        if (value.includes('B--'))
          throw new Error('incomplete')
        return { config: {}, diagramType: 'flowchart-v2' }
      }),
      render: vi.fn(async () => ({
        diagramType: 'flowchart-v2',
        svg: '',
      })),
    }

    await expect(resolveMermaidRenderSource({
      allowPrefix: true,
      dependencies: {
        canParse: async (value) => {
          if (value === source)
            throw new Error('incomplete')
          return true
        },
        findPrefix: async () => prefix,
      },
      mermaid,
      parseTimeoutMs: 50,
      progressive: true,
      source,
      theme: 'light',
      workerTimeoutMs: 50,
    })).resolves.toEqual({
      fullRender: false,
      source: prefix,
    })
  })
})
