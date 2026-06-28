import { useQuery } from '@tanstack/react-query'
import { getTags } from '../../services/questionBankService'
import { extractEnumArray } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

/**
 * @param {string | undefined} subject
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTags(subject, options = {}) {
  const normalizedSubject = subject && subject !== 'all' ? subject : undefined

  return useQuery({
    queryKey: questionBankKeys.tags(normalizedSubject),
    queryFn: async () => {
      const data = await getTags(normalizedSubject)
      return extractEnumArray(data).filter(Boolean)
    },
    staleTime: 5 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useTags
