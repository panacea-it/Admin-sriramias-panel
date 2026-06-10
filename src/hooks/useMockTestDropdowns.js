import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchExamCategoriesDropdown,
  fetchPaperTypesDropdown,
} from '../api/freeResourcesAPI'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  normalizeExamCategoryDropdownOptions,
  normalizePaperTypeDropdownOptions,
} from '../utils/freeResourceApiHelpers'

const EXAM_CACHE_KEY = 'mock-test-exam-categories'
const PAPER_TYPE_CACHE_KEY = 'mock-test-paper-types'

const examCache = createCachedRequest({ ttlMs: 5 * 60_000 })
const paperTypeCache = createCachedRequest({ ttlMs: 5 * 60_000 })

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

export function useMockTestDropdowns(open, enabled) {
  const [examCategoryOptions, setExamCategoryOptions] = useState([])
  const [paperTypeOptions, setPaperTypeOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const applyCachedDropdowns = useCallback(() => {
    const cachedExam = examCache.getCached(EXAM_CACHE_KEY)
    const cachedPaperTypes = paperTypeCache.getCached(PAPER_TYPE_CACHE_KEY)

    if (cachedExam === undefined || cachedPaperTypes === undefined) {
      return false
    }

    setExamCategoryOptions(normalizeExamCategoryDropdownOptions(cachedExam))
    setPaperTypeOptions(normalizePaperTypeDropdownOptions(cachedPaperTypes))
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
      const [examResult, paperTypeResult] = await Promise.allSettled([
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

      if (exam.canceled || paperType.canceled) return

      setExamCategoryOptions(exam.options)
      setPaperTypeOptions(paperType.options)

      setError(null)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      if (requestIdRef.current !== requestId) return

      setError(null)
      setExamCategoryOptions(normalizeExamCategoryDropdownOptions(null))
      setPaperTypeOptions(normalizePaperTypeDropdownOptions(null))
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
    loading,
    error,
    retry,
  }
}
