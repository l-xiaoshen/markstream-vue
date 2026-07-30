import type mermaid from 'mermaid'
import type { MermaidConfig, RenderResult } from 'mermaid'
import type { OptionalPeerLoader } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type MermaidModule = typeof mermaid
export type MermaidRuntimeLoader = OptionalPeerLoader<MermaidModule>
/** @deprecated Use `MermaidRuntimeLoader` with `mermaidRuntime` or `createMermaidRuntime()`. */
export type MermaidLoader = () => unknown | Promise<unknown>
export type MermaidRenderResult = RenderResult
export type MermaidInitConfig = MermaidConfig

export interface MermaidRuntime {
  disable: () => void
  enable: (loader?: MermaidRuntimeLoader) => void
  get: (initConfig?: MermaidInitConfig) => Promise<MermaidModule | null>
  getGeneration?: (() => number) | undefined
  isEnabled: () => boolean
  setLoader: (loader: MermaidRuntimeLoader | null) => void
}

function computeInitKey(config: MermaidInitConfig) {
  const securityLevel = String(config.securityLevel ?? 'strict')
  const htmlLabels = config.flowchart?.htmlLabels
  return `${securityLevel}|htmlLabels:${htmlLabels === false ? '0' : '1'}`
}

async function defaultMermaidLoader(): Promise<MermaidModule> {
  return (await import('mermaid')).default
}

export function createMermaidRuntime(
  loader: MermaidRuntimeLoader = defaultMermaidLoader,
): MermaidRuntime {
  const peerRuntime = createOptionalPeerRuntime(loader)
  const state: {
    lastInitKey: string | null
  } = {
    lastInitKey: null,
  }

  function resetInitialization() {
    state.lastInitKey = null
  }

  function setLoader(loader: MermaidRuntimeLoader | null): void {
    peerRuntime.setLoader(loader)
    resetInitialization()
  }

  function enable(loader?: MermaidRuntimeLoader): void {
    peerRuntime.enable(loader)
    resetInitialization()
  }

  async function get(initConfig?: MermaidInitConfig): Promise<MermaidModule | null> {
    const instance = await peerRuntime.get()
    if (!instance || !initConfig)
      return instance

    const key = computeInitKey(initConfig)
    if (state.lastInitKey === key)
      return instance

    try {
      instance.initialize({
        suppressErrorRendering: true,
        ...initConfig,
      })
      state.lastInitKey = key
    }
    catch {
      // Rendering can still succeed when Mermaid rejects repeat initialization.
    }
    return instance
  }

  return {
    disable: () => {
      peerRuntime.disable()
      resetInitialization()
    },
    enable,
    get,
    getGeneration: peerRuntime.getGeneration,
    isEnabled: peerRuntime.isEnabled,
    setLoader,
  }
}

export const mermaidRuntime = createMermaidRuntime()
