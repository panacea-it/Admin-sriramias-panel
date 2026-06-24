import { useQuery } from '@tanstack/react-query'
import { getDailyPracticeMainsCategories } from '../services/currentAffairsService'
import { MAINS_CATEGORY_OPTIONS } from '../constants/currentAffairsForm'
import { currentAffairsKeys } from './queryKeys'

const FALLBACK_OPTIONS = MAINS_CATEGORY_OPTIONS.map((name) => ({ value: name, label: name }))

/**
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsCategories(options = {}) {
  return useQuery({
    queryKey: currentAffairsKeys.mainsCategories(),
    queryFn: getDailyPracticeMainsCategories,
    select: (rows) => (rows?.length ? rows : FALLBACK_OPTIONS),
    staleTime: 5 * 60_000,
    ...options,
  })
}
