import { describe, expect, it, vi } from 'vitest'
import {
  createModuleWorkerFromSource,
  WORKER_ERROR_MESSAGE_SOURCE,
} from '../../src/workers/internal/cdnWorker'
import { createKaTeXBackpressureController } from '../../src/workers/internal/katexBackpressure'
import { createKaTeXRenderCache } from '../../src/workers/internal/katexRenderCache'
import { buildKaTeXCDNWorkerSource } from '../../src/workers/katexCdnWorker'
import { buildMermaidCDNWorkerSource } from '../../src/workers/mermaidCdnWorker'

describe('cdn worker helpers', () => {
  it('uses the shared error helper in generated worker sources', () => {
    const katexUrl = 'https://cdn.example.test/katex-"v".mjs'
    const mermaidUrl = 'https://cdn.example.test/mermaid-"v".mjs'
    const katexSource = buildKaTeXCDNWorkerSource({ katexUrl })
    const mermaidSource = buildMermaidCDNWorkerSource({ mermaidUrl })

    expect(katexSource).toContain(`import(${JSON.stringify(katexUrl)})`)
    expect(mermaidSource).toContain(`import(${JSON.stringify(mermaidUrl)})`)
    expect(katexSource).toContain(WORKER_ERROR_MESSAGE_SOURCE)
    expect(mermaidSource).toContain(WORKER_ERROR_MESSAGE_SOURCE)
  })

  it('returns an inert handle when workers are unavailable', () => {
    vi.stubGlobal('Worker', undefined)
    try {
      const handle = createModuleWorkerFromSource('self.onmessage = () => {}', undefined, undefined)

      expect(handle.worker).toBeNull()
      handle.dispose()
    }
    finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('kaTeX worker state helpers', () => {
  it('separates display modes and evicts the oldest cache entry', () => {
    const cache = createKaTeXRenderCache(2)
    cache.set('x', true, 'display')
    cache.set('x', false, 'inline')
    cache.set('y', true, 'next')

    expect(cache.get('x', true)).toBeUndefined()
    expect(cache.get('x', false)).toBe('inline')
    expect(cache.get('y', true)).toBe('next')
  })

  it('normalizes defaults and caps per-call retries', () => {
    const controller = createKaTeXBackpressureController(() => true)
    controller.setDefaults({
      timeout: -1,
      waitTimeout: 10.9,
      backoffMs: 4.8,
      maxRetries: 3.9,
    })

    expect(controller.getDefaults()).toEqual({
      timeout: 0,
      waitTimeout: 10,
      backoffMs: 4,
      maxRetries: 3,
    })
    expect(controller.resolveOptions({ maxRetries: 99 }).maxRetries).toBe(8)
  })
})
