import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../../services/questionBankService'
import { categoryApiToUi, extractEnumArray } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

export function useQuestionCategories(options = {}) {
  return useQuery({
    queryKey: questionBankKeys.categories(),
    queryFn: async () => {
      const data = await getCategories()
      return extractEnumArray(data).map(categoryApiToUi)
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useQuestionCategories
