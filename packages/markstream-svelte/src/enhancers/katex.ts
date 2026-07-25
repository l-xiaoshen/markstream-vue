import type { EnhancementLifecycle } from './types'
import { renderKatexMarkup as renderSharedKatexMarkup } from '../utils/rendering/katex'
import { queryHtmlElements } from './dom'

export async function enhanceKatex(
  root: HTMLElement,
  lifecycle: EnhancementLifecycle,
): Promise<void> {
  const inlineNodes = queryHtmlElements(root, '.markstream-nested-math')
  for (const node of inlineNodes) {
    if (!lifecycle.isActive())
      return
    if (node.dataset.markstreamKatexManaged === '1')
      continue
    const source = readKatexSource(node, '.markstream-nested-math__source')
    const renderTarget = resolveKatexRenderTarget(node, '.markstream-nested-math__render')
    if (!source) {
      clearKatexMarkup(node, renderTarget)
      continue
    }
    if (
      node.dataset.markstreamKatex === '1'
      && node.dataset.markstreamKatexSource === source
      && hasRenderedKatex(node, '.markstream-nested-math__render')
    ) {
      continue
    }
    try {
      writeKatexMarkup(node, renderTarget, await renderKatexMarkup(source, node.dataset.display === 'block'))
      node.dataset.markstreamKatexSource = source
    }
    catch {
      clearKatexMarkup(node, renderTarget)
    }
  }

  const blockNodes = queryHtmlElements(root, '.markstream-nested-math-block')
  for (const node of blockNodes) {
    if (!lifecycle.isActive())
      return
    if (node.dataset.markstreamKatexManaged === '1')
      continue
    const source = readKatexSource(node, '.markstream-nested-math-block__source')
    const renderTarget = resolveKatexRenderTarget(node, '.markstream-nested-math-block__render')
    if (!source) {
      clearKatexMarkup(node, renderTarget, {
        renderedClass: 'markstream-nested-math-block--rendered',
      })
      continue
    }
    if (
      node.dataset.markstreamKatex === '1'
      && node.dataset.markstreamKatexSource === source
      && hasRenderedKatex(node, '.markstream-nested-math-block__render')
    ) {
      continue
    }
    try {
      writeKatexMarkup(node, renderTarget, await renderKatexMarkup(source, true), {
        renderedClass: 'markstream-nested-math-block--rendered',
      })
      node.dataset.markstreamKatexSource = source
    }
    catch {
      clearKatexMarkup(node, renderTarget, {
        renderedClass: 'markstream-nested-math-block--rendered',
      })
    }
  }
}

function readKatexSource(node: HTMLElement, selector: string): string {
  const sourceElement = node.querySelector(selector)
  return (sourceElement?.textContent || (!sourceElement ? node.textContent : '') || '').trim()
}

function resolveKatexRenderTarget(node: HTMLElement, selector: string): HTMLElement | null {
  return queryHtmlElements(node, selector)[0] ?? null
}

function hasRenderedKatex(node: HTMLElement, selector: string): boolean {
  const renderTarget = resolveKatexRenderTarget(node, selector)
  return !!(renderTarget || node).querySelector('.katex, .katex-display')
}

function writeKatexMarkup(
  node: HTMLElement,
  renderTarget: HTMLElement | null,
  markup: string,
  options: { renderedClass?: string } = {},
): void {
  if (renderTarget)
    renderTarget.innerHTML = markup
  else
    node.innerHTML = markup

  node.dataset.markstreamKatex = '1'
  if (options.renderedClass)
    node.classList.add(options.renderedClass)
}

function clearKatexMarkup(
  node: HTMLElement,
  renderTarget: HTMLElement | null,
  options: { renderedClass?: string } = {},
): void {
  if (renderTarget)
    renderTarget.innerHTML = ''
  delete node.dataset.markstreamKatex
  delete node.dataset.markstreamKatexSource
  if (options.renderedClass)
    node.classList.remove(options.renderedClass)
}

async function renderKatexMarkup(source: string, displayMode: boolean): Promise<string> {
  return await renderSharedKatexMarkup({
    displayMode,
    maxRetries: 0,
    source,
    throwOnError: false,
    timeout: 1500,
    waitTimeout: 0,
  })
}
