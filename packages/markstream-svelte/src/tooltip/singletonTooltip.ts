import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipOrigin {
  x: number
  y: number
}

export interface TooltipService {
  dispose: () => void
  hide: (immediate?: boolean) => void
  isVisible: () => boolean
  show: (
    anchor: HTMLElement | null,
    content: string,
    placement?: TooltipPlacement,
    immediate?: boolean,
    origin?: TooltipOrigin,
    isDark?: boolean | null,
  ) => void
}

function detectDarkModeHint(hint?: boolean | null): boolean {
  if (typeof hint === 'boolean')
    return hint
  if (typeof document !== 'undefined') {
    try {
      if (document.documentElement.classList.contains('dark'))
        return true
    }
    catch {}
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    catch {}
  }
  return false
}

async function updatePosition(
  anchor: HTMLElement,
  tooltip: HTMLDivElement,
  placement: TooltipPlacement,
) {
  const { x, y } = await computePosition(anchor, tooltip, {
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    strategy: 'fixed',
  })
  tooltip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
}

export function createTooltipService(): TooltipService {
  const state: {
    cleanupAutoUpdate: (() => void) | null
    currentAnchor: HTMLElement | null
    currentId: string | null
    hideTimer: ReturnType<typeof setTimeout> | null
    nextId: number
    showTimer: ReturnType<typeof setTimeout> | null
    tooltipEl: HTMLDivElement | null
    visible: boolean
  } = {
    cleanupAutoUpdate: null,
    currentAnchor: null,
    currentId: null,
    hideTimer: null,
    nextId: 0,
    showTimer: null,
    tooltipEl: null,
    visible: false,
  }

  function clearTimers() {
    if (state.showTimer) {
      clearTimeout(state.showTimer)
      state.showTimer = null
    }
    if (state.hideTimer) {
      clearTimeout(state.hideTimer)
      state.hideTimer = null
    }
  }

  function ensureTooltipEl() {
    if (state.tooltipEl || typeof document === 'undefined')
      return state.tooltipEl

    const tooltip = document.createElement('div')
    tooltip.className = 'ms-tooltip'
    tooltip.setAttribute('role', 'tooltip')
    tooltip.dataset.visible = 'false'
    tooltip.style.position = 'fixed'
    tooltip.style.left = '0px'
    tooltip.style.top = '0px'
    tooltip.style.transform = 'translate3d(0,0,0)'
    document.body.appendChild(tooltip)
    state.tooltipEl = tooltip
    return tooltip
  }

  function hide(immediate = false) {
    const tooltip = state.tooltipEl
    if (!tooltip)
      return
    const activeTooltip = tooltip

    clearTimers()
    function doHide() {
      activeTooltip.dataset.visible = 'false'
      state.visible = false
      if (state.currentAnchor && state.currentId) {
        try {
          state.currentAnchor.removeAttribute('aria-describedby')
        }
        catch {}
      }
      state.currentAnchor = null
      state.currentId = null
      state.cleanupAutoUpdate?.()
      state.cleanupAutoUpdate = null
    }

    if (immediate)
      doHide()
    else
      state.hideTimer = setTimeout(doHide, 120)
  }

  function show(
    anchor: HTMLElement | null,
    content: string,
    placement: TooltipPlacement = 'top',
    immediate = false,
    _origin?: TooltipOrigin,
    isDark?: boolean | null,
  ): void {
    if (!anchor || typeof document === 'undefined')
      return

    const tooltip = ensureTooltipEl()
    if (!tooltip)
      return
    const activeAnchor = anchor
    const activeTooltip = tooltip

    clearTimers()
    async function doShow() {
      state.currentAnchor = activeAnchor
      activeTooltip.textContent = content
      activeTooltip.dataset.placement = placement
      activeTooltip.dataset.dark = detectDarkModeHint(isDark) ? 'true' : 'false'
      activeTooltip.dataset.visible = 'false'
      state.nextId += 1
      const id = `tooltip-${Date.now()}-${state.nextId}`
      state.currentId = id
      activeTooltip.id = id
      try {
        activeAnchor.setAttribute('aria-describedby', id)
      }
      catch {}

      await updatePosition(activeAnchor, activeTooltip, placement)
      if (state.currentId !== id)
        return

      activeTooltip.dataset.visible = 'true'
      state.visible = true
      state.cleanupAutoUpdate?.()
      state.cleanupAutoUpdate = autoUpdate(activeAnchor, activeTooltip, () => {
        void updatePosition(activeAnchor, activeTooltip, placement)
      })
    }

    if (immediate)
      void doShow()
    else
      state.showTimer = setTimeout(doShow, 80)
  }

  return {
    dispose: () => {
      hide(true)
      clearTimers()
      state.tooltipEl?.remove()
      state.tooltipEl = null
    },
    hide,
    isVisible: () => state.visible,
    show,
  }
}

const defaultTooltipService = createTooltipService()

export function showTooltipForAnchor(
  anchor: HTMLElement | null,
  content: string,
  placement: TooltipPlacement = 'top',
  immediate = false,
  origin?: TooltipOrigin,
  isDark?: boolean | null,
) {
  defaultTooltipService.show(anchor, content, placement, immediate, origin, isDark)
}

export function hideTooltip(immediate = false) {
  defaultTooltipService.hide(immediate)
}

export function isTooltipVisible() {
  return defaultTooltipService.isVisible()
}
