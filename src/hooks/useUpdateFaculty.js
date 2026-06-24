import { useMutation, useQueryClient } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { facultyKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'

export function useUpdateFaculty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => facultyService.updateFaculty(id, payload),
    onSuccess: (response, { id }) => {
      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: facultyKeys.all })
      }
    },
    onError: (error) => handleApiError(error),
  })
}

/** Status-only toggle with optimistic update */
export function useToggleFacultyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => facultyService.updateFacultyStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: facultyKeys.detail(id) })
      const previous = queryClient.getQueryData(facultyKeys.detail(id))
      queryClient.setQueryData(facultyKeys.detail(id), (old) => {
        if (!old || typeof old !== 'object') return old
        const record = /** @type {{ data?: { status?: string } }} */ (old)
        return { ...record, data: { ...record.data, status } }
      })
      return { previous }
    },
    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(facultyKeys.detail(id), context.previous)
      }
      handleApiError(error)
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: facultyKeys.all })
    },
  })
}

export default useUpdateFaculty
