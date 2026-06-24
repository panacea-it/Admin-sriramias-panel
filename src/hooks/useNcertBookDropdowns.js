import { useCallback, useEffect, useRef, useState } from 'react'
import { freeResourceService } from '../services/freeResourceService'
import { createCachedRequest } from '../utils/apiRequestCache'

const SUBJECT_CACHE_KEY = 'free-resource-ncert-subjects'
const CLASS_CACHE_KEY = 'free-resource-ncert-classes'

const subjectCache = createCachedRequest({ ttlMs: 5 * 60_000 })
const classCache = createCachedRequest({ ttlMs: 5 * 60_000 })

function mapStringArrayToOptions(data) {
  const items = Array.isArray(data) ? data : []
  return items.map((value) => ({
    value: String(value),
    label: String(value),
  }))
}

export function useNcertBookDropdowns(open, enabled) {
  const [subjectOptions, setSubjectOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const loadDropdowns = useCallback(async ({ bypassCache = false } = {}) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const [subjectsData, classesData] = await Promise.all([
        subjectCache.fetch(
          SUBJECT_CACHE_KEY,
          () => freeResourceService.getNcertSubjectsDropdown({ signal: controller.signal }),
          { bypass: bypassCache },
        ),
        classCache.fetch(
          CLASS_CACHE_KEY,
          () => freeResourceService.getNcertClassesDropdown({ signal: controller.signal }),
          { bypass: bypassCache },
        ),
      ])

      if (controller.signal.aborted) return

      setSubjectOptions(mapStringArrayToOptions(subjectsData))
      setClassOptions(mapStringArrayToOptions(classesData))
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      setSubjectOptions([])
      setClassOptions([])
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
    loadDropdowns({ bypassCache: true })
  }, [loadDropdowns])

  return {
    subjectOptions,
    classOptions,
    loading,
    error,
    retry,
  }
}
