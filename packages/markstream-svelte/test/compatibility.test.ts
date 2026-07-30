import { afterEach, describe, expect, it, vi } from 'vitest'
import { katexRuntime } from '../src/optional/katex'
import {
  enableD2,
  enableKatex,
  enableMermaid,
  getKatex,
  getMermaid,
  setD2Loader,
  setKatexLoader,
  setMermaidLoader,
} from '../src/optional/legacy'
import { getCompatibleD2 } from '../src/optional/legacyState'

afterEach(() => {
  delete (globalThis as Record<string, unknown>).katex
  delete (globalThis as Record<string, unknown>).mermaid
  delete (globalThis as Record<string, unknown>).__MARKSTREAM_ANGULAR_MERMAID__
  enableD2()
  enableKatex()
  enableMermaid()
})

describe('legacy optional peer controls', () => {
  it('normalizes a KaTeX module namespace', async () => {
    const katex = {
      ParseError: class ParseError extends Error {},
      render: vi.fn(),
      renderToString: vi.fn(() => '<span>math</span>'),
      version: 'legacy',
    }
    setKatexLoader(() => ({ default: katex }))

    await expect(getKatex()).resolves.toBe(katex)
  })

  it('normalizes a Mermaid API namespace', async () => {
    const mermaidAPI = {
      initialize: vi.fn(),
      parse: vi.fn(),
      render: vi.fn(),
    }
    setMermaidLoader(() => ({ default: { mermaidAPI } }))

    const mermaid = await getMermaid({ securityLevel: 'strict' })
    await getMermaid({ securityLevel: 'strict' })

    expect(mermaid?.render).toBeTypeOf('function')
    expect(mermaidAPI.initialize).toHaveBeenCalledWith({
      securityLevel: 'strict',
      suppressErrorRendering: true,
    })
    expect(mermaidAPI.initialize).toHaveBeenCalledTimes(1)
  })

  it('uses a hybrid Mermaid namespace initializer', async () => {
    const initialize = vi.fn()
    const render = vi.fn()
    setMermaidLoader(() => ({
      default: {
        mermaidAPI: { initialize },
        render,
      },
    }))

    const mermaid = await getMermaid({ securityLevel: 'loose' })

    expect(mermaid?.render).toBeTypeOf('function')
    expect(initialize).toHaveBeenCalledWith({
      securityLevel: 'loose',
      suppressErrorRendering: true,
    })
  })

  it('discovers legacy browser globals without a configured loader', async () => {
    const katex = { renderToString: vi.fn() }
    const initialize = vi.fn()
    const mermaid = {
      initialize,
      render: vi.fn(),
    }
    ;(globalThis as Record<string, unknown>).katex = katex
    ;(globalThis as Record<string, unknown>).mermaid = mermaid
    setKatexLoader(null)
    setMermaidLoader(null)

    await expect(getKatex()).resolves.toBe(katex)
    await expect(getMermaid({ customThemeOption: true })).resolves.toMatchObject({
      render: expect.any(Function),
    })
    expect(initialize).toHaveBeenCalledWith({
      customThemeOption: true,
      suppressErrorRendering: true,
    })
  })

  it('reuses normalized browser-global Mermaid namespaces', async () => {
    const initialize = vi.fn()
    ;(globalThis as Record<string, unknown>).mermaid = {
      mermaidAPI: {
        initialize,
        render: vi.fn(),
      },
    }

    await getMermaid({ securityLevel: 'strict' })
    await getMermaid({ securityLevel: 'strict' })

    expect(initialize).toHaveBeenCalledTimes(1)
  })

  it('normalizes D2 constructors and renderer instances', async () => {
    class LegacyD2 {}
    setD2Loader(() => ({ default: { D2: LegacyD2 } }))
    await expect(getCompatibleD2()).resolves.toBe(LegacyD2)

    const renderer = {
      compile: vi.fn(),
      render: vi.fn(),
    }
    setD2Loader(() => renderer)
    const D2Renderer = await getCompatibleD2()

    expect(D2Renderer && new D2Renderer()).toBe(renderer)
  })

  it('keeps broad legacy loaders out of strict runtime singletons', async () => {
    const canonicalKatex = {
      render: vi.fn(),
      renderToString: vi.fn(),
    }
    const legacyKatex = {
      renderToString: vi.fn(),
    }
    katexRuntime.setLoader(() => canonicalKatex as never)
    setKatexLoader(() => legacyKatex)

    await expect(getKatex()).resolves.toBe(legacyKatex)
    await expect(katexRuntime.get()).resolves.toBe(canonicalKatex)

    const replacementKatex = {
      render: vi.fn(),
      renderToString: vi.fn(),
    }
    katexRuntime.setLoader(() => replacementKatex as never)
    await expect(getKatex()).resolves.toBe(replacementKatex)
  })

  it('discards an in-flight legacy load after a canonical change', async () => {
    const legacyKatex = { renderToString: vi.fn() }
    const canonicalKatex = {
      render: vi.fn(),
      renderToString: vi.fn(),
    }
    let resolveLegacy!: (value: typeof legacyKatex) => void
    const legacyPromise = new Promise<typeof legacyKatex>((resolve) => {
      resolveLegacy = resolve
    })
    setKatexLoader(() => legacyPromise)

    const pending = getKatex()
    katexRuntime.setLoader(() => canonicalKatex as never)
    resolveLegacy(legacyKatex)

    await expect(pending).resolves.toBe(canonicalKatex)
  })

  it('retries failed legacy Mermaid initialization', async () => {
    const initialize = vi.fn()
      .mockImplementationOnce(() => {
        throw new Error('not ready')
      })
    setMermaidLoader(() => ({
      initialize,
      render: vi.fn(),
    }))

    await getMermaid({ securityLevel: 'strict' })
    await getMermaid({ securityLevel: 'strict' })

    expect(initialize).toHaveBeenCalledTimes(2)
  })

  it('retries transient legacy D2 loader failures', async () => {
    class LegacyD2 {}
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('not ready'))
      .mockResolvedValue({ D2: LegacyD2 })
    setD2Loader(loader)

    await expect(getCompatibleD2()).resolves.toBeNull()
    await expect(getCompatibleD2()).resolves.toBe(LegacyD2)
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
