import type { BaseNode } from 'stream-markdown-parser'
import { onDestroy, tick } from 'svelte'

const EXCLUDED_NODE_TYPES = [
  'code_block',
  'admonition',
  'table',
  'math_block',
  'html_block',
  'image',
] as const
const EXCLUDED_NODE_TYPE_SET: ReadonlySet<string> = new Set(EXCLUDED_NODE_TYPES)
const EXCLUDED_TEXT_SELECTOR = [
  '.typewriter-cursor',
  '.height-estimation-probes',
  ...EXCLUDED_NODE_TYPES.map(type => `[data-node-type="${type}"]`),
  'script',
  'style',
].join(', ')

interface TypewriterCursorOptions {
  getNodes: () => readonly BaseNode[]
  getRawContent: () => string
  getFinal: () => boolean | undefined
  getEnabled: () => boolean
  getUsesProvidedNodes: () => boolean
}

function lastRenderableText(root: HTMLElement): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(candidate) {
      if (!(candidate instanceof Text) || !candidate.textContent?.trim())
        return NodeFilter.FILTER_REJECT
      const parent = candidate.parentElement
      return parent && !parent.closest(EXCLUDED_TEXT_SELECTOR)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    },
  })

  let last: Text | null = null
  let candidate = walker.nextNode()
  while (candidate) {
    if (candidate instanceof Text)
      last = candidate
    candidate = walker.nextNode()
  }
  return last
}

export class TypewriterCursor {
  visible = $state(false)

  #root: HTMLElement | null = null
  #cursor: HTMLElement | null = null
  #hideTimer: ReturnType<typeof setTimeout> | undefined
  #positionGeneration = 0
  #previousLength = 0

  rootAttachment(element: HTMLElement) {
    this.#root = element
    this.#schedulePosition()
    return () => {
      if (this.#root === element)
        this.#root = null
    }
  }

  cursorAttachment(element: HTMLElement) {
    this.#cursor = element
    this.#schedulePosition()
    return () => {
      if (this.#cursor === element)
        this.#cursor = null
    }
  }

  constructor(private readonly options: TypewriterCursorOptions) {
    $effect(() => {
      const nodes = this.options.getNodes()
      const final = this.options.getFinal()
      const enabled = this.options.getEnabled()
      const providedNodes = this.options.getUsesProvidedNodes()
      const nextLength = providedNodes
        ? nodes.reduce((total, node) => total + node.raw.length, 0)
        : this.options.getRawContent().length
      const lastNode = nodes.at(-1)
      const allowed = !lastNode || !EXCLUDED_NODE_TYPE_SET.has(lastNode.type)

      if (providedNodes || final || !enabled || !allowed || nextLength <= this.#previousLength) {
        this.#previousLength = nextLength
        this.#hide()
        return
      }

      this.#previousLength = nextLength
      this.visible = true
      this.#clearHideTimer()
      this.#schedulePosition()
      this.#hideTimer = setTimeout(() => this.#hide(), 3000)
    })

    onDestroy(() => {
      this.#positionGeneration += 1
      this.#clearHideTimer()
    })
  }

  #clearHideTimer(): void {
    if (this.#hideTimer === undefined)
      return
    clearTimeout(this.#hideTimer)
    this.#hideTimer = undefined
  }

  #hide(): void {
    this.#positionGeneration += 1
    this.visible = false
    this.#clearHideTimer()
  }

  #schedulePosition(): void {
    const generation = ++this.#positionGeneration
    void tick().then(() => {
      if (generation === this.#positionGeneration)
        this.updatePosition()
    })
  }

  updatePosition(): void {
    if (typeof window === 'undefined' || !this.visible || !this.#root || !this.#cursor)
      return

    const text = lastRenderableText(this.#root)
    const rootRect = this.#root.getBoundingClientRect()
    let left = 0
    let top = 0
    let height = 20

    if (text?.textContent) {
      const range = document.createRange()
      const end = text.textContent.length
      range.setStart(text, Math.max(0, end - 1))
      range.setEnd(text, end)
      const rectangles = range.getClientRects()
      const rectangle = rectangles.item(rectangles.length - 1)
        ?? text.parentElement?.getBoundingClientRect()

      if (rectangle) {
        left = rectangle.right - rootRect.left + this.#root.scrollLeft
        top = rectangle.top - rootRect.top + this.#root.scrollTop
        height = rectangle.height || height
      }
      range.detach()
    }

    this.#cursor.style.transform = `translate(${Math.max(0, left)}px, ${Math.max(0, top)}px)`
    this.#cursor.style.height = `${height}px`
  }
}
