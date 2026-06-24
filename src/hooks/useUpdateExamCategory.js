import { useCallback, useState } from 'react'
import {
  clearExamCategoriesListCache,
  clearCategoryDetailCache,
  updateExamCategory,
} from '../services/examCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-categories'

export function useUpdateExamCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async ({ id, payload }) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await updateExamCategory(id, payload)
      clearExamCategoriesListCache()
      clearCategoryDetailCache(id)
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
