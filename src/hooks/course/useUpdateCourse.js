import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCourse } from '../../services/courseService'
import { courseKeys } from './courseKeys'
import { invalidateListSession } from '../useMasterListQuery'

const SESSION_SCOPE = 'courses'

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = useCallback(
    async ({ id, formData }) => {
      setIsPending(true)
      setError(null)
      try {
        const result = await updateCourse(id, formData)
        invalidateListSession(SESSION_SCOPE)
        await queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
        await queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
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

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }) => updateCourse(id, formData),
    onSuccess: (_response, { id }) => {
      invalidateListSession(SESSION_SCOPE)
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: courseKeys.dropdown() })
    },
  })
}
