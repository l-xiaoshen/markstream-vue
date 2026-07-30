export function readProperty(value: unknown, key: string): unknown {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function')
    return undefined
  return Reflect.get(value, key)
}
