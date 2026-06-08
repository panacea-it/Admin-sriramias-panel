import { useEffect, useMemo, useState } from 'react'
import { getCategoriesByCenterAndProgram } from '../services/examSubCategoryService'
import {
  formatExamCategoryOptionLabel,
  normalizeCategoriesFilterResponse,
} from '../utils/examSubCategoryApiHelpers'

export function useCategoriesByCenterAndProgram(centerId, programId) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!centerId || !programId) {
        setCategories([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await getCategoriesByCenterAndProgram(centerId, programId)
        if (!cancelled) {
          setCategories(normalizeCategoriesFilterResponse(data))
        }
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [centerId, programId])

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: String(c.id),
        label: formatExamCategoryOptionLabel(c),
      })),
    [categories],
  )

  return { categories, categoryOptions, loading }
}
