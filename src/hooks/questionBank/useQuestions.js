import { useQuery } from '@tanstack/react-query'
import { listQuestions } from '../../services/questionBankService'
import {
  mapQuestionBankFilterToApi,
  normalizeQuestionListResponse,
} from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

/**
 * @param {import('../../types/questionBank.types').QuestionListFilters & Record<string, unknown>} filters
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useQuestions(filters = {}, options = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const apiParams = mapQuestionBankFilterToApi(filters)

  return useQuery({
    queryKey: questionBankKeys.list(apiParams),
    queryFn: async () => {
      const data = await listQuestions(apiParams)
      return normalizeQuestionListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useQuestions
