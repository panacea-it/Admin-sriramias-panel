import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBookstorePayments, refundBookstorePayment } from '../../api/bookstoreAPI'

export const bookstorePaymentKeys = {
  all: ['bookstore-payments'],
  list: (params) => [...bookstorePaymentKeys.all, 'list', params],
}

export function useBookstorePaymentsList(params, options = {}) {
  return useQuery({
    queryKey: bookstorePaymentKeys.list(params),
    queryFn: () => fetchBookstorePayments(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useRefundBookstorePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, reason }) => refundBookstorePayment(orderId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstorePaymentKeys.all })
    },
  })
}
