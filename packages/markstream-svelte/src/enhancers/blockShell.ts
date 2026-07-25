import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { copyTextToClipboard } from '../utils/rendering/clipboard'

export type EnhancedBlockKind = 'code' | 'd2' | 'infographic' | 'mermaid'

export interface EnhancedBlockShell {
  wrapper: HTMLDivElement
  body: HTMLDivElement
}

export function createEnhancedBlockShell(
  kind: EnhancedBlockKind,
  label: string,
  source: string,
  showSourceDetails: boolean,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
  shellOptions: { showHeader?: boolean } = {},
): EnhancedBlockShell {
  const wrapper = document.createElement('div')
  wrapper.className = `markstream-svelte-enhanced-block markstream-svelte-enhanced-block--${kind}`

  if (shellOptions.showHeader !== false) {
    const header = document.createElement('div')
    header.className = 'markstream-svelte-enhanced-block__header'

    const badge = document.createElement('span')
    badge.className = 'markstream-svelte-enhanced-block__badge'
    badge.textContent = label

    header.appendChild(badge)
    header.appendChild(createHeaderActions(source, options, lifecycle))
    wrapper.appendChild(header)
  }

  const body = document.createElement('div')
  body.className = 'markstream-svelte-enhanced-block__body'
  wrapper.appendChild(body)

  if (showSourceDetails) {
    const details = document.createElement('details')
    details.className = 'markstream-svelte-enhanced-block__details'

    const summary = document.createElement('summary')
    summary.textContent = 'Source'
    details.appendChild(summary)

    const sourcePre = document.createElement('pre')
    sourcePre.className = 'markstream-svelte-enhanced-block__source'
    const code = document.createElement('code')
    code.textContent = source
    sourcePre.appendChild(code)
    details.appendChild(sourcePre)

    wrapper.appendChild(details)
  }

  return { wrapper, body }
}

function createHeaderActions(
  source: string,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): HTMLDivElement {
  const actions = document.createElement('div')
  actions.className = 'markstream-svelte-enhanced-block__actions'

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'markstream-svelte-enhanced-block__action'
  copyButton.textContent = 'Copy'
  if (options.showTooltips !== false)
    copyButton.title = 'Copy source'

  function handleCopy() {
    void copyTextToClipboard(source)
    options.onCopy?.(source)
  }
  copyButton.addEventListener('click', handleCopy)
  lifecycle.register(() => copyButton.removeEventListener('click', handleCopy))

  actions.appendChild(copyButton)
  return actions
}
