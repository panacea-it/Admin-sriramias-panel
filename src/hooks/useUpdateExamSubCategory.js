import { useCallback, useState } from 'react'
import {
  clearExamSubCategoriesListCache,
  clearSubCategoryDetailCache,
  updateSubCategory,
} from '../services/examSubCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-sub-categories'

export function useUpdateExamSubCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async ({ id, payload }) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await updateSubCategory(id, payload)
      clearExamSubCategoriesListCache()
      clearSubCategoryDetailCache(id)
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
