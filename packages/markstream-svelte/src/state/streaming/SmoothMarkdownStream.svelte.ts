import type {
  SmoothMarkdownStreamController,
  SmoothMarkdownStreamOptions,
} from 'markstream-core'
import { createSmoothMarkdownStream } from 'markstream-core'

export type { SmoothMarkdownStreamOptions }

function getOptionsSignature(options: SmoothMarkdownStreamOptions): string {
  return [
    options.minCharsPerSecond,
    options.maxCharsPerSecond,
    options.targetLatencyMs,
    options.catchUpLatencyMs,
    options.catchUpThreshold,
    options.maxCommitFps,
    options.startDelayMs,
    options.maxCharsPerCommit,
    options.flushOnFinish,
  ].join('|')
}

export class SmoothMarkdownStream {
  source = $state('')
  visible = $state('')
  done = $state(false)
  pendingChars = $state(0)
  caughtUp = $state(false)
  final = $state(false)

  #controller: SmoothMarkdownStreamController
  #destroyed = false
  #optionsSignature: string
  #unsubscribe: () => void

  constructor(options: SmoothMarkdownStreamOptions = {}) {
    this.#controller = createSmoothMarkdownStream(options)
    this.#optionsSignature = getOptionsSignature(options)
    this.#unsubscribe = this.#controller.subscribe(() => this.#sync())
    this.#sync()
  }

  #sync(): void {
    const snapshot = this.#controller.getSnapshot()
    this.source = snapshot.source
    this.visible = snapshot.visible
    this.done = snapshot.done
    this.pendingChars = snapshot.pendingChars
    this.caughtUp = snapshot.caughtUp
    this.final = snapshot.final
  }

  #replaceController(options: SmoothMarkdownStreamOptions): void {
    if (this.#destroyed)
      return

    const snapshot = this.#controller.getSnapshot()
    this.#unsubscribe()
    this.#controller.destroy()

    this.#controller = createSmoothMarkdownStream(options)
    this.#unsubscribe = this.#controller.subscribe(() => this.#sync())
    this.#controller.reset(snapshot.visible)
    if (snapshot.source.startsWith(snapshot.visible))
      this.#controller.enqueue(snapshot.source.slice(snapshot.visible.length))
    else
      this.#controller.reset(snapshot.source)
    if (snapshot.done)
      this.#controller.finish({ flush: snapshot.caughtUp })
    if (snapshot.paused)
      this.#controller.pause()
    this.#sync()
  }

  setOptions(options: SmoothMarkdownStreamOptions): void {
    const signature = getOptionsSignature(options)
    if (signature === this.#optionsSignature)
      return
    this.#optionsSignature = signature
    this.#replaceController(options)
  }

  enqueue(chunk: string): void {
    this.#controller.enqueue(chunk)
  }

  finish(
    options?: Parameters<SmoothMarkdownStreamController['finish']>[0],
  ): void {
    this.#controller.finish(options)
  }

  flush(): void {
    this.#controller.flush()
  }

  reset(initialMarkdown?: string): void {
    this.#controller.reset(initialMarkdown)
  }

  pause(): void {
    this.#controller.pause()
  }

  resume(): void {
    this.#controller.resume()
  }

  destroy(): void {
    if (this.#destroyed)
      return
    this.#destroyed = true
    this.#unsubscribe()
    this.#controller.destroy()
  }
}
