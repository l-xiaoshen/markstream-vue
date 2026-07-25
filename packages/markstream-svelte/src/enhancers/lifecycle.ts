import type {
  Disposable,
  DisposeRenderedHtmlEnhancement,
  EnhancementLifecycle,
} from './types'

export function createEnhancementLifecycle(
  isCancelled?: () => boolean,
  onDispose?: () => void,
): EnhancementLifecycle {
  const cleanupFns: DisposeRenderedHtmlEnhancement[] = []
  let disposed = false

  const lifecycle: EnhancementLifecycle = {
    isActive: () => !disposed && isCancelled?.() !== true,
    register: (disposable) => {
      const cleanup = toCleanup(disposable)
      if (disposed) {
        runCleanup(cleanup)
        return
      }
      cleanupFns.push(cleanup)
    },
    dispose: () => {
      if (disposed)
        return
      disposed = true
      for (let index = cleanupFns.length - 1; index >= 0; index -= 1)
        runCleanup(cleanupFns[index])
      cleanupFns.length = 0
      runCleanup(onDispose)
    },
  }

  return lifecycle
}

function toCleanup(
  disposable: Disposable | DisposeRenderedHtmlEnhancement,
): DisposeRenderedHtmlEnhancement {
  return typeof disposable === 'function'
    ? disposable
    : () => disposable.dispose()
}

function runCleanup(cleanup: DisposeRenderedHtmlEnhancement | undefined): void {
  try {
    cleanup?.()
  }
  catch {
    // Enhancement cleanup is best-effort.
  }
}
