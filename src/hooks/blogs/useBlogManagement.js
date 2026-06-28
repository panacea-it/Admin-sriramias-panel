import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteBlog, fetchBlogDetails, fetchBlogListPage, removeBlogFromMain, saveBlog, setBlogAsMain, updateBlogStatus } from '../../api/blogAPI'
import { applyBlogMainUpdateToRow, applyBlogStatusUpdateToRow, mapSavedBlogToRow } from '../../utils/blogApiHelpers'
import { blogDropdownKeys } from './useBlogDropdowns'

export const blogManagementKeys = {
  all: ['blog-management'],
  list: (params) => [...blogManagementKeys.all, 'list', params],
  detail: (blogId) => [...blogManagementKeys.all, 'detail', blogId],
}

function rowMatchesStatusFilter(rowStatus, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return true
  return rowStatus === statusFilter
}

export function useBlogList(params = {}, options = {}) {
  const { languageLookup = {}, ...queryOptions } = options

  return useQuery({
    queryKey: blogManagementKeys.list(params),
    queryFn: () => fetchBlogListPage(params, languageLookup),
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: undefined,
    ...queryOptions,
  })
}

export function useBlogDetails(blogId, options = {}) {
  const { languageLookup = {}, enabled = true, ...queryOptions } = options

  return useQuery({
    queryKey: blogManagementKeys.detail(blogId),
    queryFn: () => fetchBlogDetails(blogId, languageLookup),
    enabled: enabled && Boolean(String(blogId || '').trim()),
    staleTime: 0,
    retry: 1,
    ...queryOptions,
  })
}

export function useSaveBlog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ form, backgroundFile, isEdit = false, languageLookup = {} }) =>
      saveBlog(form, { backgroundFile, isEdit }).then((response) =>
        mapSavedBlogToRow(response?.data ?? response, form, languageLookup),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: blogManagementKeys.all })
      queryClient.invalidateQueries({ queryKey: blogDropdownKeys.all })
      const blogId = variables?.form?.blogId
      if (blogId) {
        queryClient.invalidateQueries({ queryKey: blogManagementKeys.detail(blogId) })
      }
    },
  })
}

export function useUpdateBlogStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blogId, status }) => updateBlogStatus(blogId, status),
    onSuccess: (response, variables) => {
      const apiData = response?.data
      const blogId = variables?.blogId
      if (!apiData || !blogId) return

      const listQueries = queryClient.getQueriesData({
        queryKey: blogManagementKeys.all,
        predicate: (query) => query.queryKey?.[1] === 'list',
      })

      listQueries.forEach(([queryKey, old]) => {
        if (!old?.items) return

        const statusFilter = queryKey?.[2]?.status ?? 'all'
        let items = old.items.map((item) =>
          item.blogId === blogId ? applyBlogStatusUpdateToRow(item, apiData) : item,
        )

        if (statusFilter !== 'all') {
          const updatedRow = items.find((item) => item.blogId === blogId)
          if (updatedRow && !rowMatchesStatusFilter(updatedRow.status, statusFilter)) {
            items = items.filter((item) => item.blogId !== blogId)
          }
        }

        const removedCount = old.items.length - items.length
        const total = Math.max(0, (old.total ?? old.items.length) - removedCount)

        queryClient.setQueryData(queryKey, {
          ...old,
          items,
          total,
          pagination: old.pagination ? { ...old.pagination, total } : old.pagination,
        })
      })

      queryClient.invalidateQueries({ queryKey: blogManagementKeys.detail(blogId) })
    },
  })
}

function updateBlogMainListCache(queryClient, blogId, apiData) {
  if (!apiData || !blogId) return

  const isMainBlog = Boolean(apiData.isMainBlog)

  const listQueries = queryClient.getQueriesData({
    queryKey: blogManagementKeys.all,
    predicate: (query) => query.queryKey?.[1] === 'list',
  })

  listQueries.forEach(([queryKey, old]) => {
    if (!old?.items) return

    const items = old.items.map((item) => {
      if (item.blogId === blogId) {
        return applyBlogMainUpdateToRow(item, apiData)
      }

      if (isMainBlog && item.isMainBlog) {
        return applyBlogMainUpdateToRow(item, { isMainBlog: false })
      }

      return item
    })

    queryClient.setQueryData(queryKey, {
      ...old,
      items,
    })
  })

  queryClient.invalidateQueries({ queryKey: blogManagementKeys.detail(blogId) })
}

export function useUpdateBlogMain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blogId, isMainBlog }) =>
      isMainBlog ? removeBlogFromMain(blogId) : setBlogAsMain(blogId),
    onSuccess: (response, variables) => {
      updateBlogMainListCache(queryClient, variables?.blogId, response?.data)
    },
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blogId }) => deleteBlog(blogId),
    onSuccess: (_response, variables) => {
      const blogId = variables?.blogId
      if (!blogId) return

      const listQueries = queryClient.getQueriesData({
        queryKey: blogManagementKeys.all,
        predicate: (query) => query.queryKey?.[1] === 'list',
      })

      listQueries.forEach(([queryKey, old]) => {
        if (!old?.items) return

        const nextItems = old.items.filter((item) => item.blogId !== blogId)
        const removedCount = old.items.length - nextItems.length
        const total = Math.max(0, (old.total ?? old.items.length) - removedCount)
        const limit = old.limit ?? old.pagination?.limit ?? nextItems.length || 10
        const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

        queryClient.setQueryData(queryKey, {
          ...old,
          items: nextItems,
          total,
          totalPages,
          pagination: old.pagination
            ? {
                ...old.pagination,
                total,
                totalPages,
                hasNextPage: (old.pagination.page ?? 1) < totalPages,
              }
            : old.pagination,
        })
      })

      queryClient.removeQueries({ queryKey: blogManagementKeys.detail(blogId) })
    },
  })
}
