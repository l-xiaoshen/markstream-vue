import type { UseMonacoReturn } from 'stream-monaco'
import type { OptionalPeerLoader } from '../runtime/optionalPeer'
import { createOptionalPeerRuntime } from '../runtime/optionalPeer'

export type MonacoRuntimeHelpers = UseMonacoReturn
export type MonacoRuntimeModule = typeof import('stream-monaco')
export type MonacoLoader = OptionalPeerLoader<MonacoRuntimeModule>

export interface MonacoRuntime {
  get: () => Promise<MonacoRuntimeModule | null>
  isReady: () => boolean
  preload: () => Promise<boolean>
}

const runtimeReadyResetters = new WeakMap<MonacoRuntime, () => void>()

function defaultMonacoLoader(): Promise<MonacoRuntimeModule> {
  return import('stream-monaco')
}

async function warmupShikiTokenizer(mod: MonacoRuntimeModule) {
  try {
    const highlighter = await mod.getOrCreateHighlighter(
      ['vitesse-dark', 'vitesse-light'],
      ['plaintext', 'text', 'javascript'],
    )

    highlighter.codeToTokens('const a = 1', { lang: 'javascript', theme: 'vitesse-dark' })
  }
  catch (error) {
    console.warn('[markstream-svelte] Failed to warm up stream-monaco tokenizer.', error)
  }
}

export function createMonacoRuntime(
  loader: MonacoLoader = defaultMonacoLoader,
): MonacoRuntime {
  const peerRuntime = createOptionalPeerRuntime(loader)
  const state: {
    preparePromise: Promise<void> | null
    ready: boolean
    warmupStarted: boolean
    workersPreloaded: boolean
  } = {
    preparePromise: null,
    ready: false,
    warmupStarted: false,
    workersPreloaded: false,
  }

  async function prepare(mod: MonacoRuntimeModule) {
    if (state.workersPreloaded)
      return
    if (state.preparePromise)
      return await state.preparePromise

    state.preparePromise = (async () => {
      await mod.preloadMonacoWorkers()
      state.workersPreloaded = true
    })().finally(() => {
      state.preparePromise = null
    })
    await state.preparePromise
  }

  async function get(): Promise<MonacoRuntimeModule | null> {
    if (typeof window === 'undefined')
      return null

    const mod = await peerRuntime.get()
    if (!mod)
      return null

    try {
      await prepare(mod)
      state.ready = true
      if (!state.warmupStarted) {
        state.warmupStarted = true
        void warmupShikiTokenizer(mod)
      }
      return mod
    }
    catch {
      return null
    }
  }

  const runtime: MonacoRuntime = {
    get,
    isReady: () => state.ready,
    preload: async () => Boolean(await get()),
  }
  runtimeReadyResetters.set(runtime, () => {
    state.ready = false
  })
  return runtime
}

export const monacoRuntime = createMonacoRuntime()

export function resetMonacoRuntimeReadyForTest(): void {
  runtimeReadyResetters.get(monacoRuntime)?.()
}
