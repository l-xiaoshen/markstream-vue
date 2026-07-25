import type { MermaidWorkerTheme } from '../types/runtimeWorkers'
import { createMermaidWorkerClient } from './mermaidWorkerClient'

const workerClient = createMermaidWorkerClient()

export function setMermaidWorkerClientDebug(enabled: boolean) {
  workerClient.setDebug(enabled)
}

export function setMermaidWorkerMaxConcurrency(value: number) {
  workerClient.setMaxConcurrency(value)
}

export function getMermaidWorkerLoad() {
  return workerClient.getLoad()
}

export function setMermaidWorker(worker: Worker) {
  workerClient.setWorker(worker)
}

export function clearMermaidWorker() {
  workerClient.clearWorker()
}

export async function canParseOffthread(
  code: string,
  theme: MermaidWorkerTheme,
  timeout = 1400,
) {
  return await workerClient.canParse(code, theme, timeout)
}

export async function findPrefixOffthread(
  code: string,
  theme: MermaidWorkerTheme,
  timeout = 1400,
) {
  return await workerClient.findPrefix(code, theme, timeout)
}
