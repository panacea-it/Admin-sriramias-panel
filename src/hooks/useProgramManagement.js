import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { clearProgramsListCache, getPrograms } from '../services/programService'
import {
  mapProgramStatusFilterToApi,
  matchesProgramSearch,
  normalizeProgramsListResponse,
} from '../utils/programHelpers'

function buildListParams({ statusFilter, centreFilter }) {
  const params = {}

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
  const lastErrorToastAt = useRef(0)

  const loadPrograms = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ statusFilter, centreFilter })

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
    [statusFilter, centreFilter],
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

  const filteredPrograms = useMemo(
    () => enrichedPrograms.filter((row) => matchesProgramSearch(row, search)),
    [enrichedPrograms, search],
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
    programs: filteredPrograms,
    totalPrograms: enrichedPrograms.length,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centreFilter,
    setCentreFilter,
    refreshPrograms,
    patchProgramLocally,
    removeProgramLocally,
  }
}
