import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { infographicRuntime } from '../optional/infographic'
import { renderInfographicSource } from '../utils/rendering/infographic'
import { createEnhancedBlockShell } from './blockShell'
import {
  getParentPreElement,
  queryHtmlElements,
  replacePreElement,
} from './dom'

export async function enhanceInfographic(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): Promise<void> {
  const codeNodes = queryHtmlElements(
    root,
    'pre[data-markstream-code-block="1"] > code.language-infographic',
  )
  if (codeNodes.length === 0)
    return

  const InfographicClass = await infographicRuntime.get()
  if (!InfographicClass || !lifecycle.isActive())
    return

  for (const codeNode of codeNodes) {
    if (!lifecycle.isActive())
      return
    const pre = getParentPreElement(codeNode)
    const source = codeNode.textContent || ''
    if (!pre || !source.trim())
      continue

    const shell = createEnhancedBlockShell(
      'infographic',
      'Infographic',
      source,
      true,
      options,
      lifecycle,
      {
        showHeader: options.infographicProps?.showHeader !== false,
      },
    )
    shell.body.style.minHeight = '320px'
    shell.body.style.height = '360px'
    const replacement = replacePreElement(pre, shell.wrapper)
    if (!replacement)
      continue
    lifecycle.register(replacement)

    try {
      const instance = renderInfographicSource({
        container: shell.body,
        renderer: InfographicClass,
        source,
      })
      let frameId: number | null = null
      lifecycle.register(() => {
        if (frameId != null && typeof window !== 'undefined')
          window.cancelAnimationFrame(frameId)
        instance.destroy()
      })
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        frameId = window.requestAnimationFrame(() => {
          const actualHeight = shell.body.scrollHeight
          if (actualHeight > 0)
            shell.body.style.height = `${Math.min(Math.max(actualHeight, 260), 720)}px`
        })
      }

      shell.wrapper.dataset.markstreamInfographic = '1'
    }
    catch {
      replacement.restore()
    }
  }
}
