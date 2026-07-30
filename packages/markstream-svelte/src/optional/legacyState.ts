import type { OptionalPeerLoader } from '../runtime/optionalPeer'
import type { D2Constructor } from './d2'
import type { MermaidInitConfig } from './mermaid'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'
import { d2Runtime } from './d2'
import { katexRuntime } from './katex'
import { mermaidRuntime } from './mermaid'

export interface LegacyKatexModule {
  renderToString: (content: string, options?: Record<string, unknown>) => string
}

export type LegacyMermaidRenderResult = string | {
  bindFunctions?: ((element: Element) => unknown) | undefined
  svg?: string | undefined
}

export interface LegacyMermaidModule {
  initialize?: ((config?: Record<string, unknown>) => unknown) | undefined
  parse?: ((source: string) => Promise<unknown> | unknown) | undefined
  render: (
    id: string,
    source: string,
  ) => Promise<LegacyMermaidRenderResult> | LegacyMermaidRenderResult
}

interface LegacyOverride<T> {
  clear: () => void
  get: () => Promise<T | null>
  hasOverride: () => boolean
  isEnabled: () => boolean
  setLoader: (loader: OptionalPeerLoader<T> | null) => void
}

function createLegacyOverride<T>(
  getCanonicalGeneration: () => number,
  retryAfterFailure = false,
): LegacyOverride<T> {
  const runtime = createOptionalPeerRuntime<T>(() => {
    throw new Error('Legacy runtime loader is not configured.')
  })
  runtime.disable()
  let canonicalGeneration = getCanonicalGeneration()
  let hasOverride = false
  let loader: OptionalPeerLoader<T> | null = null

  function isCurrentOverride(): boolean {
    if (hasOverride && canonicalGeneration !== getCanonicalGeneration()) {
      hasOverride = false
      loader = null
      runtime.disable()
    }
    return hasOverride
  }

  return {
    clear: () => {
      hasOverride = false
      loader = null
      runtime.disable()
    },
    get: async () => {
      if (!isCurrentOverride())
        return null
      const value = await runtime.get()
      if (!isCurrentOverride())
        return null
      if (value === null && retryAfterFailure && loader)
        runtime.setLoader(loader)
      return value
    },
    hasOverride: isCurrentOverride,
    isEnabled: () => isCurrentOverride() && runtime.isEnabled(),
    setLoader: (nextLoader) => {
      canonicalGeneration = getCanonicalGeneration()
      hasOverride = true
      loader = nextLoader
      runtime.setLoader(nextLoader)
    },
  }
}

const legacyD2 = createLegacyOverride<D2Constructor>(
  () => d2Runtime.getGeneration?.() ?? 0,
  true,
)
const legacyKatex = createLegacyOverride<LegacyKatexModule>(
  () => katexRuntime.getGeneration?.() ?? 0,
)
const legacyMermaid = createLegacyOverride<LegacyMermaidModule>(
  () => mermaidRuntime.getGeneration?.() ?? 0,
)
let legacyMermaidInitKey: string | null = null

function computeMermaidInitKey(config: MermaidInitConfig): string {
  const securityLevel = String(config.securityLevel ?? 'strict')
  const htmlLabels = config.flowchart?.htmlLabels
  return `${securityLevel}|htmlLabels:${htmlLabels === false ? '0' : '1'}`
}

export function setLegacyD2Loader(
  loader: OptionalPeerLoader<D2Constructor> | null | undefined,
): void {
  if (loader === undefined)
    legacyD2.clear()
  else
    legacyD2.setLoader(loader)
}

export function setLegacyKatexLoader(
  loader: OptionalPeerLoader<LegacyKatexModule> | null | undefined,
): void {
  if (loader === undefined)
    legacyKatex.clear()
  else
    legacyKatex.setLoader(loader)
}

export function setLegacyMermaidLoader(
  loader: OptionalPeerLoader<LegacyMermaidModule> | null | undefined,
): void {
  legacyMermaidInitKey = null
  if (loader === undefined)
    legacyMermaid.clear()
  else
    legacyMermaid.setLoader(loader)
}

export function isCompatibleD2Enabled(): boolean {
  return legacyD2.hasOverride()
    ? legacyD2.isEnabled()
    : d2Runtime.isEnabled()
}

export function isCompatibleKatexEnabled(): boolean {
  return legacyKatex.hasOverride()
    ? legacyKatex.isEnabled()
    : katexRuntime.isEnabled()
}

export function isCompatibleMermaidEnabled(): boolean {
  return legacyMermaid.hasOverride()
    ? legacyMermaid.isEnabled()
    : mermaidRuntime.isEnabled()
}

export async function getCompatibleD2(): Promise<D2Constructor | null> {
  if (!legacyD2.hasOverride())
    return d2Runtime.get()
  const value = await legacyD2.get()
  return legacyD2.hasOverride() ? value : d2Runtime.get()
}

export async function getCompatibleKatex(): Promise<LegacyKatexModule | null> {
  if (!legacyKatex.hasOverride())
    return katexRuntime.get() as Promise<LegacyKatexModule | null>
  const value = await legacyKatex.get()
  return legacyKatex.hasOverride()
    ? value
    : katexRuntime.get() as Promise<LegacyKatexModule | null>
}

export async function getCompatibleMermaid(
  config?: MermaidInitConfig,
): Promise<LegacyMermaidModule | null> {
  if (!legacyMermaid.hasOverride()) {
    return mermaidRuntime.get(config) as unknown as Promise<LegacyMermaidModule | null>
  }

  const instance = await legacyMermaid.get()
  if (!legacyMermaid.hasOverride()) {
    return mermaidRuntime.get(config) as unknown as Promise<LegacyMermaidModule | null>
  }
  if (!instance || !config)
    return instance

  const key = computeMermaidInitKey(config)
  if (key === legacyMermaidInitKey)
    return instance

  try {
    instance.initialize?.({
      suppressErrorRendering: true,
      ...config,
    } as Record<string, unknown>)
    legacyMermaidInitKey = key
  }
  catch {
    // Retry initialization on the next request.
  }
  return instance
}
