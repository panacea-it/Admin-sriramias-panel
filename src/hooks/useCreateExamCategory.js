import { useCallback, useState } from 'react'
import {
  clearExamCategoriesListCache,
  createExamCategory,
} from '../services/examCategoryService'
import { invalidateListSession } from './useMasterListQuery'

const SESSION_SCOPE = 'exam-categories'

export function useCreateExamCategory() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(async (payload) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await createExamCategory(payload)
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
