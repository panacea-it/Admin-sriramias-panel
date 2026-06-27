import { useQuery } from '@tanstack/react-query'
import { MAINS_CATEGORY_OPTIONS } from '../constants/currentAffairsForm'
import { getDailyPracticeMainsCategories } from '../services/currentAffairsService'
import { currentAffairsKeys } from './queryKeys'

const FALLBACK_OPTIONS = MAINS_CATEGORY_OPTIONS.map((name) => ({ value: name, label: name }))

export function useDailyPracticeMainsCategories({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: currentAffairsKeys.mainsCategories(),
    queryFn: getDailyPracticeMainsCategories,
    enabled,
    staleTime: 5 * 60_000,
  })

  const options = query.data?.length ? query.data : FALLBACK_OPTIONS

  return {
    options,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  }
}
