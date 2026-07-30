import { describe, expect, it, vi } from 'vitest'
import { createOptionalPeerRuntime } from '../../src/runtime/optionalPeer'

interface TestValue {
  id: string
}

function createDeferred<Value>() {
  let settle: ((value: Value) => void) | undefined
  const promise = new Promise<Value>((next) => {
    settle = next
  })
  return {
    promise,
    resolve(value: Value) {
      if (!settle)
        throw new Error('Deferred promise is not initialized')
      settle(value)
    },
  }
}

describe('optional peer runtime', () => {
  it('shares an in-flight load and caches its value', async () => {
    const deferred = createDeferred<TestValue>()
    const loader = vi.fn(() => deferred.promise)
    const runtime = createOptionalPeerRuntime(loader)

    const first = runtime.get()
    const second = runtime.get()
    await Promise.resolve()
    expect(loader).toHaveBeenCalledTimes(1)

    const loaded = { id: 'shared' }
    deferred.resolve(loaded)
    await expect(first).resolves.toBe(loaded)
    await expect(second).resolves.toBe(loaded)
    await expect(runtime.get()).resolves.toBe(loaded)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('does not let a stale generation replace a newer cache', async () => {
    const staleLoad = createDeferred<TestValue>()
    const staleLoader = vi.fn(() => staleLoad.promise)
    const freshValue = { id: 'fresh' }
    const freshLoader = vi.fn(() => freshValue)
    const runtime = createOptionalPeerRuntime(staleLoader)

    const staleRequest = runtime.get()
    await Promise.resolve()
    runtime.setLoader(freshLoader)

    await expect(runtime.get()).resolves.toBe(freshValue)
    staleLoad.resolve({ id: 'stale' })
    await expect(staleRequest).resolves.toBeNull()
    await expect(runtime.get()).resolves.toBe(freshValue)
    expect(staleLoader).toHaveBeenCalledTimes(1)
    expect(freshLoader).toHaveBeenCalledTimes(1)
  })

  it('retries a failed load only after its loader is reset', async () => {
    const loader = vi.fn(async (): Promise<TestValue> => {
      throw new Error('unavailable')
    })
    const runtime = createOptionalPeerRuntime(loader)

    await expect(runtime.get()).resolves.toBeNull()
    await expect(runtime.get()).resolves.toBeNull()
    expect(loader).toHaveBeenCalledTimes(1)

    runtime.setLoader(loader)
    await expect(runtime.get()).resolves.toBeNull()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
