import { resolveStreamingTextState } from 'markstream-core'
import { untrack } from 'svelte'

const DELTA_CLASS_A = 'markstream-svelte-text__stream-delta--a'
const DELTA_CLASS_B = 'markstream-svelte-text__stream-delta--b'

interface StreamingTextOptions {
  getContent: () => string
  getFadeEnabled: () => boolean
  getKey: () => string
  getState: () => Map<string, string> | undefined
}

function alternateDeltaClass(className: string): string {
  return className === DELTA_CLASS_A ? DELTA_CLASS_B : DELTA_CLASS_A
}

function resolveDelta(
  content: string,
  previousContent: string,
  fadeEnabled: boolean,
  currentClass: string,
) {
  const result = resolveStreamingTextState({
    nextContent: content,
    previousContent,
    typewriterEnabled: fadeEnabled,
  })
  return {
    deltaClass: result.appended
      ? alternateDeltaClass(currentClass)
      : currentClass,
    deltaContent: result.streamedDelta,
    stableContent: result.settledContent,
  }
}

export class StreamingText {
  deltaClass = $state(DELTA_CLASS_A)
  deltaContent = $state('')
  stableContent = $state('')

  #previousContent: string
  #previousFadeEnabled: boolean
  #previousKey: string

  constructor(private readonly options: StreamingTextOptions) {
    const content = untrack(this.options.getContent)
    const fadeEnabled = untrack(this.options.getFadeEnabled)
    const key = untrack(this.options.getKey)
    const state = untrack(this.options.getState)
    const initial = resolveDelta(
      content,
      state?.get(key) ?? '',
      fadeEnabled,
      this.deltaClass,
    )

    this.#previousContent = content
    this.#previousFadeEnabled = fadeEnabled
    this.#previousKey = key
    this.#setValue(initial)
    state?.set(key, content)

    $effect.pre(() => {
      const nextContent = this.options.getContent()
      const nextFadeEnabled = this.options.getFadeEnabled()
      const nextKey = this.options.getKey()
      const nextState = this.options.getState()

      untrack(() => {
        if (
          nextKey === this.#previousKey
          && nextContent === this.#previousContent
          && nextFadeEnabled === this.#previousFadeEnabled
        ) {
          nextState?.set(nextKey, nextContent)
          return
        }

        const priorContent = nextKey === this.#previousKey
          ? this.#previousContent
          : (nextState?.get(nextKey) ?? '')
        this.#setValue(resolveDelta(
          nextContent,
          priorContent,
          nextFadeEnabled,
          this.deltaClass,
        ))
        this.#previousContent = nextContent
        this.#previousFadeEnabled = nextFadeEnabled
        this.#previousKey = nextKey
        nextState?.set(nextKey, nextContent)
      })
    })
  }

  #setValue(value: ReturnType<typeof resolveDelta>): void {
    this.deltaClass = value.deltaClass
    this.deltaContent = value.deltaContent
    this.stableContent = value.stableContent
  }
}
