import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCourse } from '../../services/courseService'
import { courseKeys } from './courseKeys'
import { invalidateListSession } from '../useMasterListQuery'

const SESSION_SCOPE = 'courses'

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(
    async (id) => {
      setIsPending(true)
      setError(null)
      try {
        const result = await deleteCourse(id)
        invalidateListSession(SESSION_SCOPE)
        await queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
        await queryClient.invalidateQueries({ queryKey: courseKeys.dropdown() })
        return result
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [queryClient],
  )

  const reset = useCallback(() => setError(null), [])

  return { mutateAsync, isPending, error, reset }
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteCourse(id),
    onSuccess: () => {
      invalidateListSession(SESSION_SCOPE)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.dropdown() })
    },
  })
}
