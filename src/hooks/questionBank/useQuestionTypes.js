import { useQuery } from '@tanstack/react-query'
import { getTypes } from '../../services/questionBankService'
import { extractEnumArray, typeApiToUi } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

export function useQuestionTypes(options = {}) {
  return useQuery({
    queryKey: questionBankKeys.types(),
    queryFn: async () => {
      const data = await getTypes()
      return extractEnumArray(data).map(typeApiToUi)
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useQuestionTypes
