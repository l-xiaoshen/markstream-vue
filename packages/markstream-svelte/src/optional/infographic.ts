import type { Infographic } from '@antv/infographic'
import type { OptionalPeerLoader, OptionalPeerRuntime } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type InfographicInstance = Infographic
export type InfographicConstructor = typeof Infographic
export type InfographicLoader = OptionalPeerLoader<InfographicConstructor>
export type InfographicRuntime = OptionalPeerRuntime<InfographicConstructor>

async function defaultInfographicLoader(): Promise<InfographicConstructor> {
  return (await import('@antv/infographic')).Infographic
}

export function createInfographicRuntime(
  loader: InfographicLoader = defaultInfographicLoader,
): InfographicRuntime {
  return createOptionalPeerRuntime(
    loader,
    error => console.warn(
      '[markstream-svelte] Failed to load @antv/infographic',
      error,
    ),
  )
}

export const infographicRuntime = createInfographicRuntime()
