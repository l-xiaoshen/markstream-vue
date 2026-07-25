import type { Attachment } from 'svelte/attachments'
import { tick, untrack } from 'svelte'

const BOTTOM_THRESHOLD_PX = 64

function getScrollRoot(): HTMLElement | null {
  const root = document.scrollingElement
  return root instanceof HTMLElement ? root : null
}

function bottomGap(root: HTMLElement): number {
  return root.scrollHeight - root.clientHeight - root.scrollTop
}

export function usePinnedScroll(getContentVersion: () => number) {
  let contentRoot = $state.raw<HTMLElement | null>(null)
  let pinnedToBottom = true
  let previousContentVersion = -1
  let expectedScrollTop: number | null = null
  let scrollFrame: number | undefined

  function cancelScheduledScroll(): void {
    if (scrollFrame !== undefined)
      window.cancelAnimationFrame(scrollFrame)
    scrollFrame = undefined
  }

  function isAtBottom(root: HTMLElement): boolean {
    return bottomGap(root) <= BOTTOM_THRESHOLD_PX
  }

  function scheduleScroll(root: HTMLElement, shouldStick = pinnedToBottom): void {
    if (!shouldStick || scrollFrame !== undefined)
      return
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = undefined
      if (!pinnedToBottom || getScrollRoot() !== root)
        return
      expectedScrollTop = Math.max(0, root.scrollHeight - root.clientHeight)
      root.scrollTop = expectedScrollTop
      pinnedToBottom = isAtBottom(root)
    })
  }

  function observeContent(
    container: HTMLElement,
    scrollRoot: HTMLElement,
  ): () => void {
    const schedule = () => scheduleScroll(scrollRoot)
    const resizeObserver = new ResizeObserver(schedule)
    const mutationObserver = new MutationObserver(() => {
      resizeObserver.disconnect()
      resizeObserver.observe(container)
      const renderer = container.querySelector<HTMLElement>(
        ':scope > .markdown-renderer',
      )
      if (renderer)
        resizeObserver.observe(renderer)
      schedule()
    })

    resizeObserver.observe(container)
    mutationObserver.observe(container, { childList: true, subtree: true })
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }

  const attachRoot: Attachment<HTMLElement> = (container) => {
    contentRoot = container
    return () => {
      if (contentRoot === container)
        contentRoot = null
    }
  }

  $effect(() => {
    const container = contentRoot
    if (!container)
      return

    return untrack(() => {
      const scrollRoot = getScrollRoot()
      if (!scrollRoot)
        return

      let previousScrollTop = scrollRoot.scrollTop
      const onScroll = () => {
        const currentScrollTop = scrollRoot.scrollTop
        if (
          expectedScrollTop != null
          && Math.abs(currentScrollTop - expectedScrollTop) <= 1
        ) {
          expectedScrollTop = null
          previousScrollTop = currentScrollTop
          return
        }
        expectedScrollTop = null
        if (currentScrollTop < previousScrollTop - 1)
          pinnedToBottom = false
        else if (isAtBottom(scrollRoot))
          pinnedToBottom = true
        previousScrollTop = currentScrollTop
      }
      const onWheel = (event: WheelEvent) => {
        if (event.deltaY >= 0)
          return
        expectedScrollTop = null
        pinnedToBottom = false
        cancelScheduledScroll()
      }
      const stopObserving = observeContent(container, scrollRoot)

      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('wheel', onWheel, { passive: true })
      scheduleScroll(scrollRoot, true)

      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('wheel', onWheel)
        stopObserving()
        cancelScheduledScroll()
      }
    })
  })

  $effect(() => {
    const contentVersion = getContentVersion()
    const container = contentRoot
    if (!container || contentVersion === previousContentVersion)
      return

    untrack(() => {
      const scrollRoot = getScrollRoot()
      if (!scrollRoot)
        return
      const restarted = previousContentVersion >= 0
        && contentVersion < previousContentVersion
      previousContentVersion = contentVersion
      const shouldStick = restarted || pinnedToBottom || isAtBottom(scrollRoot)
      pinnedToBottom = shouldStick
      void tick().then(() => scheduleScroll(scrollRoot, shouldStick))
    })
  })

  return { attachRoot }
}
