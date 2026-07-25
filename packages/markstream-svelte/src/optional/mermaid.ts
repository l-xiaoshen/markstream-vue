import type mermaid from 'mermaid'
import type { MermaidConfig, RenderResult } from 'mermaid'
import type { OptionalPeerLoader } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type MermaidModule = typeof mermaid
export type MermaidLoader = OptionalPeerLoader<MermaidModule>
export type MermaidRenderResult = RenderResult
export type MermaidInitConfig = MermaidConfig

export interface MermaidRuntime {
  disable: () => void
  enable: (loader?: MermaidLoader) => void
  get: (initConfig?: MermaidInitConfig) => Promise<MermaidModule | null>
  isEnabled: () => boolean
  setLoader: (loader: MermaidLoader | null) => void
}

function computeInitKey(config: MermaidInitConfig) {
  const securityLevel = String(config.securityLevel ?? 'strict')
  const htmlLabels = config.flowchart?.htmlLabels
  return `${securityLevel}|htmlLabels:${htmlLabels === false ? '0' : '1'}`
}

const defaultMermaidLoader: MermaidLoader = async () => (await import('mermaid')).default

export function createMermaidRuntime(
  loader: MermaidLoader = defaultMermaidLoader,
): MermaidRuntime {
  const peerRuntime = createOptionalPeerRuntime(loader)
  const state: {
    lastInitKey: string | null
  } = {
    lastInitKey: null,
  }

  const resetInitialization = () => {
    state.lastInitKey = null
  }

  const setLoader: MermaidRuntime['setLoader'] = (loader) => {
    peerRuntime.setLoader(loader)
    resetInitialization()
  }

  const enable: MermaidRuntime['enable'] = (loader) => {
    peerRuntime.enable(loader)
    resetInitialization()
  }

  const get = async (initConfig?: MermaidInitConfig): Promise<MermaidModule | null> => {
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
    isEnabled: peerRuntime.isEnabled,
    setLoader,
  }
}

export const mermaidRuntime = createMermaidRuntime()
