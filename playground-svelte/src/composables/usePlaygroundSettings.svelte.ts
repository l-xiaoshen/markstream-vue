import type { TestLabSampleId } from '../../../playground-shared/testLabFixtures'
import type { PlaygroundTheme } from '../config/playground'
import type { RenderMode } from '../types/playground'
import {
  katexRuntime,
  mermaidRuntime,
} from 'markstream-svelte'
import { THEMES } from '../config/playground'

const STORAGE_KEYS = {
  colorScheme: 'vueuse-color-scheme',
  selectedTheme: 'vmr-settings-selected-theme',
  chunkSizeMin: 'vmr-settings-stream-chunk-size-min',
  chunkSizeMax: 'vmr-settings-stream-chunk-size-max',
  chunkDelayMin: 'vmr-settings-stream-delay-min',
  chunkDelayMax: 'vmr-settings-stream-delay-max',
  burstiness: 'vmr-settings-stream-burstiness',
  sampleId: 'vmr-test-sample',
  renderMode: 'vmr-test-render-mode',
  codeBlockStream: 'vmr-test-code-stream',
  batchRendering: 'vmr-test-batch-rendering',
  typewriter: 'vmr-test-typewriter',
  mathEnabled: 'vmr-test-math-enabled',
  mermaidEnabled: 'vmr-test-mermaid-enabled',
}

function getStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function readNumber(key: string, fallback: number) {
  const storedValue = getStorage()?.getItem(key)
  if (storedValue === null || storedValue === undefined)
    return fallback
  const value = Number(storedValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function readBoolean(key: string, fallback = true) {
  const value = getStorage()?.getItem(key)
  return value === null || value === undefined ? fallback : value !== 'false'
}

function readRenderMode(value: string | null | undefined): RenderMode {
  if (value === 'markdown' || value === 'pre')
    return value
  return 'monaco'
}

function readSampleId(value: string | null | undefined): TestLabSampleId {
  if (value === 'thinking' || value === 'diff' || value === 'stress')
    return value
  return 'baseline'
}

function readTheme(): PlaygroundTheme {
  const storedTheme = getStorage()?.getItem(STORAGE_KEYS.selectedTheme)
  return THEMES.find(theme => theme === storedTheme) ?? 'vitesse-dark'
}

function readDarkMode() {
  if (typeof window === 'undefined')
    return false
  const storedScheme = getStorage()?.getItem(STORAGE_KEYS.colorScheme)
  if (storedScheme)
    return storedScheme === 'dark'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function usePlaygroundSettings() {
  let isDark = $state(readDarkMode())
  let selectedTheme = $state<PlaygroundTheme>(readTheme())
  let chunkSizeMin = $state(readNumber(STORAGE_KEYS.chunkSizeMin, 2))
  let chunkSizeMax = $state(readNumber(STORAGE_KEYS.chunkSizeMax, 7))
  let chunkDelayMin = $state(readNumber(STORAGE_KEYS.chunkDelayMin, 14))
  let chunkDelayMax = $state(readNumber(STORAGE_KEYS.chunkDelayMax, 34))
  let burstiness = $state(readNumber(STORAGE_KEYS.burstiness, 35))
  let sampleId = $state<TestLabSampleId>(
    readSampleId(getStorage()?.getItem(STORAGE_KEYS.sampleId)),
  )
  let renderMode = $state<RenderMode>(
    readRenderMode(getStorage()?.getItem(STORAGE_KEYS.renderMode)),
  )
  let codeBlockStream = $state(readBoolean(STORAGE_KEYS.codeBlockStream))
  let batchRendering = $state(readBoolean(STORAGE_KEYS.batchRendering))
  let typewriter = $state(readBoolean(STORAGE_KEYS.typewriter))
  let mathEnabled = $state(readBoolean(STORAGE_KEYS.mathEnabled))
  let mermaidEnabled = $state(readBoolean(STORAGE_KEYS.mermaidEnabled))

  const streamConfig = $derived({
    chunkSizeMin,
    chunkSizeMax,
    chunkDelayMin,
    chunkDelayMax,
    burstiness,
  })
  const streamChunkRangeLabel = $derived(
    `${Math.min(chunkSizeMin, chunkSizeMax)}-${Math.max(chunkSizeMin, chunkSizeMax)}`,
  )
  const streamDelayRangeLabel = $derived(
    `${Math.min(chunkDelayMin, chunkDelayMax)}-${Math.max(chunkDelayMin, chunkDelayMax)}ms`,
  )
  const renderModeLabel = $derived(
    renderMode === 'markdown'
      ? 'CodeBlock component'
      : renderMode === 'pre'
        ? 'PreCodeNode'
        : 'Monaco',
  )

  $effect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    getStorage()?.setItem(STORAGE_KEYS.colorScheme, isDark ? 'dark' : 'light')
  })

  $effect(() => {
    getStorage()?.setItem(STORAGE_KEYS.selectedTheme, selectedTheme)
  })

  $effect(() => {
    const storage = getStorage()
    storage?.setItem(STORAGE_KEYS.chunkSizeMin, String(chunkSizeMin))
    storage?.setItem(STORAGE_KEYS.chunkSizeMax, String(chunkSizeMax))
    storage?.setItem(STORAGE_KEYS.chunkDelayMin, String(chunkDelayMin))
    storage?.setItem(STORAGE_KEYS.chunkDelayMax, String(chunkDelayMax))
    storage?.setItem(STORAGE_KEYS.burstiness, String(burstiness))
  })

  $effect(() => {
    getStorage()?.setItem(STORAGE_KEYS.sampleId, sampleId)
    getStorage()?.setItem(STORAGE_KEYS.renderMode, renderMode)
    getStorage()?.setItem(STORAGE_KEYS.codeBlockStream, String(codeBlockStream))
    getStorage()?.setItem(STORAGE_KEYS.batchRendering, String(batchRendering))
    getStorage()?.setItem(STORAGE_KEYS.typewriter, String(typewriter))
  })

  $effect(() => {
    getStorage()?.setItem(STORAGE_KEYS.mathEnabled, String(mathEnabled))
    if (mathEnabled)
      katexRuntime.enable()
    else
      katexRuntime.disable()
  })

  $effect(() => {
    getStorage()?.setItem(STORAGE_KEYS.mermaidEnabled, String(mermaidEnabled))
    if (mermaidEnabled)
      mermaidRuntime.enable()
    else
      mermaidRuntime.disable()
  })

  return {
    get batchRendering() { return batchRendering },
    set batchRendering(value: boolean) { batchRendering = value },
    get burstiness() { return burstiness },
    set burstiness(value: number) { burstiness = value },
    get chunkDelayMax() { return chunkDelayMax },
    set chunkDelayMax(value: number) { chunkDelayMax = value },
    get chunkDelayMin() { return chunkDelayMin },
    set chunkDelayMin(value: number) { chunkDelayMin = value },
    get chunkSizeMax() { return chunkSizeMax },
    set chunkSizeMax(value: number) { chunkSizeMax = value },
    get chunkSizeMin() { return chunkSizeMin },
    set chunkSizeMin(value: number) { chunkSizeMin = value },
    get codeBlockStream() { return codeBlockStream },
    set codeBlockStream(value: boolean) { codeBlockStream = value },
    get isDark() { return isDark },
    set isDark(value: boolean) { isDark = value },
    get mathEnabled() { return mathEnabled },
    set mathEnabled(value: boolean) { mathEnabled = value },
    get mermaidEnabled() { return mermaidEnabled },
    set mermaidEnabled(value: boolean) { mermaidEnabled = value },
    get renderMode() { return renderMode },
    set renderMode(value: RenderMode) { renderMode = value },
    get renderModeLabel() { return renderModeLabel },
    get sampleId() { return sampleId },
    set sampleId(value: TestLabSampleId) { sampleId = value },
    get selectedTheme() { return selectedTheme },
    set selectedTheme(value: PlaygroundTheme) { selectedTheme = value },
    get streamChunkRangeLabel() { return streamChunkRangeLabel },
    get streamConfig() { return streamConfig },
    get streamDelayRangeLabel() { return streamDelayRangeLabel },
    get typewriter() { return typewriter },
    set typewriter(value: boolean) { typewriter = value },
  }
}

export type PlaygroundSettings = ReturnType<typeof usePlaygroundSettings>
