import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getCentersDropdown, normalizeCentersDropdown } from '../services/centerService'
import {
  fetchCentersDropdownOptions as fetchAdminCentersDropdownOptions,
} from '../services/adminAccessService'
import { getApiErrorMessage } from '../utils/apiError'

const DROPDOWN_TTL_MS = 5 * 60_000

const cacheBySource = {
  default: { promise: null, options: null, loadedAt: 0 },
  admin: { promise: null, options: null, loadedAt: 0 },
}

function getCacheKey(adminManagement) {
  return adminManagement ? 'admin' : 'default'
}

export function clearCentersDropdownOptionsCache() {
  cacheBySource.default = { promise: null, options: null, loadedAt: 0 }
  cacheBySource.admin = { promise: null, options: null, loadedAt: 0 }
}

async function loadCentersDropdownOnce({ force = false, adminManagement = false } = {}) {
  const cacheKey = getCacheKey(adminManagement)
  const cache = cacheBySource[cacheKey]

  if (!force && cache.options && Date.now() - cache.loadedAt < DROPDOWN_TTL_MS) {
    return cache.options
  }

  if (!cache.promise || force) {
    const loader = adminManagement
      ? fetchAdminCentersDropdownOptions
      : async () => {
          const centersResponse = await getCentersDropdown()
          const mapped = normalizeCentersDropdown(centersResponse)
          return Array.isArray(mapped) ? mapped : []
        }

    cache.promise = loader()
      .then((mapped) => {
        const safeMapped = Array.isArray(mapped) ? mapped : []
        if (safeMapped.length > 0) {
          cache.options = safeMapped
          cache.loadedAt = Date.now()
        }
        return safeMapped
      })
      .finally(() => {
        cache.promise = null
      })
  }

  return cache.promise
}

export function useCentersDropdownOptions({ enabled = true, adminManagement = false } = {}) {
  const cacheKey = getCacheKey(adminManagement)
  const initialCache = cacheBySource[cacheKey]

  const [options, setOptions] = useState(() => initialCache.options || [])
  const [loading, setLoading] = useState(() => enabled && !initialCache.options)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fetchOptions = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const mapped = await loadCentersDropdownOnce({ force, adminManagement })
      if (!mountedRef.current) return
      const safeMapped = Array.isArray(mapped) ? mapped : []
      setOptions(safeMapped)
    } catch (err) {
      if (!mountedRef.current) return
      const message = getApiErrorMessage(err, 'Failed to load centers')
      setError(message)
      toast.error(message)
      setOptions([])
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, adminManagement])

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      return () => {
        mountedRef.current = false
      }
    }

    const cached = cacheBySource[cacheKey].options
    if (cached?.length) {
      setOptions(cached)
      setLoading(false)
      setError(null)
      return () => {
        mountedRef.current = false
      }
    }

    fetchOptions()

    return () => {
      mountedRef.current = false
    }
  }, [enabled, adminManagement, cacheKey, fetchOptions])

  return {
    options: Array.isArray(options) ? options : [],
    loading,
    error,
    refresh: () => fetchOptions({ force: true }),
  }
}
