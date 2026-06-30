import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchBookstorePaymentAttempts } from '../../api/bookstoreAPI'

export const bookstorePaymentAttemptKeys = {
  all: ['bookstore-payment-attempts'],
  list: (params) => [...bookstorePaymentAttemptKeys.all, 'list', params],
}

export function useBookstorePaymentAttemptsList(params, options = {}) {
  return useQuery({
    queryKey: bookstorePaymentAttemptKeys.list(params),
    queryFn: () => fetchBookstorePaymentAttempts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}
