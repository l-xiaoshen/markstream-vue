import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { renderD2Svg } from '../utils/rendering/d2'
import { createEnhancedBlockShell } from './blockShell'
import {
  getParentPreElement,
  queryHtmlElements,
  replacePreElement,
} from './dom'

export async function enhanceD2(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): Promise<void> {
  const darkThemeId = options.d2Props?.darkThemeId !== undefined
    ? options.d2Props.darkThemeId
    : options.d2DarkThemeId
  const themeId = options.d2Props?.themeId !== undefined
    ? options.d2Props.themeId
    : options.d2ThemeId
  const codeNodes = queryHtmlElements(
    root,
    'pre[data-markstream-code-block="1"] > code.language-d2, pre[data-markstream-code-block="1"] > code.language-d2lang',
  )
  for (const codeNode of codeNodes) {
    if (!lifecycle.isActive())
      return
    const pre = getParentPreElement(codeNode)
    const source = codeNode.textContent || ''
    if (!pre || !source.trim())
      continue

    const shell = createEnhancedBlockShell(
      'd2',
      'D2',
      source,
      true,
      options,
      lifecycle,
      {
        showHeader: options.d2Props?.showHeader !== false,
      },
    )
    const replacement = replacePreElement(pre, shell.wrapper)
    if (!replacement)
      continue
    lifecycle.register(replacement)

    try {
      const safeSvg = await renderD2Svg({
        ...(darkThemeId === undefined
          ? {}
          : { darkThemeId }),
        isDark: options.isDark === true,
        source,
        ...(themeId === undefined
          ? {}
          : { themeId }),
      })
      if (!lifecycle.isActive())
        return
      shell.body.innerHTML = safeSvg
      shell.wrapper.dataset.markstreamD2 = '1'
    }
    catch {
      replacement.restore()
    }
  }
}
