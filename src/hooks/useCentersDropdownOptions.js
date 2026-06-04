import { useEffect, useMemo, useRef, useState } from 'react'
import { useCenters } from '../contexts/CentersContext'
import { getCentersDropdown, normalizeCentersDropdown } from '../services/centerService'

let sharedDropdownPromise = null
let sharedDropdownOptions = null
let sharedDropdownLoadedAt = 0
const DROPDOWN_TTL_MS = 5 * 60_000

async function loadCentersDropdownOnce() {
  if (sharedDropdownOptions && Date.now() - sharedDropdownLoadedAt < DROPDOWN_TTL_MS) {
    return sharedDropdownOptions
  }

  if (!sharedDropdownPromise) {
    sharedDropdownPromise = getCentersDropdown()
      .then((centersResponse) => {
        if (import.meta.env.DEV) {
          console.log('Centers Response:', centersResponse)
        }
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

export function useCentersDropdownOptions() {
  const { activeCenters } = useCenters()
  const [options, setOptions] = useState(() => sharedDropdownOptions || [])
  const [loading, setLoading] = useState(() => !sharedDropdownOptions)
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

  useEffect(() => {
    mountedRef.current = true

    if (sharedDropdownOptions?.length) {
      setOptions(sharedDropdownOptions)
      setLoading(false)
      setError(null)
      return () => {
        mountedRef.current = false
      }
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    loadCentersDropdownOnce()
      .then((mapped) => {
        if (cancelled || !mountedRef.current) return
        const safeMapped = Array.isArray(mapped) ? mapped : []
        if (safeMapped.length > 0) {
          setOptions(safeMapped)
        }
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setOptions([])
          setError(err?.message || 'Failed to load centers')
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [])

  const resolvedOptions = options.length > 0 ? options : fallbackOptions

  return {
    options: Array.isArray(resolvedOptions) ? resolvedOptions : [],
    loading,
    error,
  }
}
