import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  changeBookstoreProductStatus,
  createBookstoreProduct,
  deleteBookstoreProduct,
  fetchBookstoreExamCategories,
  fetchBookstoreProductById,
  fetchBookstoreProductsPage,
  updateBookstoreProduct,
} from '../../api/bookstoreAPI'
import { buildCategoryLookup, mapUiStatusToApi } from '../../utils/bookstoreApiHelpers'

export const bookstoreProductKeys = {
  all: ['bookstore-products'],
  list: (params) => [...bookstoreProductKeys.all, 'list', params],
  detail: (productId) => [...bookstoreProductKeys.all, 'detail', productId],
  examCategories: () => [...bookstoreProductKeys.all, 'exam-categories'],
}

export function useBookstoreExamCategories(options = {}) {
  return useQuery({
    queryKey: bookstoreProductKeys.examCategories(),
    queryFn: fetchBookstoreExamCategories,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export function useBookstoreProductsList(params, options = {}) {
  const { data: categories = [] } = useBookstoreExamCategories({
    enabled: options.enabled !== false,
  })
  const categoryLookup = buildCategoryLookup(categories)

  return useQuery({
    queryKey: bookstoreProductKeys.list(params),
    queryFn: () =>
      fetchBookstoreProductsPage({
        ...params,
        categoryLookup,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useBookstoreProduct(productId, options = {}) {
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: bookstoreProductKeys.detail(productId),
    queryFn: () => fetchBookstoreProductById(productId),
    staleTime: 0,
    retry: 1,
    refetchOnMount: 'always',
    ...queryOptions,
    enabled: Boolean(productId) && Boolean(enabledOption),
  })
}

export function useCreateBookstoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ values, ...assetContext }) =>
      createBookstoreProduct(values, assetContext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstoreProductKeys.all })
    },
  })
}

export function useUpdateBookstoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, values, ...assetContext }) =>
      updateBookstoreProduct(productId, values, assetContext),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookstoreProductKeys.all })
      if (variables?.productId) {
        queryClient.invalidateQueries({
          queryKey: bookstoreProductKeys.detail(variables.productId),
        })
        if (data?.product) {
          queryClient.setQueryData(
            bookstoreProductKeys.detail(variables.productId),
            data.product,
          )
        }
      }
    },
  })
}

export function useChangeBookstoreProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mongoId, status }) => {
      if (!mongoId) {
        throw new Error('Product record id is required to update status.')
      }
      return changeBookstoreProductStatus(mongoId, mapUiStatusToApi(status))
    },
    onSuccess: (data, variables) => {
      const productId = data?.productId || variables?.productId
      const mongoId = data?.mongoId || variables?.mongoId
      const nextUiStatus = data?.uiStatus
      const nextApiStatus = data?.apiStatus || data?.status
      const nextFeatured =
        data?.isFeaturedOnHomepage !== undefined
          ? data.isFeaturedOnHomepage
          : undefined
      const nextHomepageOrder =
        data?.homepageSortOrder !== undefined ? data.homepageSortOrder : undefined

      const patchRow = (item) => {
        if (item.mongoId !== mongoId && item.id !== productId) return item

        return {
          ...item,
          status: nextUiStatus ?? item.status,
          apiStatus: nextApiStatus ?? item.apiStatus,
          ...(nextFeatured !== undefined ? { isFeaturedOnHomepage: nextFeatured } : {}),
          ...(nextHomepageOrder !== undefined ? { homepageSortOrder: nextHomepageOrder } : {}),
        }
      }

      queryClient.setQueriesData(
        {
          queryKey: bookstoreProductKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (old) => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(patchRow),
          }
        },
      )

      if (productId) {
        queryClient.setQueryData(bookstoreProductKeys.detail(productId), (old) =>
          old ? patchRow(old) : old,
        )
      }

      queryClient.invalidateQueries({ queryKey: bookstoreProductKeys.all })
    },
  })
}

export function useDeleteBookstoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mongoId }) => deleteBookstoreProduct(mongoId),
    onSuccess: (data, variables) => {
      const productId = data?.productId || variables?.productId
      const mongoId = data?.mongoId || variables?.mongoId

      queryClient.setQueriesData(
        {
          queryKey: bookstoreProductKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (old) => {
          if (!old?.items) return old

          const nextItems = old.items.filter(
            (item) => item.mongoId !== mongoId && item.id !== productId,
          )
          const removedCount = old.items.length - nextItems.length

          return {
            ...old,
            items: nextItems,
            count: nextItems.length,
            total: Math.max(0, (old.total ?? old.items.length) - removedCount),
          }
        },
      )

      if (productId) {
        queryClient.removeQueries({ queryKey: bookstoreProductKeys.detail(productId) })
      }

      queryClient.invalidateQueries({ queryKey: bookstoreProductKeys.all })
    },
  })
}
