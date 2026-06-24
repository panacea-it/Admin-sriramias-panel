import { useCallback, useState } from 'react'
import {
  clearExamCategoriesListCache,
  clearCategoryDetailCache,
  deleteExamCategory,
} from '../services/examCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-categories'

export function useDeleteExamCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async (id) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await deleteExamCategory(id)
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
