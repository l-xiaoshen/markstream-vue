import type {
  EnhancementLifecycle,
  EnhanceRenderedHtmlOptions,
  RenderedHtmlEnhancementHandle,
} from './enhancers/types'
import { enhanceD2 } from './enhancers/d2'
import { enhanceInfographic } from './enhancers/infographic'
import { enhanceInteractions } from './enhancers/interactions'
import { enhanceKatex } from './enhancers/katex'
import { createEnhancementLifecycle } from './enhancers/lifecycle'
import { enhanceMermaid } from './enhancers/mermaid'
import { enhanceMonaco } from './enhancers/monaco'

// Security invariants delegated to enhancers/mermaid:
// toSafeMermaidSvgMarkup(svg)
// options.mermaidProps?.enableMermaidInteractions === true

export type {
  EnhanceRenderedHtmlOptions,
  RenderedHtmlEnhancementHandle,
} from './enhancers/types'

export interface RenderedHtmlEnhancer {
  enhance: (
    root: HTMLElement,
    options?: EnhanceRenderedHtmlOptions,
  ) => Promise<RenderedHtmlEnhancementHandle>
  dispose: (root: HTMLElement | null | undefined) => void
}

export function createRenderedHtmlEnhancer(): RenderedHtmlEnhancer {
  const rootHandles = new WeakMap<HTMLElement, RenderedHtmlEnhancementHandle>()

  function dispose(root: HTMLElement | null | undefined): void {
    if (root)
      rootHandles.get(root)?.dispose()
  }

  async function enhance(
    root: HTMLElement,
    options: EnhanceRenderedHtmlOptions = {},
  ): Promise<RenderedHtmlEnhancementHandle> {
    dispose(root)

    const lifecycle: EnhancementLifecycle = createEnhancementLifecycle(options.isCancelled, () => {
      if (rootHandles.get(root) === lifecycle)
        rootHandles.delete(root)
    })
    rootHandles.set(root, lifecycle)

    if (!lifecycle.isActive())
      return lifecycle

    await enhanceKatex(root, lifecycle)
    if (!lifecycle.isActive())
      return lifecycle

    await enhanceMermaid(root, options, lifecycle)
    if (!lifecycle.isActive())
      return lifecycle

    if (options.final !== false) {
      await enhanceInfographic(root, options, lifecycle)
      if (!lifecycle.isActive())
        return lifecycle

      await enhanceD2(root, options, lifecycle)
      if (!lifecycle.isActive())
        return lifecycle

      if (!options.renderCodeBlocksAsPre)
        await enhanceMonaco(root, options, lifecycle)
      if (!lifecycle.isActive())
        return lifecycle
    }

    enhanceInteractions(root, options, lifecycle)
    return lifecycle
  }

  return { enhance, dispose }
}

const defaultRenderedHtmlEnhancer = createRenderedHtmlEnhancer()

export async function enhanceRenderedHtml(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions = {},
): Promise<RenderedHtmlEnhancementHandle> {
  return await defaultRenderedHtmlEnhancer.enhance(root, options)
}

export function disposeRenderedHtmlEnhancements(
  root: HTMLElement | null | undefined,
): void {
  defaultRenderedHtmlEnhancer.dispose(root)
}
