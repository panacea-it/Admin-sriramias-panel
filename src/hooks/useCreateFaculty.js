import { useMutation, useQueryClient } from '@tanstack/react-query'
import { facultyService } from '../services/facultyService'
import { facultyKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'

export function useCreateFaculty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => facultyService.createFaculty(payload),
    onSuccess: (response) => {
      if (response?.success && response?.data?._id) {
        queryClient.invalidateQueries({ queryKey: facultyKeys.all })
      }
    },
    onError: (error) => handleApiError(error),
  })
}

export default useCreateFaculty
