import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '../../services/questionBankService'
import {
  mapAnalyticsFilterToApi,
  normalizeQuestionAnalyticsResponse,
} from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

/**
 * @param {import('../../types/questionBank.types').QuestionListFilters & Record<string, unknown>} filters
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useQuestionStatistics(filters = {}, options = {}) {
  const apiParams = mapAnalyticsFilterToApi(filters)

  return useQuery({
    queryKey: questionBankKeys.analytics(apiParams),
    queryFn: async () => {
      const data = await getAnalytics(apiParams)
      return normalizeQuestionAnalyticsResponse(data)
    },
    staleTime: 30_000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useQuestionStatistics
