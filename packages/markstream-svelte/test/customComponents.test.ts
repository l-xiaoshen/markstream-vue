import type { Component } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { createCustomComponentRegistry } from '../src/customComponents'

const GlobalProbe: Component = () => ({})
const ScopedProbe: Component = () => ({})

describe('custom component registry', () => {
  it('isolates state between registry instances', () => {
    const first = createCustomComponentRegistry()
    const second = createCustomComponentRegistry()

    first.setCustomComponents({ thinking: GlobalProbe })

    expect(first.getCustomNodeComponents().thinking).toBe(GlobalProbe)
    expect(second.getCustomNodeComponents().thinking).toBeUndefined()
  })

  it('merges scoped components over global defaults', () => {
    const registry = createCustomComponentRegistry()
    registry.setCustomComponents({ thinking: GlobalProbe })
    registry.setCustomComponents('conversation', { thinking: ScopedProbe })

    expect(registry.getCustomNodeComponents('conversation').thinking)
      .toBe(ScopedProbe)
    expect(registry.getCustomNodeComponents('other').thinking)
      .toBe(GlobalProbe)
  })

  it('notifies subscribers exactly once per mutation', () => {
    const registry = createCustomComponentRegistry()
    const listener = vi.fn()
    const unsubscribe = registry.subscribeCustomComponents(listener)

    registry.setCustomComponents({ thinking: GlobalProbe })
    unsubscribe()
    registry.clearGlobalCustomComponents()

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
