import type { BaseNode } from 'stream-markdown-parser'
import type { Component } from 'svelte'
import type { SvelteRenderContext } from './types/renderer'

export interface MarkstreamCustomComponentProps<
  TNode extends BaseNode = BaseNode,
> {
  node: TNode
  context?: SvelteRenderContext | undefined
  indexKey?: string | number | undefined
}

export type MarkstreamSvelteComponent<
  TProps extends object = MarkstreamCustomComponentProps,
> = Component<TProps>

type NodeSchema<TSchema> = {
  [TKey in keyof TSchema]: BaseNode
}

/**
 * A component map whose key determines the node contract. NodeOutlet supplies
 * only `MarkstreamCustomComponentProps`.
 *
 * @example
 * ```ts
 * type Nodes = { thinking: ThinkingNode; citation: CitationNode }
 * type Components = CustomComponentMap<Nodes>
 * ```
 */
export type CustomComponentMap<
  TNodeByName extends NodeSchema<TNodeByName> = Record<string, BaseNode>,
> = {
  [TName in keyof TNodeByName]?: MarkstreamSvelteComponent<
    MarkstreamCustomComponentProps<TNodeByName[TName]>
  >
}

export type RuntimeCustomComponentMap = Partial<Record<string, Component>>

export interface CustomComponentRegistry<
  TMapping extends object = RuntimeCustomComponentMap,
> {
  clearGlobalCustomComponents: () => void
  getCustomComponentsRevision: () => number
  getCustomNodeComponents: (customId?: string) => Partial<TMapping>
  removeCustomComponents: (id: string) => void
  setCustomComponents: {
    (id: string, mapping: Partial<TMapping>): void
    (mapping: Partial<TMapping>): void
  }
  subscribeCustomComponents: (listener: () => void) => () => void
}

const GLOBAL_KEY = '__global__'

export function defineCustomComponents<
  TNodeByName extends NodeSchema<TNodeByName>,
>(
  components: CustomComponentMap<TNodeByName>,
): CustomComponentMap<TNodeByName> {
  return components
}

export function createCustomComponentRegistry<
  TMapping extends object = RuntimeCustomComponentMap,
>(): CustomComponentRegistry<TMapping> {
  type Mapping = Partial<TMapping>

  const listeners = new Set<() => void>()
  const scopedComponents = new Map<string, Mapping>()
  let revision = 0

  const bumpRevision = () => {
    revision += 1
    for (const listener of [...listeners]) {
      try {
        listener()
      }
      catch {
        // A failing subscriber must not prevent other registry updates.
      }
    }
  }

  const setCustomComponents = (
    idOrMapping: string | Mapping,
    maybeMapping?: Mapping,
  ) => {
    if (typeof idOrMapping === 'string') {
      if (maybeMapping)
        scopedComponents.set(idOrMapping, { ...maybeMapping })
      else
        scopedComponents.delete(idOrMapping)
    }
    else {
      scopedComponents.set(GLOBAL_KEY, { ...idOrMapping })
    }
    bumpRevision()
  }

  const getCustomNodeComponents = (customId?: string): Mapping => {
    const globalMapping = scopedComponents.get(GLOBAL_KEY)
    const scopedMapping = customId
      ? scopedComponents.get(customId)
      : undefined

    return {
      ...(globalMapping ?? {}),
      ...(scopedMapping ?? {}),
    }
  }

  const removeCustomComponents = (id: string) => {
    if (id === GLOBAL_KEY) {
      throw new Error(
        'removeCustomComponents: use clearGlobalCustomComponents for the global scope.',
      )
    }
    scopedComponents.delete(id)
    bumpRevision()
  }

  return {
    clearGlobalCustomComponents: () => {
      scopedComponents.delete(GLOBAL_KEY)
      bumpRevision()
    },
    getCustomComponentsRevision: () => revision,
    getCustomNodeComponents,
    removeCustomComponents,
    setCustomComponents,
    subscribeCustomComponents: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const defaultCustomComponentRegistry = createCustomComponentRegistry()

export function subscribeCustomComponents(listener: () => void) {
  return defaultCustomComponentRegistry.subscribeCustomComponents(listener)
}

export function getCustomComponentsRevision() {
  return defaultCustomComponentRegistry.getCustomComponentsRevision()
}

function isSvelteComponent(value: unknown): value is Component {
  return typeof value === 'function'
}

export function toRuntimeCustomComponentMap(
  mapping: object,
): RuntimeCustomComponentMap {
  const components: RuntimeCustomComponentMap = {}
  for (const [name, component] of Object.entries(mapping)) {
    if (isSvelteComponent(component))
      components[name] = component
  }
  return components
}

export function setCustomComponents<
  TNodeByName extends NodeSchema<TNodeByName>,
>(
  id: string,
  mapping: CustomComponentMap<TNodeByName>,
): void
export function setCustomComponents<
  TNodeByName extends NodeSchema<TNodeByName>,
>(
  mapping: CustomComponentMap<TNodeByName>,
): void
export function setCustomComponents(
  id: string,
  mapping: RuntimeCustomComponentMap,
): void
export function setCustomComponents(mapping: RuntimeCustomComponentMap): void
export function setCustomComponents(
  idOrMapping: string | object,
  maybeMapping?: object,
) {
  if (typeof idOrMapping === 'string') {
    if (maybeMapping) {
      defaultCustomComponentRegistry.setCustomComponents(
        idOrMapping,
        toRuntimeCustomComponentMap(maybeMapping),
      )
    }
    else {
      defaultCustomComponentRegistry.removeCustomComponents(idOrMapping)
    }
    return
  }
  defaultCustomComponentRegistry.setCustomComponents(
    toRuntimeCustomComponentMap(idOrMapping),
  )
}

export function getCustomNodeComponents(
  customId?: string,
): RuntimeCustomComponentMap {
  return defaultCustomComponentRegistry.getCustomNodeComponents(customId)
}

export function removeCustomComponents(id: string) {
  defaultCustomComponentRegistry.removeCustomComponents(id)
}

export function clearGlobalCustomComponents() {
  defaultCustomComponentRegistry.clearGlobalCustomComponents()
}
