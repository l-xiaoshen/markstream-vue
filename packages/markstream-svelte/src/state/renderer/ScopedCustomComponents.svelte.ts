import { createSubscriber } from 'svelte/reactivity'
import {
  getCustomNodeComponents,
  subscribeCustomComponents,
} from '../../customComponents'

export class ScopedCustomComponents {
  #subscribe = createSubscriber((update) => {
    return subscribeCustomComponents(update)
  })

  constructor(private readonly getCustomId: () => string | undefined) {}

  get components() {
    this.#subscribe()
    return getCustomNodeComponents(this.getCustomId())
  }
}
