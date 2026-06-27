import { useCallback, useState } from 'react'
import {
  clearExamSubCategoriesListCache,
  clearSubCategoryDetailCache,
  deleteSubCategory,
} from '../services/examSubCategoryService'
import { clearExamCategoriesListCache } from '../services/examCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-sub-categories'

export function useDeleteExamSubCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async (id) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await deleteSubCategory(id)
      clearExamSubCategoriesListCache()
      clearSubCategoryDetailCache(id)
      clearExamCategoriesListCache()
      invalidateListSession(SESSION_SCOPE)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [])

  const reset = useCallback(() => setError(null), [])

  return { mutateAsync, isPending, error, reset }
}
