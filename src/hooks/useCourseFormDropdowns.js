import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import {
  getCategories,
  getCenters,
  getProgramsByCenter,
  getSubCategories,
} from '../services/courseDropdownService'
import {
  normalizeCategoryDropdownOptions,
  normalizeCenterDropdownOptions,
  normalizeProgramDropdownOptions,
  normalizeSubCategoryDropdownOptions,
} from '../utils/courseDropdownApiHelpers'

export function useCourseFormDropdowns({ open, centerId, programId, categoryId }) {
  const [centerOptions, setCenterOptions] = useState([])
  const [programOptions, setProgramOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [subCategoryOptions, setSubCategoryOptions] = useState([])

  const [centerLoading, setCenterLoading] = useState(false)
  const [programLoading, setProgramLoading] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [subCategoryLoading, setSubCategoryLoading] = useState(false)

  const clearDependentOptions = useCallback(() => {
    setProgramOptions([])
    setCategoryOptions([])
    setSubCategoryOptions([])
  }, [])

  const resetAllDropdowns = useCallback(() => {
    setCenterOptions([])
    clearDependentOptions()
    setCenterLoading(false)
    setProgramLoading(false)
    setCategoryLoading(false)
    setSubCategoryLoading(false)
  }, [clearDependentOptions])

  useEffect(() => {
    if (!open) {
      resetAllDropdowns()
      return
    }

    let cancelled = false

    async function loadCenters() {
      setCenterLoading(true)
      try {
        const data = await getCenters()
        if (!cancelled) {
          setCenterOptions(normalizeCenterDropdownOptions(data))
        }
      } catch (error) {
        if (!cancelled) {
          setCenterOptions([])
          toast.error(getApiErrorMessage(error, 'Failed to load centers'))
        }
      } finally {
        if (!cancelled) setCenterLoading(false)
      }
    }

    loadCenters()
    return () => {
      cancelled = true
    }
  }, [open, resetAllDropdowns])

  useEffect(() => {
    if (!open || !centerId) {
      setProgramOptions([])
      setProgramLoading(false)
      return
    }

    let cancelled = false

    async function loadPrograms() {
      setProgramLoading(true)
      try {
        const data = await getProgramsByCenter(centerId)
        if (!cancelled) {
          setProgramOptions(normalizeProgramDropdownOptions(data))
        }
      } catch (error) {
        if (!cancelled) {
          setProgramOptions([])
          toast.error(getApiErrorMessage(error, 'Failed to load programs'))
        }
      } finally {
        if (!cancelled) setProgramLoading(false)
      }
    }

    loadPrograms()
    return () => {
      cancelled = true
    }
  }, [open, centerId])

  useEffect(() => {
    if (!open || !centerId || !programId) {
      setCategoryOptions([])
      setCategoryLoading(false)
      return
    }

    let cancelled = false

    async function loadCategories() {
      setCategoryLoading(true)
      try {
        const data = await getCategories(centerId, programId)
        if (!cancelled) {
          setCategoryOptions(normalizeCategoryDropdownOptions(data))
        }
      } catch (error) {
        if (!cancelled) {
          setCategoryOptions([])
          toast.error(getApiErrorMessage(error, 'Failed to load categories'))
        }
      } finally {
        if (!cancelled) setCategoryLoading(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [open, centerId, programId])

  useEffect(() => {
    if (!open || !centerId || !programId || !categoryId) {
      setSubCategoryOptions([])
      setSubCategoryLoading(false)
      return
    }

    let cancelled = false

    async function loadSubCategories() {
      setSubCategoryLoading(true)
      try {
        const data = await getSubCategories(centerId, programId, categoryId)
        if (!cancelled) {
          setSubCategoryOptions(normalizeSubCategoryDropdownOptions(data))
        }
      } catch (error) {
        if (!cancelled) {
          setSubCategoryOptions([])
          toast.error(getApiErrorMessage(error, 'Failed to load subcategories'))
        }
      } finally {
        if (!cancelled) setSubCategoryLoading(false)
      }
    }

    loadSubCategories()
    return () => {
      cancelled = true
    }
  }, [open, centerId, programId, categoryId])

  return {
    centerOptions,
    programOptions,
    categoryOptions,
    subCategoryOptions,
    centerLoading,
    programLoading,
    categoryLoading,
    subCategoryLoading,
    clearDependentOptions,
    resetAllDropdowns,
  }
}
