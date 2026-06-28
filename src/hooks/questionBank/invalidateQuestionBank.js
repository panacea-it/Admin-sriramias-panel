import { useQueryClient } from '@tanstack/react-query'
import { questionBankKeys } from './queryKeys'

export function invalidateQuestionBankCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: questionBankKeys.lists() })
  queryClient.invalidateQueries({ queryKey: questionBankKeys.all })
  queryClient.invalidateQueries({ queryKey: questionBankKeys.subjects() })
  queryClient.invalidateQueries({ queryKey: questionBankKeys.topics() })
  queryClient.invalidateQueries({ queryKey: questionBankKeys.tags() })
  if (id) {
    queryClient.invalidateQueries({ queryKey: questionBankKeys.detail(id) })
  }
}

export function useInvalidateQuestionBank() {
  const queryClient = useQueryClient()
  return (id) => invalidateQuestionBankCaches(queryClient, id)
}

export function questionBankQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}
