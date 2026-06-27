import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { classSectionService } from '../services/classSectionService'
import { getSubjectsDropdown } from '../services/subjectService'
import { createCachedRequest } from '../utils/apiRequestCache'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'
import { normalizeClassSectionsDropdownResponse } from '../pages/academics/categories/classes/classApiHelpers'
import { normalizeSubjectsDropdownResponse } from '../pages/academics/categories/subject/subjectHelpers'

const SUBJECT_CACHE_KEY = 'free-resource-ncert-subjects'

const subjectCache = createCachedRequest({ ttlMs: 5 * 60_000 })

export function useNcertBookDropdowns(open, enabled, selectedSubjectId) {
  const [subjectOptions, setSubjectOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [error, setError] = useState(null)
  const [classesError, setClassesError] = useState(false)
  const subjectAbortRef = useRef(null)
  const classesAbortRef = useRef(null)

  const loadSubjects = useCallback(async ({ bypassCache = false } = {}) => {
    subjectAbortRef.current?.abort()
    const controller = new AbortController()
    subjectAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const subjectsData = await subjectCache.fetch(
        SUBJECT_CACHE_KEY,
        () => getSubjectsDropdown(),
        { bypass: bypassCache },
      )

      if (controller.signal.aborted) return

      setSubjectOptions(normalizeSubjectsDropdownResponse(subjectsData))
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

  const fetchClassesBySubject = useCallback(async (subjectId) => {
    classesAbortRef.current?.abort()

    const id = String(subjectId || '').trim()
    if (!id || !isMongoObjectId(id)) {
      setClassOptions([])
      setLoadingClasses(false)
      setClassesError(false)
      return
    }

    const controller = new AbortController()
    classesAbortRef.current = controller

    setLoadingClasses(true)
    setClassesError(false)
    setClassOptions([])

    try {
      const data = await classSectionService.getClassSectionsDropdown(id)
      if (controller.signal.aborted) return
      setClassOptions(normalizeClassSectionsDropdownResponse(data))
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      setClassOptions([])
      setClassesError(true)
      toast.error('Unable to load classes. Please try again.')
    } finally {
      if (!controller.signal.aborted) {
        setLoadingClasses(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open || !enabled) {
      subjectAbortRef.current?.abort()
      classesAbortRef.current?.abort()
      setLoading(false)
      setLoadingClasses(false)
      setClassOptions([])
      setClassesError(false)
      return undefined
    }

    loadSubjects()

    return () => {
      subjectAbortRef.current?.abort()
    }
  }, [open, enabled, loadSubjects])

  useEffect(() => {
    if (!open || !enabled) {
      return undefined
    }

    fetchClassesBySubject(selectedSubjectId)

    return () => {
      classesAbortRef.current?.abort()
    }
  }, [open, enabled, selectedSubjectId, fetchClassesBySubject])

  const retry = useCallback(() => {
    loadSubjects({ bypassCache: true })
  }, [loadSubjects])

  return {
    subjectOptions,
    classOptions,
    loading,
    loadingClasses,
    error,
    classesError,
    retry,
    fetchClassesBySubject,
  }
}
