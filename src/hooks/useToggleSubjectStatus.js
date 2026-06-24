import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectService } from '../services/subjectService'
import { subjectKeys } from './queryKeys'

export function useToggleSubjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => subjectService.updateSubjectStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: subjectKeys.dropdown() })
    },
  })
}
