import { useQuery } from '@tanstack/react-query'
import { getQuestion } from '../../services/questionBankService'
import { mapApiQuestionToLocal } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

/**
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useQuestion(id, options = {}) {
  return useQuery({
    queryKey: questionBankKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await getQuestion(id)
      return mapApiQuestionToLocal(data?.data ?? data)
    },
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useQuestion
