import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { clearProgramsListCache, getPrograms } from '../services/programService'
import {
  mapProgramStatusFilterToApi,
  normalizeProgramsListResponse,
} from '../utils/programHelpers'

function buildListParams({ debouncedSearch, statusFilter, centreFilter }) {
  const params = {
    search: debouncedSearch.trim(),
  }

  const apiStatus = mapProgramStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centreFilter !== 'all') params.center = centreFilter

  return params
}

export function useProgramManagement() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centreFilter, setCentreFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)
  const lastErrorToastAt = useRef(0)

  const loadPrograms = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ debouncedSearch, statusFilter, centreFilter })

      setLoading(true)
      try {
        const data = await getPrograms(params, { bypassCache })
        if (ignoreFlag?.()) return
        setPrograms(normalizeProgramsListResponse(data))
      } catch (error) {
        if (ignoreFlag?.()) return
        if (import.meta.env.DEV) {
          console.error(error)
        }
        if (!isRateLimitError(error)) {
          const now = Date.now()
          if (now - lastErrorToastAt.current > 4000) {
            lastErrorToastAt.current = now
            toast.error(getApiErrorMessage(error, 'Failed to load programs'))
          }
          setPrograms([])
        } else {
          const now = Date.now()
          if (now - lastErrorToastAt.current > 4000) {
            lastErrorToastAt.current = now
            toast.error('Too many requests. Please wait a moment and try again.')
          }
        }
      } finally {
        if (!ignoreFlag?.()) {
          setLoading(false)
        }
      }
    },
    [debouncedSearch, statusFilter, centreFilter],
  )

  useEffect(() => {
    let ignore = false
    loadPrograms({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadPrograms])

  const enrichedPrograms = useMemo(
    () =>
      programs.map((row) => ({
        ...row,
        linkedCount: row.linkedCount ?? 0,
      })),
    [programs],
  )

  const refreshPrograms = useCallback(async () => {
    clearProgramsListCache()
    await loadPrograms({ bypassCache: true })
  }, [loadPrograms])

  const patchProgramLocally = useCallback((programId, patch) => {
    setPrograms((prev) =>
      prev.map((row) => (String(row.id) === String(programId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeProgramLocally = useCallback((programId) => {
    setPrograms((prev) => prev.filter((row) => String(row.id) !== String(programId)))
  }, [])

  return {
    programs: enrichedPrograms,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centreFilter,
    setCentreFilter,
    debouncedSearch,
    refreshPrograms,
    patchProgramLocally,
    removeProgramLocally,
  }
}
