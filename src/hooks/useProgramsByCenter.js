import { useCallback, useEffect, useState } from 'react'
import { getProgramsByCenter } from '../services/examCategoryService'
import {
  formatProgramOptionLabel,
  normalizeProgramsByCenterResponse,
} from '../utils/examCategoryApiHelpers'

export function useProgramsByCenter(centerId) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (id) => {
    if (!id) {
      setPrograms([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getProgramsByCenter(id)
      setPrograms(normalizeProgramsByCenterResponse(data))
    } catch {
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!centerId) {
        setPrograms([])
        return
      }
      setLoading(true)
      try {
        const data = await getProgramsByCenter(centerId)
        if (!cancelled) {
          setPrograms(normalizeProgramsByCenterResponse(data))
        }
      } catch {
        if (!cancelled) setPrograms([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [centerId])

  return {
    programs,
    loading,
    programOptions: programs.map((p) => ({
      value: String(p.apiRef || p.id),
      label: formatProgramOptionLabel(p),
      mongoId: p.mongoId || '',
      businessProgramId: p.businessProgramId || p.programId || '',
    })),
    reload: () => load(centerId),
  }
}
