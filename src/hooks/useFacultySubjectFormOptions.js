import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import {
  getFacultySubjectCategories,
  getFacultySubjectCreateForm,
  getSubjectsDropdown,
} from '../api/facultySubjectsAPI'
import {
  normalizeFacultySubjectCreateFormResponse,
  normalizeSubjectsDropdownResponse,
} from '../utils/facultySubjectHelpers'

export function useFacultySubjectFormOptions({ open, enabled = true }) {
  const [subjectOptions, setSubjectOptions] = useState([])
  const [topicOptions, setTopicOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingFormOptions, setLoadingFormOptions] = useState(false)
  const formAbortRef = useRef(null)
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
    setSubjectOptions([])
    setTopicOptions([])
    setTeacherOptions([])
    setCategoryOptions([])
    lastFormSubjectRef.current = ''
  }, [])

  const loadBaseDropdowns = useCallback(async () => {
    setLoadingSubjects(true)
    setLoadingCategories(true)
    try {
      const subjectsRes = await getSubjectsDropdown()
      setSubjectOptions(normalizeSubjectsDropdownResponse(subjectsRes))
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subjects'))
      setSubjectOptions([])
    } finally {
      setLoadingSubjects(false)
    }

    try {
      const categoryOptions = await getFacultySubjectCategories()
      setCategoryOptions(categoryOptions)
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      setCategoryOptions([])
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  const loadCreateFormOptions = useCallback(async (subjectId, { force = false } = {}) => {
    const id = String(subjectId || '').trim()
    if (!id) {
      setTopicOptions([])
      setTeacherOptions([])
      setLoadingFormOptions(false)
      lastFormSubjectRef.current = ''
      return
    }

    if (!force && id === lastFormSubjectRef.current) return

    formAbortRef.current?.abort()
    const controller = new AbortController()
    formAbortRef.current = controller
    const seq = ++formSeqRef.current

    setLoadingFormOptions(true)
    try {
      const data = await getFacultySubjectCreateForm(id, { signal: controller.signal })
      if (seq !== formSeqRef.current) return
      const normalized = normalizeFacultySubjectCreateFormResponse(data)
      setTopicOptions((prev) => mergeSelectOptions(prev, normalized.topics))
      setTeacherOptions((prev) => mergeSelectOptions(prev, normalized.teachers))
      lastFormSubjectRef.current = id
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      if (seq !== formSeqRef.current) return
      toast.error(getApiErrorMessage(error, 'Failed to load topics and teachers'))
    } finally {
      if (seq === formSeqRef.current) setLoadingFormOptions(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !enabled) return undefined
    resetOptions()
    loadBaseDropdowns()
    return () => {
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
