import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import { getPrograms } from '../services/programService'
import {
  mapProgramStatusFilterToApi,
  normalizeProgramsListResponse,
} from '../utils/programHelpers'

export function useProgramManagement() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [centreFilter, setCentreFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 500)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        search: debouncedSearch.trim(),
      }

      const apiStatus = mapProgramStatusFilterToApi(statusFilter)
      if (apiStatus) params.status = apiStatus
      if (centreFilter !== 'all') params.center = centreFilter

      const data = await getPrograms(params)
      setPrograms(normalizeProgramsListResponse(data))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load programs'))
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, centreFilter])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const enrichedPrograms = useMemo(
    () =>
      programs.map((row) => ({
        ...row,
        linkedCount: row.linkedCount ?? 0,
      })),
    [programs],
  )

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
    refreshPrograms: fetchPrograms,
    patchProgramLocally,
    removeProgramLocally,
  }
}
