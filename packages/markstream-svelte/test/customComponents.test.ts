import type { Component } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import {
  createCustomComponentProps,
  createCustomComponentRegistry,
} from '../src/customComponents'

const GlobalProbe: Component = () => ({})
const ScopedProbe: Component = () => ({})

describe('custom component registry', () => {
  it('supplies canonical props and deprecated context aliases', () => {
    const context = {
      customId: 'conversation',
      events: {},
      fade: false,
      isDark: true,
      typewriter: false,
    }
    const node = {
      content: 'work',
      raw: '<thinking>work</thinking>',
      type: 'thinking',
    }

    const props = createCustomComponentProps(node, context, 'thinking-0')

    expect(props).toEqual({
      node,
      context,
      indexKey: 'thinking-0',
      ctx: context,
      customId: 'conversation',
      fade: false,
      isDark: true,
      typewriter: false,
    })
  })

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
