import type { D2Constructor, D2Loader } from './d2'
import type { KatexLoader } from './katex'
import type {
  LegacyKatexModule,
  LegacyMermaidModule,
} from './legacyState'
import type {
  MermaidInitConfig,
  MermaidLoader,
} from './mermaid'
import { d2Runtime } from './d2'
import { katexRuntime } from './katex'
import {
  getCompatibleKatex,
  getCompatibleMermaid,
  isCompatibleD2Enabled,
  isCompatibleKatexEnabled,
  isCompatibleMermaidEnabled,
  setLegacyD2Loader,
  setLegacyKatexLoader,
  setLegacyMermaidLoader,
} from './legacyState'
import { mermaidRuntime } from './mermaid'
import {
  monacoRuntime,
  resetMonacoRuntimeReadyForTest,
} from './monaco'

type LegacyLoader = () => unknown | Promise<unknown>
type LegacyMermaidInitConfig = Record<string, unknown> & {
  flowchart?: (Record<string, unknown> & { htmlLabels?: unknown }) | undefined
  securityLevel?: unknown
}

const GLOBAL_MERMAID_KEY = '__MARKSTREAM_ANGULAR_MERMAID__'
let legacyGlobalMermaid: LegacyMermaidModule | null = null
let legacyMermaidInitKey: string | null = null
let legacyMermaidSource: unknown

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
}

function bindFunction(value: unknown, owner: unknown): ((...args: unknown[]) => unknown) | undefined {
  return typeof value === 'function' ? value.bind(owner) : undefined
}

function resolveDefaultExport(value: unknown): unknown {
  return asRecord(value)?.default ?? value
}

function adaptLegacyLoader<T>(
  loader: LegacyLoader,
  normalize: (value: unknown) => T,
): () => Promise<T> {
  return async () => normalize(await loader())
}

function normalizeLegacyD2(value: unknown): D2Constructor {
  const moduleRecord = asRecord(value)
  const directD2 = moduleRecord?.D2
  if (typeof directD2 === 'function')
    return directD2 as D2Constructor

  const candidate = resolveDefaultExport(value)
  if (typeof candidate === 'function')
    return candidate as D2Constructor

  const candidateRecord = asRecord(candidate)
  const nestedD2 = candidateRecord?.D2
  if (typeof nestedD2 === 'function')
    return nestedD2 as D2Constructor

  if (candidateRecord && typeof candidateRecord.compile === 'function' && typeof candidateRecord.render === 'function') {
    const LegacyD2 = function legacyD2() {
      return candidateRecord
    }
    return LegacyD2 as unknown as D2Constructor
  }

  throw new TypeError('Legacy D2 loader did not return a D2 constructor or renderer.')
}

function normalizeLegacyKatex(value: unknown): LegacyKatexModule {
  const candidate = resolveDefaultExport(value)
  if (typeof asRecord(candidate)?.renderToString === 'function')
    return candidate as LegacyKatexModule
  throw new TypeError('Legacy KaTeX loader did not return a KaTeX module.')
}

function normalizeLegacyMermaid(value: unknown): LegacyMermaidModule {
  const candidate = resolveDefaultExport(value)
  const candidateRecord = asRecord(candidate)
  if (
    typeof candidateRecord?.render === 'function'
    && typeof candidateRecord.initialize === 'function'
  ) {
    return candidate as LegacyMermaidModule
  }
  const api = asRecord(candidateRecord?.mermaidAPI)
  const render = bindFunction(candidateRecord?.render, candidate)
    ?? bindFunction(api?.render, api)
  if (candidateRecord && render) {
    return {
      ...candidateRecord,
      initialize: bindFunction(candidateRecord.initialize, candidate)
        ?? bindFunction(api?.initialize, api)
        ?? (() => undefined),
      parse: bindFunction(candidateRecord.parse, candidate)
        ?? bindFunction(api?.parse, api),
      render,
    } as unknown as LegacyMermaidModule
  }

  const nestedMermaid = asRecord(value)?.mermaid
  if (nestedMermaid !== undefined && nestedMermaid !== value)
    return normalizeLegacyMermaid(nestedMermaid)

  throw new TypeError('Legacy Mermaid loader did not return a Mermaid module.')
}

function getGlobalValue(key: string): unknown {
  try {
    return (globalThis as Record<string, unknown>)[key]
  }
  catch {
    return undefined
  }
}

function resetLegacyMermaidState(): void {
  legacyGlobalMermaid = null
  legacyMermaidInitKey = null
  legacyMermaidSource = undefined
  try {
    delete (globalThis as Record<string, unknown>)[GLOBAL_MERMAID_KEY]
  }
  catch {
    // Some hosts expose a sealed global object.
  }
}

function computeLegacyMermaidInitKey(config: LegacyMermaidInitConfig): string {
  const securityLevel = String(config.securityLevel ?? 'strict')
  const htmlLabels = config.flowchart?.htmlLabels
  return `${securityLevel}|htmlLabels:${htmlLabels === false ? '0' : '1'}`
}

function initializeLegacyMermaid(
  instance: LegacyMermaidModule,
  config?: LegacyMermaidInitConfig,
): void {
  if (!config)
    return
  const key = computeLegacyMermaidInitKey(config)
  if (instance === legacyGlobalMermaid && key === legacyMermaidInitKey)
    return
  try {
    instance.initialize?.({
      suppressErrorRendering: true,
      ...config,
    })
    legacyGlobalMermaid = instance
    legacyMermaidInitKey = key
  }
  catch {
    // Mermaid can reject repeat initialization while remaining usable.
  }
}

/** @deprecated Use `d2Runtime.enable()` instead. */
export function enableD2(loader?: D2Loader): void {
  if (loader) {
    setLegacyD2Loader(adaptLegacyLoader(loader, normalizeLegacyD2))
    return
  }
  setLegacyD2Loader(undefined)
  d2Runtime.enable()
}

/** @deprecated Use `d2Runtime.disable()` instead. */
export function disableD2(): void {
  d2Runtime.disable()
  setLegacyD2Loader(null)
}

/** @deprecated Use `d2Runtime.isEnabled()` instead. */
export const isD2Enabled = isCompatibleD2Enabled

/** @deprecated Use `d2Runtime.setLoader()` instead. */
export function setD2Loader(loader: D2Loader | null): void {
  if (loader) {
    setLegacyD2Loader(adaptLegacyLoader(loader, normalizeLegacyD2))
    return
  }
  d2Runtime.disable()
  setLegacyD2Loader(null)
}

/** @deprecated Use `katexRuntime.enable()` instead. */
export function enableKatex(loader?: KatexLoader): void {
  if (loader) {
    setLegacyKatexLoader(adaptLegacyLoader(loader, normalizeLegacyKatex))
    return
  }
  setLegacyKatexLoader(undefined)
  katexRuntime.enable()
}

/** @deprecated Use `katexRuntime.disable()` instead. */
export function disableKatex(): void {
  katexRuntime.disable()
  setLegacyKatexLoader(null)
}

/** @deprecated Use `katexRuntime.get()` instead. */
export async function getKatex(): Promise<LegacyKatexModule | null> {
  const globalKatex = getGlobalValue('katex')
  if (globalKatex !== undefined) {
    try {
      return normalizeLegacyKatex(globalKatex)
    }
    catch {
      // Fall through to the configured runtime loader.
    }
  }
  return getCompatibleKatex()
}

/** @deprecated Use `katexRuntime.isEnabled()` instead. */
export const isKatexEnabled = isCompatibleKatexEnabled

/** @deprecated Use `katexRuntime.setLoader()` instead. */
export function setKatexLoader(loader: KatexLoader | null): void {
  if (loader) {
    setLegacyKatexLoader(adaptLegacyLoader(loader, normalizeLegacyKatex))
    return
  }
  katexRuntime.disable()
  setLegacyKatexLoader(null)
}

/** @deprecated Use `mermaidRuntime.enable()` instead. */
export function enableMermaid(loader?: MermaidLoader): void {
  resetLegacyMermaidState()
  if (loader) {
    setLegacyMermaidLoader(adaptLegacyLoader(loader, normalizeLegacyMermaid))
    return
  }
  setLegacyMermaidLoader(undefined)
  mermaidRuntime.enable()
}

/** @deprecated Use `mermaidRuntime.disable()` instead. */
export function disableMermaid(): void {
  resetLegacyMermaidState()
  mermaidRuntime.disable()
  setLegacyMermaidLoader(null)
}

/** @deprecated Use `mermaidRuntime.get()` instead. */
export async function getMermaid(
  initConfig?: LegacyMermaidInitConfig,
): Promise<LegacyMermaidModule | null> {
  const globalValue = getGlobalValue(GLOBAL_MERMAID_KEY) ?? getGlobalValue('mermaid')
  if (globalValue !== undefined) {
    try {
      const instance = globalValue === legacyMermaidSource && legacyGlobalMermaid
        ? legacyGlobalMermaid
        : normalizeLegacyMermaid(globalValue)
      if (globalValue !== legacyMermaidSource) {
        legacyGlobalMermaid = instance
        legacyMermaidInitKey = null
        legacyMermaidSource = globalValue
      }
      initializeLegacyMermaid(instance, initConfig)
      return instance
    }
    catch {
      // Fall through to the configured runtime loader.
    }
  }

  return getCompatibleMermaid(initConfig as MermaidInitConfig | undefined)
}

/** @deprecated Use `mermaidRuntime.isEnabled()` instead. */
export const isMermaidEnabled = isCompatibleMermaidEnabled

/** @deprecated Use `mermaidRuntime.setLoader()` instead. */
export function setMermaidLoader(loader: MermaidLoader | null): void {
  resetLegacyMermaidState()
  if (loader) {
    setLegacyMermaidLoader(adaptLegacyLoader(loader, normalizeLegacyMermaid))
    return
  }
  mermaidRuntime.disable()
  setLegacyMermaidLoader(null)
}

/** @deprecated Use `monacoRuntime.preload()` instead. */
export const preloadCodeBlockRuntime = monacoRuntime.preload

/** @deprecated Use `monacoRuntime.isReady()` instead. */
export const isCodeBlockRuntimeReady = monacoRuntime.isReady

/** @deprecated This test helper is retained for compatibility only. */
export const resetCodeBlockRuntimeReadyForTest = resetMonacoRuntimeReadyForTest
