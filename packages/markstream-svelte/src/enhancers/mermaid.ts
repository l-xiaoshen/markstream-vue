import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { renderMermaidSvg } from '../utils/rendering/mermaid'
import { createEnhancedBlockShell } from './blockShell'
import {
  getParentPreElement,
  isAbortError,
  queryHtmlElements,
  replacePreElement,
} from './dom'

export async function enhanceMermaid(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): Promise<void> {
  const strictMode = options.mermaidProps?.isStrict !== false
  const codeNodes = queryHtmlElements(root, 'pre > code.language-mermaid')
  for (const codeNode of codeNodes) {
    if (!lifecycle.isActive())
      return
    const pre = getParentPreElement(codeNode)
    const source = (codeNode.textContent || '').trim()
    if (!pre || !source)
      continue

    const shell = createEnhancedBlockShell(
      'mermaid',
      'Mermaid',
      source,
      true,
      options,
      lifecycle,
      {
        showHeader: options.mermaidProps?.showHeader !== false,
      },
    )
    const replacement = replacePreElement(pre, shell.wrapper)
    if (!replacement)
      continue
    lifecycle.register(replacement)

    try {
      const rendered = await renderMermaidSvg({
        allowPrefix: true,
        fullRenderTimeoutMs: Number(
          options.mermaidProps?.fullRenderTimeoutMs ?? 4000,
        ),
        isStrict: strictMode,
        parseTimeoutMs: Number(options.mermaidProps?.parseTimeoutMs ?? 1800),
        progressive: options.final === false,
        renderTimeoutMs: Number(
          options.mermaidProps?.renderTimeoutMs ?? 2500,
        ),
        source,
        theme: options.isDark ? 'dark' : 'light',
        workerTimeoutMs: Number(
          options.mermaidProps?.workerTimeoutMs ?? 1400,
        ),
      }, {
        rethrowError: isAbortError,
      })
      if (!lifecycle.isActive())
        return
      if (rendered.kind === 'incomplete') {
        replacement.restore()
        continue
      }
      shell.body.innerHTML = rendered.svgMarkup
      shell.body.classList.add('markstream-svelte-mermaid')
      shell.wrapper.dataset.markstreamMermaid = '1'
      if (
        options.mermaidProps?.enableMermaidInteractions === true
        && rendered.bindFunctions
      ) {
        try {
          rendered.bindFunctions(shell.body)
        }
        catch {
          // Mermaid interactions are optional.
        }
      }
    }
    catch (error) {
      if (isAbortError(error))
        return
      replacement.restore()
    }
  }
}
