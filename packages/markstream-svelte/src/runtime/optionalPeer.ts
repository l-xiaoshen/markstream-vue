export type OptionalPeerLoader<Value> = () => Value | Promise<Value>

export interface OptionalPeerRuntime<Value> {
  disable: () => void
  enable: (loader?: OptionalPeerLoader<Value>) => void
  get: () => Promise<Value | null>
  isEnabled: () => boolean
  setLoader: (loader: OptionalPeerLoader<Value> | null) => void
}

export function createOptionalPeerRuntime<Value>(
  defaultLoader: OptionalPeerLoader<Value>,
  onLoadError?: (error: unknown) => void,
): OptionalPeerRuntime<Value> {
  const state: {
    attempted: boolean
    cached: Value | null
    generation: number
    loader: OptionalPeerLoader<Value> | null
    pending: Promise<Value | null> | null
  } = {
    attempted: false,
    cached: null,
    generation: 0,
    loader: defaultLoader,
    pending: null,
  }

  const reset = () => {
    state.attempted = false
    state.cached = null
    state.generation += 1
    state.pending = null
  }

  const setLoader = (loader: OptionalPeerLoader<Value> | null) => {
    state.loader = loader
    reset()
  }

  const get = async (): Promise<Value | null> => {
    if (state.cached !== null)
      return state.cached
    if (state.pending)
      return state.pending
    if (state.attempted)
      return null

    const loader = state.loader
    if (!loader) {
      state.attempted = true
      return null
    }

    const generation = state.generation
    state.attempted = true
    const pending = Promise.resolve()
      .then(loader)
      .then((loaded) => {
        if (state.generation !== generation)
          return null
        state.cached = loaded
        return loaded
      })
      .catch((error: unknown) => {
        if (state.generation === generation)
          onLoadError?.(error)
        return null
      })
      .finally(() => {
        if (state.generation === generation)
          state.pending = null
      })

    state.pending = pending
    return pending
  }

  return {
    disable: () => setLoader(null),
    enable: loader => setLoader(loader ?? defaultLoader),
    get,
    isEnabled: () => state.loader !== null,
    setLoader,
  }
}
