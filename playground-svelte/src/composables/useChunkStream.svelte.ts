export interface ChunkStreamConfig {
  chunkSizeMin: number
  chunkSizeMax: number
  chunkDelayMin: number
  chunkDelayMax: number
  burstiness: number
}

export function useChunkStream(getConfig: () => ChunkStreamConfig) {
  let content = $state('')
  let isStreaming = $state(false)
  let isPaused = $state(false)
  let source = ''
  let cursor = 0
  let timer: number | null = null

  function randomBetween(min: number, max: number) {
    const lower = Math.min(min, max)
    const upper = Math.max(min, max)
    return Math.round(lower + Math.random() * (upper - lower))
  }

  function clearTimer() {
    if (timer !== null)
      window.clearTimeout(timer)
    timer = null
  }

  function finish() {
    clearTimer()
    isStreaming = false
    isPaused = false
  }

  function pushNextChunk() {
    if (!isStreaming || isPaused)
      return

    if (cursor >= source.length) {
      finish()
      return
    }

    const config = getConfig()
    const burst = Math.random() < config.burstiness / 100 ? 2 : 1
    const size = randomBetween(config.chunkSizeMin, config.chunkSizeMax) * burst
    content += source.slice(cursor, cursor + size)
    cursor += size
    timer = window.setTimeout(
      pushNextChunk,
      randomBetween(config.chunkDelayMin, config.chunkDelayMax),
    )
  }

  function start(nextSource: string) {
    clearTimer()
    source = nextSource
    cursor = 0
    content = ''
    isPaused = false
    isStreaming = true
    timer = window.setTimeout(pushNextChunk, 0)
  }

  function stop() {
    clearTimer()
    isStreaming = false
    isPaused = false
  }

  function togglePause() {
    if (!isStreaming)
      return

    isPaused = !isPaused
    if (!isPaused)
      pushNextChunk()
  }

  $effect(() => stop)

  return {
    get content() {
      return content
    },
    get isPaused() {
      return isPaused
    },
    get isStreaming() {
      return isStreaming
    },
    start,
    stop,
    togglePause,
  }
}

export type ChunkStream = ReturnType<typeof useChunkStream>
