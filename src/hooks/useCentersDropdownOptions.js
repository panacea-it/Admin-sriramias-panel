import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { useCenters } from '../contexts/CentersContext'
import { getCentersDropdown, normalizeCentersDropdown } from '../services/centerService'
import { getApiErrorMessage } from '../utils/apiError'

let sharedDropdownPromise = null
let sharedDropdownOptions = null
let sharedDropdownLoadedAt = 0
const DROPDOWN_TTL_MS = 5 * 60_000

export function clearCentersDropdownOptionsCache() {
  sharedDropdownPromise = null
  sharedDropdownOptions = null
  sharedDropdownLoadedAt = 0
}

async function loadCentersDropdownOnce({ force = false } = {}) {
  if (
    !force &&
    sharedDropdownOptions &&
    Date.now() - sharedDropdownLoadedAt < DROPDOWN_TTL_MS
  ) {
    return sharedDropdownOptions
  }

  if (!sharedDropdownPromise || force) {
    sharedDropdownPromise = getCentersDropdown()
      .then((centersResponse) => {
        const mapped = normalizeCentersDropdown(centersResponse)
        const safeMapped = Array.isArray(mapped) ? mapped : []
        if (safeMapped.length > 0) {
          sharedDropdownOptions = safeMapped
          sharedDropdownLoadedAt = Date.now()
        }
        return safeMapped
      })
      .finally(() => {
        sharedDropdownPromise = null
      })
  }

  return sharedDropdownPromise
}

export function useCentersDropdownOptions({ enabled = true } = {}) {
  const { activeCenters } = useCenters()
  const [options, setOptions] = useState(() => sharedDropdownOptions || [])
  const [loading, setLoading] = useState(() => enabled && !sharedDropdownOptions)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fallbackOptions = useMemo(
    () =>
      (Array.isArray(activeCenters) ? activeCenters : []).map((c) => ({
        value: String(c.centerId),
        label: c.centerName,
      })),
    [activeCenters],
  )

  const fetchOptions = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const mapped = await loadCentersDropdownOnce({ force })
      if (!mountedRef.current) return
      const safeMapped = Array.isArray(mapped) ? mapped : []
      if (safeMapped.length > 0) {
        setOptions(safeMapped)
      } else if (fallbackOptions.length > 0) {
        setOptions(fallbackOptions)
      } else {
        setOptions([])
      }
    } catch (err) {
      if (!mountedRef.current) return
      const message = getApiErrorMessage(err, 'Failed to load centers')
      setError(message)
      toast.error(message)
      setOptions(fallbackOptions.length > 0 ? fallbackOptions : [])
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, fallbackOptions])

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      return () => {
        mountedRef.current = false
      }
    }

    if (sharedDropdownOptions?.length) {
      setOptions(sharedDropdownOptions)
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
  }, [enabled, fetchOptions])

  const resolvedOptions = options.length > 0 ? options : fallbackOptions

  return {
    options: Array.isArray(resolvedOptions) ? resolvedOptions : [],
    loading,
    error,
    refresh: () => fetchOptions({ force: true }),
  }
}
