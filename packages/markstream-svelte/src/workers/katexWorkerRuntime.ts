import type {
  BackpressureOptions,
  KaTeXBackpressureDefaults,
} from './katexWorkerTypes'
import { createKaTeXWorkerClient } from './katexWorkerClient'

const workerClient = createKaTeXWorkerClient()

export function setKaTeXWorker(worker: Worker) {
  workerClient.setWorker(worker)
}

export function clearKaTeXWorker() {
  workerClient.clearWorker()
}

export function setKaTeXWorkerDebug(enabled: boolean) {
  workerClient.setDebug(enabled)
}

export async function renderKaTeXInWorker(
  content: string,
  displayMode = true,
  timeout = 2000,
  signal?: AbortSignal,
): Promise<string> {
  return await workerClient.render(content, displayMode, timeout, signal)
}

export function setKaTeXCache(
  content: string,
  displayMode = true,
  html: string,
) {
  workerClient.setCache(content, displayMode, html)
}

export function getKaTeXWorkerLoad() {
  return workerClient.getLoad()
}

export function setKaTeXWorkerMaxConcurrency(value: number) {
  workerClient.setMaxConcurrency(value)
}

export function isKaTeXWorkerBusy() {
  return workerClient.isBusy()
}

export function waitForKaTeXWorkerSlot(
  timeout = 2000,
  signal?: AbortSignal,
): Promise<void> {
  return workerClient.waitForSlot(timeout, signal)
}

export function setKaTeXBackpressureDefaults(
  options: Partial<KaTeXBackpressureDefaults>,
) {
  workerClient.setBackpressureDefaults(options)
}

export function getKaTeXBackpressureDefaults() {
  return workerClient.getBackpressureDefaults()
}

export async function renderKaTeXWithBackpressure(
  content: string,
  displayMode = true,
  options: BackpressureOptions = {},
): Promise<string> {
  return await workerClient.renderWithBackpressure(content, displayMode, options)
}
