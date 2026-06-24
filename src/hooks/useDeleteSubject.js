import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { subjectKeys } from './queryKeys'

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => subjectService.deleteSubject(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
      queryClient.removeQueries({ queryKey: subjectKeys.detail(id) })
    },
  })
}
