import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearFacultySubjectDetailCache, updateFacultySubjectStatus } from '../services/facultySubjects.api'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'
import { syncSingleFacultySubjectToLocal } from '../../../../utils/facultySubjectSync'

export function useToggleFacultySubjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateFacultySubjectStatus(id, status),
    onSuccess: (data, variables) => {
      syncSingleFacultySubjectToLocal(data)
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.dropdown() })
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: facultySubjectKeys.detail(variables.id) })
        clearFacultySubjectDetailCache(variables.id)
      }
    },
  })
}
