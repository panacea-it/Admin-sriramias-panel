import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchBookstoreOrderById,
  fetchBookstoreOrders,
  updateBookstoreOrderShipment,
  updateBookstoreOrderStatus,
} from '../../api/bookstoreAPI'

export const bookstoreOrderKeys = {
  all: ['bookstore-orders'],
  list: (params) => [...bookstoreOrderKeys.all, 'list', params],
  detail: (orderId) => [...bookstoreOrderKeys.all, 'detail', orderId],
}

export function useBookstoreOrdersList(params, options = {}) {
  return useQuery({
    queryKey: bookstoreOrderKeys.list(params),
    queryFn: () => fetchBookstoreOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useBookstoreOrder(orderId, options = {}) {
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: bookstoreOrderKeys.detail(orderId),
    queryFn: () => fetchBookstoreOrderById(orderId),
    staleTime: 0,
    retry: 1,
    ...queryOptions,
    enabled: Boolean(orderId) && Boolean(enabledOption),
  })
}

export function useUpdateBookstoreOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }) => updateBookstoreOrderStatus(orderId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookstoreOrderKeys.all })
      if (variables?.orderId && data) {
        queryClient.setQueryData(bookstoreOrderKeys.detail(variables.orderId), data)
      }
    },
  })
}

export function useUpdateBookstoreOrderShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, shipmentId }) =>
      updateBookstoreOrderShipment(orderId, shipmentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookstoreOrderKeys.all })
      if (variables?.orderId && data) {
        queryClient.setQueryData(bookstoreOrderKeys.detail(variables.orderId), data)
      }
    },
  })
}
