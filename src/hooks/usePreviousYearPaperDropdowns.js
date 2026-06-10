import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchExamCategoriesDropdown,
  fetchPaperTypesDropdown,
  fetchYearsDropdown,
} from '../api/freeResourcesAPI'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  normalizeExamCategoryDropdownOptions,
  normalizePaperTypeDropdownOptions,
  normalizeYearDropdownOptions,
} from '../utils/freeResourceApiHelpers'

const EXAM_CACHE_KEY = 'free-resource-exam-categories'
const PAPER_TYPE_CACHE_KEY = 'free-resource-paper-types'
const YEAR_CACHE_KEY = 'free-resource-years'

const examCache = createCachedRequest({ ttlMs: 5 * 60_000 })
const paperTypeCache = createCachedRequest({ ttlMs: 5 * 60_000 })
const yearCache = createCachedRequest({ ttlMs: 5 * 60_000 })

function resolveSettledDropdown({ result, label, normalize }) {
  if (result.status === 'fulfilled') {
    const options = normalize(result.value)
    return { options, error: null }
  }

  const err = result.reason
  if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
    return { options: [], error: null, canceled: true }
  }

  return { options: normalize(null), error: null }
}

export function usePreviousYearPaperDropdowns(open, enabled) {
  const [examCategoryOptions, setExamCategoryOptions] = useState([])
  const [paperTypeOptions, setPaperTypeOptions] = useState([])
  const [yearOptions, setYearOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const applyCachedDropdowns = useCallback(() => {
    const cachedExam = examCache.getCached(EXAM_CACHE_KEY)
    const cachedPaperTypes = paperTypeCache.getCached(PAPER_TYPE_CACHE_KEY)
    const cachedYears = yearCache.getCached(YEAR_CACHE_KEY)

    if (
      cachedExam === undefined ||
      cachedPaperTypes === undefined ||
      cachedYears === undefined
    ) {
      return false
    }

    setExamCategoryOptions(normalizeExamCategoryDropdownOptions(cachedExam))
    setPaperTypeOptions(normalizePaperTypeDropdownOptions(cachedPaperTypes))
    setYearOptions(normalizeYearDropdownOptions(cachedYears))
    setLoading(false)
    setError(null)
    return true
  }, [])

  const loadDropdowns = useCallback(async ({ bypassCache = false } = {}) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const [examResult, paperTypeResult, yearResult] = await Promise.allSettled([
        examCache.fetch(
          EXAM_CACHE_KEY,
          () => fetchExamCategoriesDropdown({ signal: controller.signal }),
          { bypass: bypassCache },
        ),
        paperTypeCache.fetch(
          PAPER_TYPE_CACHE_KEY,
          () => fetchPaperTypesDropdown({ signal: controller.signal }),
          { bypass: bypassCache },
        ),
        yearCache.fetch(
          YEAR_CACHE_KEY,
          () => fetchYearsDropdown({ signal: controller.signal }),
          { bypass: bypassCache },
        ),
      ])

      if (controller.signal.aborted || requestIdRef.current !== requestId) return

      const exam = resolveSettledDropdown({
        result: examResult,
        label: 'Exam categories',
        normalize: normalizeExamCategoryDropdownOptions,
      })
      const paperType = resolveSettledDropdown({
        result: paperTypeResult,
        label: 'Paper types',
        normalize: normalizePaperTypeDropdownOptions,
      })
      const year = resolveSettledDropdown({
        result: yearResult,
        label: 'Years',
        normalize: normalizeYearDropdownOptions,
      })

      if (exam.canceled || paperType.canceled || year.canceled) return

      setExamCategoryOptions(exam.options)
      setPaperTypeOptions(paperType.options)
      setYearOptions(year.options)

      setError(null)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      if (requestIdRef.current !== requestId) return

      setError(null)
      setExamCategoryOptions(normalizeExamCategoryDropdownOptions(null))
      setPaperTypeOptions(normalizePaperTypeDropdownOptions(null))
      setYearOptions(normalizeYearDropdownOptions(null))
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      examCache.clear(EXAM_CACHE_KEY)
      paperTypeCache.clear(PAPER_TYPE_CACHE_KEY)
      yearCache.clear(YEAR_CACHE_KEY)
      setLoading(false)
      setError(null)
      return undefined
    }

    if (!enabled) {
      abortRef.current?.abort()
      setLoading(false)
      return undefined
    }

    if (applyCachedDropdowns()) {
      return () => {
        abortRef.current?.abort()
      }
    }

    loadDropdowns()

    return () => {
      abortRef.current?.abort()
    }
  }, [open, enabled, loadDropdowns, applyCachedDropdowns])

  const retry = useCallback(() => {
    loadDropdowns({ bypassCache: true })
  }, [loadDropdowns])

  return {
    examCategoryOptions,
    paperTypeOptions,
    yearOptions,
    loading,
    error,
    retry,
  }
}
