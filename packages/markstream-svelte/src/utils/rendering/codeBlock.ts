import type { CodeBlockNode } from 'stream-markdown-parser'
import type { Component } from 'svelte'
import DefaultLanguageIcon from '../../components/shared/DefaultLanguageIcon.svelte'
import HtmlLanguageIcon from '../../components/shared/HtmlLanguageIcon.svelte'
import JsonLanguageIcon from '../../components/shared/JsonLanguageIcon.svelte'
import MarkdownLanguageIcon from '../../components/shared/MarkdownLanguageIcon.svelte'
import TextLanguageIcon from '../../components/shared/TextLanguageIcon.svelte'
import {
  isLikelyIncompleteLanguageIdentifier,
  languageMap,
  normalizeLanguageIdentifier,
  resolveMonacoLanguageId,
} from '../language'
import { sanitizeClassToken } from './html'

const LANGUAGE_ICON_MAP: Record<string, Component> = {
  '': TextLanguageIcon,
  'html': HtmlLanguageIcon,
  'javascript': DefaultLanguageIcon,
  'json': JsonLanguageIcon,
  'jsx': DefaultLanguageIcon,
  'markdown': MarkdownLanguageIcon,
  'plain': TextLanguageIcon,
  'python': DefaultLanguageIcon,
  'shell': DefaultLanguageIcon,
  'svg': HtmlLanguageIcon,
  'tsx': DefaultLanguageIcon,
  'typescript': DefaultLanguageIcon,
}

const STREAMING_LANGUAGE_TOKENS = [
  'javascript',
  'plaintext',
  'shellscript',
  'typescript',
] as const

export function isStreamingLanguagePrefix(language: string): boolean {
  const token = language.trim().split(/\s+/)[0]?.split(':')[0]?.toLowerCase() ?? ''
  return token.length >= 3
    && STREAMING_LANGUAGE_TOKENS.some(candidate => (
      candidate !== token && candidate.startsWith(token)
    ))
}

export function resolveCodeBlockLanguage(language: string) {
  const raw = language.trim()
  const canonical = normalizeLanguageIdentifier(raw)
  const icon: Component = LANGUAGE_ICON_MAP[canonical] || DefaultLanguageIcon
  const monaco = resolveMonacoLanguageId(canonical || raw || 'plaintext')
  return {
    canonical,
    display: languageMap[canonical]
      || (raw ? raw.toUpperCase() : languageMap[''])
      || '',
    icon,
    monaco,
    preClass: sanitizeClassToken(raw || monaco),
    raw,
  }
}

export function resolveCodeBlockSource(node: CodeBlockNode) {
  return {
    code: node.diff ? (node.updatedCode ?? node.code) : node.code,
    diff: node.diff === true,
    originalCode: node.originalCode ?? '',
    updatedCode: node.updatedCode ?? '',
  }
}

export function shouldDeferCodeBlockLanguage(
  language: string,
  streaming: boolean,
  documentStreaming: boolean,
): boolean {
  return streaming
    && documentStreaming
    && (
      isLikelyIncompleteLanguageIdentifier(language)
      || isStreamingLanguagePrefix(language)
    )
}
