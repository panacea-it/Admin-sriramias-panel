import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearFacultySubjectDetailCache, updateFacultySubject } from '../services/facultySubjects.api'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'
import { syncSingleFacultySubjectToLocal } from '../../../../utils/facultySubjectSync'

export function useUpdateFacultySubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateFacultySubject(id, payload),
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
