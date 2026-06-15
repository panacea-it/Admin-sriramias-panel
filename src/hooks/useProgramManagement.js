import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRateLimitError } from '../utils/apiError'
import { clearProgramsListCache, getPrograms } from '../services/programService'
import {
  mapProgramStatusFilterToApi,
  matchesProgramSearch,
  normalizeProgramsListResponse,
} from '../utils/programHelpers'
import {
  createListFetchGuard,
  invalidateListSession,
  getListSessionCache,
  runGuardedListFetch,
  MASTER_LIST_RATE_LIMIT_MESSAGE,
} from './useMasterListQuery'

const SESSION_SCOPE = 'programs'

function buildListParams({ statusFilter, centreFilter }) {
  const params = {}

  const apiStatus = mapProgramStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  if (centreFilter !== 'all') params.center = centreFilter

  return params
}

function buildSessionKey(params) {
  return `${SESSION_SCOPE}:${JSON.stringify(params)}`
}

function getInitialState() {
  const params = buildListParams({ statusFilter: 'all', centreFilter: 'all' })
  const cached = getListSessionCache(buildSessionKey(params))
  return {
    programs: cached ?? [],
    loading: cached == null,
  }
}

export function useProgramManagement() {
  const initial = useMemo(() => getInitialState(), [])
  const [programs, setPrograms] = useState(initial.programs)
  const [loading, setLoading] = useState(initial.loading)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centreFilter, setCentreFilter] = useState('all')
  const fetchGuardRef = useRef(null)

  if (!fetchGuardRef.current) {
    fetchGuardRef.current = createListFetchGuard()
  }
  const fetchGuard = fetchGuardRef.current

  const loadPrograms = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ statusFilter, centreFilter })
      const sessionKey = buildSessionKey(params)

      await runGuardedListFetch({
        fetchGuard,
        sessionKey,
        bypassCache,
        ignoreFlag,
        setLoading,
        fetchFn: () => getPrograms(params, { bypassCache }),
        applyData: (data) => setPrograms(normalizeProgramsListResponse(data)),
        handleError: (error, { hydratedFromSession }) => {
          if (import.meta.env.DEV) {
            console.error(error)
          }
          if (isRateLimitError(error)) {
            fetchGuard.toastListError(MASTER_LIST_RATE_LIMIT_MESSAGE)
            return
          }
          fetchGuard.toastListError(
            fetchGuard.getListErrorMessage(error, 'Failed to load programs'),
          )
          if (!hydratedFromSession) {
            setPrograms([])
          }
        },
        errorFallback: 'Failed to load programs',
      })
    },
    [statusFilter, centreFilter, fetchGuard],
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
    invalidateListSession(SESSION_SCOPE)
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
