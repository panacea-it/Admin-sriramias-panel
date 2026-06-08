export function createCachedRequest({ ttlMs = 60_000, maxEntries = 32 } = {}) {
  const cache = new Map()
  const inFlight = new Map()

  function makeKey(key) {
    if (typeof key === 'string') return key
    return JSON.stringify(key)
  }

  function getCached(key) {
    const entry = cache.get(makeKey(key))
    if (!entry) return undefined
    if (Date.now() - entry.at > ttlMs) {
      cache.delete(makeKey(key))
      return undefined
    }
    return entry.data
  }

  function setCached(key, data) {
    const cacheKey = makeKey(key)
    if (cache.size >= maxEntries) {
      const oldest = cache.keys().next().value
      if (oldest) cache.delete(oldest)
    }
    cache.set(cacheKey, { data, at: Date.now() })
  }

  function clear(key) {
    if (key === undefined) {
      cache.clear()
      inFlight.clear()
      return
    }
    const cacheKey = makeKey(key)
    cache.delete(cacheKey)
    inFlight.delete(cacheKey)
  }

  async function fetch(key, requestFn, { bypass = false } = {}) {
    const cacheKey = makeKey(key)

    if (!bypass) {
      const cached = getCached(key)
      if (cached !== undefined) return cached
    } else {
      cache.delete(cacheKey)
      inFlight.delete(cacheKey)
    }

    const pending = inFlight.get(cacheKey)
    if (pending) return pending

    const promise = Promise.resolve()
      .then(requestFn)
      .then((data) => {
        setCached(key, data)
        inFlight.delete(cacheKey)
        return data
      })
      .catch((error) => {
        inFlight.delete(cacheKey)
        throw error
      })

    inFlight.set(cacheKey, promise)
    return promise
  }

  return { fetch, clear, getCached }
}
