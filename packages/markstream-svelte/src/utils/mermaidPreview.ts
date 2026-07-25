import { getMermaidDiagramKind } from './diagramLayout'

export type MermaidTheme = 'light' | 'dark'

export function normalizeMermaidSource(source: string): string {
  return source
    .replace(/\]::([^:])/g, ']:::$1')
    .replace(/:::subgraphNode$/gm, '::subgraphNode')
}

export function applyMermaidTheme(
  source: string,
  theme: MermaidTheme,
): string {
  if (source.trimStart().startsWith('%%{'))
    return source
  const themeValue = theme === 'dark' ? 'dark' : 'default'
  return `%%{init: {"theme": "${themeValue}"}}%%\n${source}`
}

function isGanttTaskLine(rawLine: string): boolean {
  const line = rawLine.trim()
  if (!line || line.startsWith('%%'))
    return false
  if (
    /^(?:gantt|title|dateformat|axisformat|tickinterval|excludes|section|todaymarker|topaxis|weekday|weekend|acctitle|accdescr|accdescrmultiline)\b/i
      .test(line)
  ) {
    return false
  }
  return line.includes(':')
}

function getSafeGanttPreviewCandidate(source: string): string {
  const lines = source.split(/\r?\n/)
  if (!/\r?\n$/.test(source))
    lines.pop()

  while (lines.length > 0) {
    const last = lines.at(-1)?.trim()
    if (!last || last.startsWith('%%')) {
      lines.pop()
      continue
    }
    if (isGanttTaskLine(last))
      break
    lines.pop()
  }

  return lines.some(isGanttTaskLine) ? lines.join('\n') : ''
}

export function getSafeMermaidPrefixCandidate(source: string): string {
  if (getMermaidDiagramKind(source) === 'gantt')
    return getSafeGanttPreviewCandidate(source)

  const lines = source.split('\n')
  while (lines.length > 0) {
    const last = (lines.at(-1) ?? '').trimEnd()
    if (!last) {
      lines.pop()
      continue
    }

    const dangling = /^[-=~>|<\s]+$/.test(last.trim())
      || /(?:--|==|~~|->|<-|-\||-\)|-x|o-|\|-|\.-)\s*$/.test(last)
      || /[-|><]$/.test(last)
      || /(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt)\s*$/i
        .test(last)
    if (!dangling)
      break
    lines.pop()
  }
  return lines.join('\n').trim()
}

export function normalizeRenderedMermaidCode(source: string): string {
  return source.replace(/\s+/g, '')
}
