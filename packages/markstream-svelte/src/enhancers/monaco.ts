import type { MonacoRuntimeHelpers } from '../optional/monaco'
import type { EnhancementLifecycle, EnhanceRenderedHtmlOptions } from './types'
import { monacoRuntime } from '../optional/monaco'
import { resolveMonacoLanguageId } from '../utils/language'
import {
  createMonacoThemeList,
  getMonacoThemeName,
  resolveMonacoOptions,
} from '../utils/monacoOptions'
import { decodeDataPayload } from '../utils/rendering/base64'
import { createEnhancedBlockShell } from './blockShell'
import {
  isHtmlPreElement,
  queryHtmlElements,
  replacePreElement,
  waitForRenderFrame,
} from './dom'

export async function enhanceMonaco(
  root: HTMLElement,
  options: EnhanceRenderedHtmlOptions,
  lifecycle: EnhancementLifecycle,
): Promise<void> {
  const codeBlockProps = options.codeBlockProps
  const monacoOptions = {
    ...(options.monacoOptions ?? {}),
    ...(codeBlockProps?.monacoOptions ?? {}),
  }
  const themes = createMonacoThemeList(
    codeBlockProps?.darkTheme,
    codeBlockProps?.lightTheme,
    codeBlockProps?.themes,
  )
  const monacoModule = await monacoRuntime.get()
  if (!monacoModule || !lifecycle.isActive())
    return

  const preNodes = queryHtmlElements(
    root,
    'pre[data-markstream-code-block="1"]',
  ).filter(isHtmlPreElement)
  for (const pre of preNodes) {
    if (!lifecycle.isActive())
      return
    const codeNode = queryHtmlElements(pre, 'code')[0]
    if (!codeNode)
      continue

    const rawLanguage = resolveCodeLanguage(pre, codeNode)
    const normalizedLanguage = rawLanguage.trim().toLowerCase()
    if (
      normalizedLanguage === 'mermaid'
      || normalizedLanguage === 'infographic'
      || normalizedLanguage === 'd2'
      || normalizedLanguage === 'd2lang'
    ) {
      continue
    }

    const source = codeNode.textContent || ''
    const diff = pre.dataset.markstreamDiff === '1'
    const updatedCode = decodeDataPayload(pre.dataset.markstreamUpdated)
    const monacoLanguage = resolveMonacoLanguageId(rawLanguage)
    const shell = createEnhancedBlockShell(
      'code',
      diff ? `Diff / ${monacoLanguage}` : `Code / ${monacoLanguage}`,
      source,
      false,
      options,
      lifecycle,
      {
        showHeader: options.codeBlockProps?.showHeader !== false,
      },
    )
    shell.body.classList.add('markstream-svelte-enhanced-block__body--code')
    shell.body.style.minHeight = `${estimateCodeBlockHeight(diff ? updatedCode || source : source, diff)}px`
    const replacement = replacePreElement(pre, shell.wrapper)
    if (!replacement)
      continue
    lifecycle.register(replacement)

    let helpers: MonacoRuntimeHelpers | null = null
    let editorCleaned = false
    const cleanupEditor = () => {
      if (editorCleaned)
        return
      editorCleaned = true
      try {
        helpers?.cleanupEditor()
      }
      catch {
        // Ignore cleanup failures during fallback.
      }
    }
    lifecycle.register(cleanupEditor)

    try {
      helpers = monacoModule.useMonaco({
        ...resolveMonacoOptions({
          options: monacoOptions,
          themes,
          fontSize: monacoOptions.fontSize ?? 13,
          expanded: false,
          diff,
          streaming: false,
        }),
        languages: Array.from(new Set([monacoLanguage, 'plaintext'])),
        wordWrap: 'off',
      })
      if (diff) {
        await helpers.createDiffEditor(
          shell.body,
          source,
          updatedCode,
          monacoLanguage,
        )
        helpers.refreshDiffPresentation()
      }
      else {
        await helpers.createEditor(
          shell.body,
          source,
          monacoLanguage,
        )
      }
      if (!lifecycle.isActive()) {
        cleanupEditor()
        replacement.restore()
        return
      }

      await helpers.setTheme(getMonacoThemeName(
        options.isDark
          ? codeBlockProps?.darkTheme
          : codeBlockProps?.lightTheme,
        options.isDark ? 'vitesse-dark' : 'vitesse-light',
      ))
      if (!lifecycle.isActive()) {
        cleanupEditor()
        replacement.restore()
        return
      }
      await waitForRenderFrame()
      if (!hasVisibleMonacoContent(shell.body, source))
        throw new Error('Monaco editor rendered no visible code content.')

      shell.wrapper.dataset.markstreamMonaco = '1'
      if (diff)
        shell.wrapper.dataset.markstreamMonacoDiff = '1'
    }
    catch {
      cleanupEditor()
      replacement.restore()
    }
  }
}

function resolveCodeLanguage(pre: HTMLElement, codeNode: HTMLElement): string {
  const explicit = pre.dataset.markstreamLanguage?.trim()
  if (explicit)
    return explicit

  const languageClass = Array.from(codeNode.classList)
    .find(className => className.startsWith('language-'))
  return languageClass ? languageClass.slice('language-'.length) : 'plaintext'
}

function estimateCodeBlockHeight(source: string, diff: boolean): number {
  const lineCount = Math.max(1, source.split('\n').length)
  const perLine = diff ? 20 : 18
  const base = diff ? 180 : 96
  return Math.min(520, base + lineCount * perLine)
}

function hasVisibleMonacoContent(body: HTMLElement, source: string): boolean {
  const editor = queryHtmlElements(body, '.monaco-editor')[0]
  if (!editor)
    return false

  const rect = editor.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0)
    return false

  const expected = source.split('\n').find(line => line.trim())?.trim()
  if (!expected)
    return true

  const normalizedVisible = normalizeVisibleCodeText(body.textContent || '')
  const normalizedExpected = normalizeVisibleCodeText(expected)
  return normalizedVisible.includes(normalizedExpected)
}

function normalizeVisibleCodeText(value: string): string {
  return value.replace(/\s+/g, '')
}
