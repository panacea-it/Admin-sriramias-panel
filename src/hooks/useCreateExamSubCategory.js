import { useCallback, useState } from 'react'
import {
  clearExamSubCategoriesListCache,
  createSubCategory,
} from '../services/examSubCategoryService'
import { clearExamCategoriesListCache } from '../services/examCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-sub-categories'

export function useCreateExamSubCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async (payload) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await createSubCategory(payload)
      clearExamSubCategoriesListCache()
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
