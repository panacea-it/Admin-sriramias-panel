import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustBookstoreStock,
  fetchBookstoreInventoryLogsPage,
  fetchBookstoreInventoryPage,
  fetchBookstoreInventoryView,
  searchBookstoreInventory,
} from '../../api/bookstoreAPI'
import { bookstoreProductKeys } from './useBookstoreProducts'

export const bookstoreInventoryKeys = {
  all: ['bookstore-inventory'],
  list: (params) => [...bookstoreInventoryKeys.all, 'list', params],
  logs: (params) => [...bookstoreInventoryKeys.all, 'logs', params],
  view: (productId) => [...bookstoreInventoryKeys.all, 'view', productId],
  search: (search) => [...bookstoreInventoryKeys.all, 'search', search],
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

export function useBookstoreInventoryView(productId, options = {}) {
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: bookstoreInventoryKeys.view(productId),
    queryFn: () => fetchBookstoreInventoryView(productId),
    staleTime: 0,
    retry: 1,
    refetchOnMount: 'always',
    ...queryOptions,
    enabled: Boolean(productId) && Boolean(enabledOption),
  })
}

export function useBookstoreInventorySearch(search, options = {}) {
  const term = String(search || '').trim()
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: bookstoreInventoryKeys.search(term),
    queryFn: () => searchBookstoreInventory(term),
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...queryOptions,
    enabled: Boolean(term) && Boolean(enabledOption),
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

        queryClient.setQueryData(bookstoreInventoryKeys.view(productId), updatedProduct)
      }

      if (newLog) {
        const logQueries = queryClient.getQueriesData({
          queryKey: bookstoreInventoryKeys.all,
          predicate: (q) => q.queryKey[1] === 'logs',
        })

        logQueries.forEach(([queryKey, old]) => {
          if (!old?.items) return

          const params = queryKey[2] || {}
          const currentPage = params?.page ?? 1
          const filterProductId = String(params?.productId || '').trim()

          if (currentPage !== 1) return
          if (filterProductId && filterProductId !== productId) return

          const limit = old.limit ?? params?.limit ?? 10
          const nextItems = [newLog, ...old.items.filter((item) => item.id !== newLog.id)].slice(
            0,
            limit,
          )

          queryClient.setQueryData(queryKey, {
            ...old,
            items: nextItems,
            count: nextItems.length,
            total: (old.total ?? old.items.length) + 1,
          })
        })
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
