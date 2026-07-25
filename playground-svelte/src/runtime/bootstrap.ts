import type { PlaygroundNodeSchema } from '../types/playground'
import {
  defineCustomComponents,
  monacoRuntime,
  setCustomComponents,
  setKaTeXWorker,
  setMermaidWorker,
} from 'markstream-svelte'
import KatexWorker from 'markstream-svelte/workers/katexRenderer.worker?worker&inline'
import MermaidWorker from 'markstream-svelte/workers/mermaidParser.worker?worker&inline'
import ThinkingNode from '../components/ThinkingNode.svelte'
import { PLAYGROUND_CUSTOM_ID } from '../config/playground'

const playgroundCustomComponents
  = defineCustomComponents<PlaygroundNodeSchema>({
    thinking: ThinkingNode,
  })

let bootstrapped = false

export function bootstrapPlaygroundRuntime() {
  if (bootstrapped)
    return

  bootstrapped = true
  setKaTeXWorker(new KatexWorker())
  setMermaidWorker(new MermaidWorker())
  setCustomComponents(PLAYGROUND_CUSTOM_ID, playgroundCustomComponents)
  void monacoRuntime.preload()
}
