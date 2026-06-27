import { useQuery } from '@tanstack/react-query'
import cbtTestService from '../services/cbtTestService'
import { mapApiPrelimsTestToRow } from '../utils/cbtTestFormHelpers'
import { cbtTestKeys } from './cbtTestKeys'

export function useCBTTest(id, options = {}) {
  return useQuery({
    queryKey: cbtTestKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await cbtTestService.getTestById(id)
      return mapApiPrelimsTestToRow(response?.data ?? response)
    },
    enabled: Boolean(id),
    ...options,
  })
}
