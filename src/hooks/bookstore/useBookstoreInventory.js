import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustBookstoreStock,
  fetchBookstoreInventoryLogsPage,
  fetchBookstoreInventoryPage,
} from '../../api/bookstoreAPI'
import { bookstoreProductKeys } from './useBookstoreProducts'

export const bookstoreInventoryKeys = {
  all: ['bookstore-inventory'],
  list: (params) => [...bookstoreInventoryKeys.all, 'list', params],
  logs: (params) => [...bookstoreInventoryKeys.all, 'logs', params],
}

export function useBookstoreInventoryList(params, options = {}) {
  return useQuery({
    queryKey: bookstoreInventoryKeys.list(params),
    queryFn: () => fetchBookstoreInventoryPage(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useBookstoreInventoryLogs(params, options = {}) {
  return useQuery({
    queryKey: bookstoreInventoryKeys.logs(params),
    queryFn: () => fetchBookstoreInventoryLogsPage(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useAdjustBookstoreStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, action, quantity, reason }) =>
      adjustBookstoreStock(productId, { action, quantity, reason }),
    onSuccess: (data, variables) => {
      const productId = data?.product?.productId || variables?.productId
      const updatedProduct = data?.product
      const newLog = data?.log

      if (updatedProduct) {
        queryClient.setQueriesData(
          {
            queryKey: bookstoreInventoryKeys.all,
            predicate: (query) => query.queryKey[1] === 'list',
          },
          (old) => {
            if (!old?.items) return old

            return {
              ...old,
              items: old.items.map((item) =>
                item.productId === productId || item.id === productId
                  ? {
                      ...item,
                      ...updatedProduct,
                      stockQuantity: updatedProduct.stockQuantity,
                      alert: updatedProduct.alert,
                      statusLabel: updatedProduct.statusLabel,
                    }
                  : item,
              ),
            }
          },
        )
      }

      if (newLog) {
        queryClient.setQueriesData(
          {
            queryKey: bookstoreInventoryKeys.all,
            predicate: (query) => query.queryKey[1] === 'logs',
          },
          (old) => {
            if (!old?.items) return old

            const params = query.queryKey[2]
            const currentPage = params?.page ?? 1
            if (currentPage !== 1) return old

            const limit = old.limit ?? params?.limit ?? 10
            const nextItems = [newLog, ...old.items.filter((item) => item.id !== newLog.id)].slice(
              0,
              limit,
            )

            return {
              ...old,
              items: nextItems,
              count: nextItems.length,
              total: (old.total ?? old.items.length) + 1,
            }
          },
        )
      }

      if (productId && updatedProduct) {
        queryClient.setQueryData(bookstoreProductKeys.detail(productId), (old) =>
          old
            ? {
                ...old,
                stockQuantity: updatedProduct.stockQuantity,
              }
            : old,
        )

        queryClient.setQueriesData(
          {
            queryKey: bookstoreProductKeys.all,
            predicate: (query) => query.queryKey[1] === 'list',
          },
          (old) => {
            if (!old?.items) return old

            return {
              ...old,
              items: old.items.map((item) =>
                item.id === productId || item.productId === productId
                  ? { ...item, stockQuantity: updatedProduct.stockQuantity }
                  : item,
              ),
            }
          },
        )
      }

      queryClient.invalidateQueries({ queryKey: bookstoreInventoryKeys.all })
      queryClient.invalidateQueries({ queryKey: bookstoreProductKeys.all })
    },
  })
}
