import { useQuery } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { cbtTestKeys } from './cbtTestKeys'

export function useCBTCreateForm(facultySubjectId, options = {}) {
  return useQuery({
    queryKey: cbtTestKeys.createForm(facultySubjectId),
    queryFn: () =>
      cbtTestService.getCreateForm(
        facultySubjectId ? { facultySubjectId } : {},
      ),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
