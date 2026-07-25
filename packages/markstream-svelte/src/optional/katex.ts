import type katex from 'katex'
import type { OptionalPeerLoader, OptionalPeerRuntime } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type KatexModule = typeof katex
export type KatexLoader = OptionalPeerLoader<KatexModule>
export type KatexRuntime = OptionalPeerRuntime<KatexModule>

async function defaultKatexLoader(): Promise<KatexModule> {
  const imported = await import('katex')
  try {
    await import('katex/contrib/mhchem')
  }
  catch {
    // mhchem augments KaTeX when the optional contribution is available.
  }
  return imported.default
}

export function createKatexRuntime(
  loader: KatexLoader = defaultKatexLoader,
): KatexRuntime {
  return createOptionalPeerRuntime(loader)
}

export const katexRuntime = createKatexRuntime()
