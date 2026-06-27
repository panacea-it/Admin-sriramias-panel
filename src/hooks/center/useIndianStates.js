import { useQuery } from '@tanstack/react-query'
import { getIndianStates } from '../../services/centerService'
import { centerKeys } from './centerKeys'

export function useIndianStates(enabled = true) {
  return useQuery({
    queryKey: centerKeys.states(),
    queryFn: async () => {
      const response = await getIndianStates()
      const list = Array.isArray(response?.data) ? response.data : []
      return list.map((item) => ({
        value: String(item.value || item.label || '').trim(),
        label: String(item.label || item.value || '').trim(),
      })).filter((item) => item.value && item.label)
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
