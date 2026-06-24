import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { subjectKeys } from './queryKeys'

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => subjectService.updateSubject(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(variables.id) })
    },
  })
}
