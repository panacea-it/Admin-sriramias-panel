import { useCallback, useEffect, useRef, useState } from 'react'
import { getSubjectsDropdown } from '../services/subjectService'
import { normalizeSubjectsDropdownResponse } from '../pages/academics/categories/subject/subjectHelpers'

function mapSubjectOptionsForNcert(data) {
  return normalizeSubjectsDropdownResponse(data).map((option) => ({
    value: option.label,
    label: option.label,
  }))
}

export function useNcertBookDropdowns(open, enabled) {
  const [subjectOptions, setSubjectOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const loadDropdowns = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const data = await getSubjectsDropdown()
      if (controller.signal.aborted) return
      setSubjectOptions(mapSubjectOptionsForNcert(data))
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      setSubjectOptions([])
      setError(err)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open || !enabled) {
      abortRef.current?.abort()
      setLoading(false)
      return undefined
    }

    loadDropdowns()

    return () => {
      abortRef.current?.abort()
    }
  }, [open, enabled, loadDropdowns])

  const retry = useCallback(() => {
    loadDropdowns()
  }, [loadDropdowns])

  return {
    subjectOptions,
    loading,
    error,
    retry,
  }
}
