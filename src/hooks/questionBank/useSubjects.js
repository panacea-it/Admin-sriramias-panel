import { useQuery } from '@tanstack/react-query'
import { getSubjects } from '../../services/questionBankService'
import { extractEnumArray } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

export function useSubjects(options = {}) {
  return useQuery({
    queryKey: questionBankKeys.subjects(),
    queryFn: async () => {
      const data = await getSubjects()
      return extractEnumArray(data).filter(Boolean)
    },
    staleTime: 5 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useSubjects
