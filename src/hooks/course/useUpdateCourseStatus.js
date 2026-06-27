import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCourseStatus } from '../../services/courseService'
import { courseKeys } from './courseKeys'
import { invalidateListSession } from '../useMasterListQuery'

const SESSION_SCOPE = 'courses'

export function useUpdateCourseStatus() {
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(
    async ({ id, status }) => {
      setIsPending(true)
      setError(null)
      try {
        const result = await updateCourseStatus(id, status)
        invalidateListSession(SESSION_SCOPE)
        await queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
        await queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
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

export function useUpdateCourseStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateCourseStatus(id, status),
    onSuccess: (_response, { id }) => {
      invalidateListSession(SESSION_SCOPE)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
    },
  })
}
