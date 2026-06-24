import { useMutation, useQueryClient } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { facultyKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'

export function useDeleteFaculty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => facultyService.deleteFaculty(id),
    onSuccess: (response, id) => {
      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.all })
        queryClient.removeQueries({ queryKey: facultyKeys.detail(id) })
      }
    },
    onError: (error) => handleApiError(error),
  })
}

export default useDeleteFaculty
