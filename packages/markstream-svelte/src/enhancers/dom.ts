import type { Disposable } from './types'
import { readProperty } from '../utils/runtimeValue'

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

export interface RestorablePreReplacement extends Disposable {
  restore: () => void
}

export function queryHtmlElements(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector)).filter(isHtmlElement)
}

export function getParentPreElement(element: HTMLElement): HTMLPreElement | null {
  const parent = element.parentElement
  return parent && isHtmlPreElement(parent) ? parent : null
}

export function replacePreElement(
  pre: HTMLPreElement,
  replacement: HTMLElement,
): RestorablePreReplacement | null {
  const original = clonePreElement(pre)
  if (!original)
    return null

  let restored = false
  pre.replaceWith(replacement)
  return {
    restore: () => {
      if (restored)
        return
      restored = true
      if (replacement.isConnected)
        replacement.replaceWith(original)
    },
    dispose: () => {
      if (restored)
        return
      restored = true
      const clonedOriginal = clonePreElement(original)
      if (replacement.isConnected && clonedOriginal)
        replacement.replaceWith(clonedOriginal)
    },
  }
}

export function isHtmlElement(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE
}

export function isHtmlPreElement(node: Node): node is HTMLPreElement {
  return 'localName' in node
    && node.localName === 'pre'
    && 'namespaceURI' in node
    && node.namespaceURI === HTML_NAMESPACE
}

export function readErrorCode(error: unknown): string {
  return readStringProperty(error, 'code')
    || readStringProperty(error, 'name')
    || (error instanceof Error ? error.name : '')
}

export function readBooleanProperty(value: unknown, key: string): boolean | undefined {
  const property = readProperty(value, key)
  return typeof property === 'boolean' ? property : undefined
}

export function isAbortError(error: unknown): boolean {
  return readErrorCode(error) === 'AbortError'
}

export function withTimeout<T>(run: () => Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0)
    return run()

  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = globalThis.setTimeout(() => {
      if (settled)
        return
      settled = true
      reject(new Error('Operation timed out'))
    }, timeoutMs)

    run()
      .then((value) => {
        if (settled)
          return
        settled = true
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        if (settled)
          return
        settled = true
        clearTimeout(timer)
        reject(error)
      })
  })
}

export async function waitForRenderFrame(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function')
    return
  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
}

function clonePreElement(pre: HTMLPreElement): HTMLPreElement | null {
  const cloned = pre.cloneNode(true)
  return isHtmlPreElement(cloned) ? cloned : null
}

function readStringProperty(value: unknown, key: string): string {
  const property = readProperty(value, key)
  return typeof property === 'string' ? property : ''
}
