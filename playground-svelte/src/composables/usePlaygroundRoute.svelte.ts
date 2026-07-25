import type { PlaygroundPath } from '../types/playground'

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export function usePlaygroundRoute() {
  let currentPath = $state(
    typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname),
  )
  const isTest = $derived(currentPath === '/test')

  function syncPath() {
    currentPath = normalizePath(window.location.pathname)
  }

  function navigate(pathname: PlaygroundPath) {
    const nextPath = normalizePath(pathname)
    if (nextPath !== normalizePath(window.location.pathname))
      window.history.pushState({}, '', nextPath)
    currentPath = nextPath
  }

  $effect(() => {
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  })

  return {
    get currentPath() {
      return currentPath
    },
    get isTest() {
      return isTest
    },
    navigate,
  }
}

export type PlaygroundRoute = ReturnType<typeof usePlaygroundRoute>
