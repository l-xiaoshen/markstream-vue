/// <reference lib="webworker" />

import type {
  MermaidWorkerCanParseResponse,
  MermaidWorkerErrorResponse,
  MermaidWorkerFindPrefixResponse,
  MermaidWorkerResponse,
  MermaidWorkerTheme,
} from '../types/runtimeWorkers'
import mermaid from 'mermaid'
import { toErrorMessage } from '../types/runtimeErrors'
import { isMermaidWorkerRequest } from './internal/workerProtocol'

declare const self: DedicatedWorkerGlobalScope

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', flowchart: { htmlLabels: false } })

function applyThemeTo(code: string, theme: MermaidWorkerTheme) {
  const themeValue = theme === 'dark' ? 'dark' : 'default'
  const themeConfig = `%%{init: {"theme": "${themeValue}"}}%%\n`
  const trimmed = code.trimStart()
  if (trimmed.startsWith('%%{'))
    return code
  return themeConfig + code
}

function findHeaderIndex(lines: string[]) {
  const headerRe = /^(?:graph|flowchart|flowchart\s+tb|flowchart\s+lr|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|pie|quadrantChart|timeline|xychart(?:-beta)?)\b/
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ''
    if (!line || line.startsWith('%%'))
      continue
    if (headerRe.test(line))
      return index
  }
  return -1
}

async function canParse(code: string, theme: MermaidWorkerTheme) {
  const themed = applyThemeTo(code, theme)
  await mermaid.parse(themed)
  return true
}

async function findLastRenderablePrefix(baseCode: string, theme: MermaidWorkerTheme) {
  const lines = baseCode.split('\n')
  const headerIndex = findHeaderIndex(lines)
  if (headerIndex === -1)
    return null

  const head = lines.slice(0, headerIndex + 1)
  await canParse(head.join('\n'), theme)

  let low = headerIndex + 1
  let high = lines.length
  let lastGood = headerIndex + 1
  let tries = 0
  const maxTries = 12

  while (low <= high && tries < maxTries) {
    const mid = Math.floor((low + high) / 2)
    const candidate = [...head, ...lines.slice(headerIndex + 1, mid)].join('\n')
    tries += 1
    try {
      await canParse(candidate, theme)
      lastGood = mid
      low = mid + 1
    }
    catch {
      high = mid - 1
    }
  }

  return [...head, ...lines.slice(headerIndex + 1, lastGood)].join('\n')
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  const message = event.data
  if (!isMermaidWorkerRequest(message))
    return
  if (message.type === 'init')
    return

  const send = (response: MermaidWorkerResponse) => self.postMessage(response)

  try {
    if (message.action === 'canParse') {
      const response: MermaidWorkerCanParseResponse = {
        type: 'result',
        action: 'canParse',
        id: message.id,
        ok: true,
        result: await canParse(message.payload.code, message.payload.theme),
      }
      send(response)
      return
    }

    const response: MermaidWorkerFindPrefixResponse = {
      type: 'result',
      action: 'findPrefix',
      id: message.id,
      ok: true,
      result: await findLastRenderablePrefix(message.payload.code, message.payload.theme),
    }
    send(response)
  }
  catch (error: unknown) {
    const response: MermaidWorkerErrorResponse = {
      type: 'error',
      action: message.action,
      id: message.id,
      ok: false,
      error: toErrorMessage(error),
    }
    send(response)
  }
}

export {}
