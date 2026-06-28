import { useQuery } from '@tanstack/react-query'
import { getDifficulties } from '../../services/questionBankService'
import { difficultyApiToUi, extractEnumArray } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

export function useDifficultyLevels(options = {}) {
  return useQuery({
    queryKey: questionBankKeys.difficulties(),
    queryFn: async () => {
      const data = await getDifficulties()
      return extractEnumArray(data).map(difficultyApiToUi)
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useDifficultyLevels
