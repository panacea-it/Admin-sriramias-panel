import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import {
  getFacultySubjectCategories,
  getFacultySubjectCreateForm,
} from '../api/facultySubjectsAPI'
import { normalizeFacultySubjectCreateFormResponse } from '../utils/facultySubjectHelpers'

const BASE_CACHE_TTL_MS = 60_000
const CREATE_FORM_CACHE_TTL_MS = 30_000

let baseOptionsCache = { subjects: [], categories: [], at: 0 }
const createFormCache = new Map()

function isCacheFresh(at, ttlMs) {
  return at > 0 && Date.now() - at < ttlMs
}

function readCreateFormCache(subjectId) {
  const entry = createFormCache.get(subjectId)
  if (!entry || !isCacheFresh(entry.at, CREATE_FORM_CACHE_TTL_MS)) return null
  return entry.data
}

function writeCreateFormCache(subjectId, data) {
  createFormCache.set(subjectId, { data, at: Date.now() })
}

export function clearFacultySubjectFormOptionsCache() {
  baseOptionsCache = { subjects: [], categories: [], at: 0 }
  createFormCache.clear()
}

export function useFacultySubjectFormOptions({ open, enabled = true }) {
  const [subjectOptions, setSubjectOptions] = useState(baseOptionsCache.subjects)
  const [topicOptions, setTopicOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState(baseOptionsCache.categories)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingFormOptions, setLoadingFormOptions] = useState(false)
  const formAbortRef = useRef(null)
  const baseAbortRef = useRef(null)
  const formSeqRef = useRef(0)
  const lastFormSubjectRef = useRef('')

  const mergeSelectOptions = (current, incoming) => {
    const map = new Map(current.map((o) => [o.value, o]))
    incoming.forEach((o) => {
      if (o?.value) map.set(o.value, o)
    })
    return [...map.values()]
  }

  const seedFormOptions = useCallback(({ topics = [], teachers = [] } = {}) => {
    if (topics.length) setTopicOptions((prev) => mergeSelectOptions(prev, topics))
    if (teachers.length) setTeacherOptions((prev) => mergeSelectOptions(prev, teachers))
  }, [])

  const resetOptions = useCallback(() => {
    setTopicOptions([])
    setTeacherOptions([])
    lastFormSubjectRef.current = ''
  }, [])

  const loadBaseDropdowns = useCallback(async ({ signal, useCache = true } = {}) => {
    if (
      useCache &&
      isCacheFresh(baseOptionsCache.at, BASE_CACHE_TTL_MS) &&
      baseOptionsCache.subjects.length &&
      baseOptionsCache.categories.length
    ) {
      setSubjectOptions(baseOptionsCache.subjects)
      setCategoryOptions(baseOptionsCache.categories)
      return
    }

    setLoadingSubjects(true)
    setLoadingCategories(true)

    const subjectsPromise = getFacultySubjectCreateForm(undefined, { signal })
      .then((data) => {
        const normalized = normalizeFacultySubjectCreateFormResponse(data)
        const subjects = normalized.subjects
        setSubjectOptions(subjects)
        baseOptionsCache = {
          ...baseOptionsCache,
          subjects,
          at: Date.now(),
        }
      })
      .catch((error) => {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        if (baseOptionsCache.subjects.length) {
          setSubjectOptions(baseOptionsCache.subjects)
          return
        }
        setSubjectOptions([])
        toast.error(getApiErrorMessage(error, 'Failed to load subjects'))
      })
      .finally(() => setLoadingSubjects(false))

    const categoriesPromise = getFacultySubjectCategories({ signal })
      .then((options) => {
        const categories = Array.isArray(options) ? options : []
        setCategoryOptions(categories)
        baseOptionsCache = {
          ...baseOptionsCache,
          categories,
          at: Date.now(),
        }
      })
      .catch((error) => {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        if (baseOptionsCache.categories.length) {
          setCategoryOptions(baseOptionsCache.categories)
          return
        }
        setCategoryOptions([])
        toast.error(getApiErrorMessage(error, 'Failed to load categories'))
      })
      .finally(() => setLoadingCategories(false))

    await Promise.allSettled([subjectsPromise, categoriesPromise])
  }, [])

  const loadCreateFormOptions = useCallback(
    async (subjectId, { force = false, merge = false } = {}) => {
      const id = String(subjectId || '').trim()
      if (!id) {
        setTopicOptions([])
        setTeacherOptions([])
        setLoadingFormOptions(false)
        lastFormSubjectRef.current = ''
        return null
      }

      if (!force && id === lastFormSubjectRef.current) {
        const cached = readCreateFormCache(id)
        return cached
      }

      if (!force) {
        const cached = readCreateFormCache(id)
        if (cached) {
          if (cached.subjects.length) {
            setSubjectOptions((prev) => mergeSelectOptions(prev, cached.subjects))
          }
          if (merge) {
            setTopicOptions((prev) => mergeSelectOptions(prev, cached.topics))
            setTeacherOptions((prev) => mergeSelectOptions(prev, cached.teachers))
          } else {
            setTopicOptions(cached.topics)
            setTeacherOptions(cached.teachers)
          }
          lastFormSubjectRef.current = id
          return cached
        }
      }

      formAbortRef.current?.abort()
      const controller = new AbortController()
      formAbortRef.current = controller
      const seq = ++formSeqRef.current

      setLoadingFormOptions(true)
      try {
        const data = await getFacultySubjectCreateForm(id, { signal: controller.signal })
        if (seq !== formSeqRef.current) return null
        const normalized = normalizeFacultySubjectCreateFormResponse(data)
        writeCreateFormCache(id, normalized)
        if (normalized.subjects.length) {
          setSubjectOptions((prev) => mergeSelectOptions(prev, normalized.subjects))
        }
        if (merge) {
          setTopicOptions((prev) => mergeSelectOptions(prev, normalized.topics))
          setTeacherOptions((prev) => mergeSelectOptions(prev, normalized.teachers))
        } else {
          setTopicOptions(normalized.topics)
          setTeacherOptions(normalized.teachers)
        }
        lastFormSubjectRef.current = id
        return normalized
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return null
        if (seq !== formSeqRef.current) return null
        setTopicOptions([])
        setTeacherOptions([])
        toast.error(getApiErrorMessage(error, 'Failed to load topics and faculty'))
        return null
      } finally {
        if (seq === formSeqRef.current) setLoadingFormOptions(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!open || !enabled) return undefined

    resetOptions()
    baseAbortRef.current?.abort()
    const controller = new AbortController()
    baseAbortRef.current = controller
    loadBaseDropdowns({ signal: controller.signal })

    return () => {
      controller.abort()
      formAbortRef.current?.abort()
    }
  }, [open, enabled, resetOptions, loadBaseDropdowns])

  return {
    subjectOptions,
    topicOptions,
    teacherOptions,
    categoryOptions,
    loadingSubjects,
    loadingCategories,
    loadingFormOptions,
    loadCreateFormOptions,
    seedFormOptions,
    resetOptions,
  }
}
