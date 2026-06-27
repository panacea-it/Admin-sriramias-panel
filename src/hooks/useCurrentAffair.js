import { useQuery } from '@tanstack/react-query'
import {
  getCurrentAffairById,
  getDailyPracticeById,
} from '../services/currentAffairsService'
import { isDailyPracticeCategory } from '../constants/currentAffairsForm'
import { currentAffairsKeys } from './queryKeys'

/**
 * @param {string | undefined} id
 * @param {{ category?: string }} [meta]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useCurrentAffair(id, meta = {}, options = {}) {
  const isDailyPractice = isDailyPracticeCategory(meta?.category)

  return useQuery({
    queryKey: currentAffairsKeys.detail(id ?? ''),
    queryFn: () =>
      isDailyPractice ? getDailyPracticeById(id) : getCurrentAffairById(id),
    enabled: Boolean(id),
    ...options,
  })
}
