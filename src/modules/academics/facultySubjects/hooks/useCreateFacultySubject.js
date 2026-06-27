import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFacultySubject } from '../services/facultySubjects.api'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'
import { syncSingleFacultySubjectToLocal } from '../../../../utils/facultySubjectSync'

export function useCreateFacultySubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createFacultySubject(payload),
    onSuccess: (data) => {
      syncSingleFacultySubjectToLocal(data)
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.dropdown() })
    },
  })
}
