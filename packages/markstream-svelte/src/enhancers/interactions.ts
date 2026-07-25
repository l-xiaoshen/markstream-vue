import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { hideTooltip, showTooltipForAnchor } from '../tooltip/singletonTooltip'
import { queryHtmlElements } from './dom'

export function enhanceInteractions(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): void {
  enhanceFootnotes(root, lifecycle)
  enhanceTooltips(root, options, lifecycle)
}

function enhanceTooltips(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): void {
  if (options.showTooltips === false)
    return

  const targets = queryHtmlElements(root, '[data-markstream-tooltip], [title]')
  for (const target of targets) {
    if (target.matches('.footnote-link, .footnote-anchor'))
      continue

    const title = target.getAttribute('title')
    const text = (target.dataset.markstreamTooltip || title || '').trim()
    if (!text)
      continue

    if (title != null)
      target.removeAttribute('title')

    const show = () => showTooltipForAnchor(target, text, 'top', false, undefined, options.isDark)
    const hide = () => hideTooltip()

    target.addEventListener('mouseenter', show)
    target.addEventListener('focus', show)
    target.addEventListener('mouseleave', hide)
    target.addEventListener('blur', hide)

    lifecycle.register(() => {
      const ownsVisibleTooltip = target.getAttribute('aria-describedby') != null
      target.removeEventListener('mouseenter', show)
      target.removeEventListener('focus', show)
      target.removeEventListener('mouseleave', hide)
      target.removeEventListener('blur', hide)
      if (ownsVisibleTooltip)
        hideTooltip(true)
      if (title != null && target.getAttribute('title') == null)
        target.setAttribute('title', title)
    })
  }
}

function enhanceFootnotes(
  root: HTMLElement,
  lifecycle: EnhancementLifecycle,
): void {
  const links = queryHtmlElements(
    root,
    '.footnote-reference .footnote-link[href^="#"]',
  )
  for (const link of links) {
    const handleClick = (event: MouseEvent) => {
      const href = link.getAttribute('href')
      if (!href)
        return
      event.preventDefault()
      const target = document.getElementById(href.slice(1))
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    link.addEventListener('click', handleClick)
    lifecycle.register(() => link.removeEventListener('click', handleClick))
  }
}
