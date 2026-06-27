import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearFacultySubjectDetailCache, deleteFacultySubject } from '../services/facultySubjects.api'
import { facultySubjectKeys } from '../../../../hooks/queryKeys'
import { removeFacultySubjectFromLocalStorage } from '../../../../utils/facultySubjectSync'

export function useDeleteFacultySubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteFacultySubject(id),
    onSuccess: (_data, id) => {
      removeFacultySubjectFromLocalStorage(id)
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: facultySubjectKeys.dropdown() })
      queryClient.removeQueries({ queryKey: facultySubjectKeys.detail(id) })
      clearFacultySubjectDetailCache(id)
    },
  })
}
