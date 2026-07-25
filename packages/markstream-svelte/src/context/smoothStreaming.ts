import { getContext, setContext } from 'svelte'

type SmoothStreamingContextValue = () => boolean

const smoothStreamingContext = Symbol('markstream-smooth-streaming')

export function getParentSmoothStreaming(): SmoothStreamingContextValue | undefined {
  return getContext<SmoothStreamingContextValue | undefined>(smoothStreamingContext)
}

export function setSmoothStreaming(value: SmoothStreamingContextValue): void {
  setContext(smoothStreamingContext, value)
}
