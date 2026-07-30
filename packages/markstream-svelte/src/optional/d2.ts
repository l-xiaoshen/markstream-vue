import type { D2 } from '@terrastruct/d2'
import type { OptionalPeerLoader, OptionalPeerRuntime } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type D2Instance = D2
export type D2Constructor = typeof D2
export type D2RuntimeLoader = OptionalPeerLoader<D2Constructor>
/** @deprecated Use `D2RuntimeLoader` with `d2Runtime` or `createD2Runtime()`. */
export type D2Loader = () => unknown | Promise<unknown>
export type D2Runtime = OptionalPeerRuntime<D2Constructor>

async function defaultD2Loader(): Promise<D2Constructor> {
  return (await import('@terrastruct/d2')).D2
}

export function createD2Runtime(
  loader: D2RuntimeLoader = defaultD2Loader,
): D2Runtime {
  return createOptionalPeerRuntime(loader)
}

export const d2Runtime = createD2Runtime()
