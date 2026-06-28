import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFacultySubjectContentFolder,
  listFacultySubjectContentCategories,
  updateFacultySubjectContentFolder,
} from '../services/facultySubjectService'
import {
  deleteSubjectContentFolder,
  getFolderContentSummary,
  updateSubjectContentFolder,
} from '../services/subjectContentFolderService'
import { invalidateFolderCaches } from '../utils/facultySubjectCmsHelpers'
import { normalizeCreatedFolderResponse } from '../utils/facultySubjectFolderHelpers'
import { facultySubjectKeys, folderKeys } from './queryKeys'

/**
 * GET /api/folders/:id/content-summary
 * @param {string | undefined | null} folderId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFolderContentSummary(folderId, options = {}) {
  const enabled = Boolean(folderId) && (options.enabled ?? true)

  return useQuery({
    queryKey: folderKeys.summary(folderId ?? ''),
    queryFn: ({ signal }) => getFolderContentSummary(folderId, { signal }),
    enabled,
    select: (data) => data?.data ?? data,
    ...options,
  })
}

/**
 * POST /api/faculty-subjects/content/categories — combined sidebar + table
 * @param {Record<string, unknown>} payload
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useContentCategories(payload, options = {}) {
  const enabled =
    Boolean(payload?.facultySubjectId) &&
    Boolean(payload?.folderId) &&
    Boolean(payload?.category) &&
    (options.enabled ?? true)

  return useQuery({
    queryKey: facultySubjectKeys.contentCategories(payload),
    queryFn: ({ signal }) => listFacultySubjectContentCategories(payload, { signal }),
    enabled,
    ...options,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createFacultySubjectContentFolder(payload),
    onSuccess: (_data, variables) => {
      invalidateFolderCaches(queryClient, {
        facultySubjectId: variables?.facultySubjectId,
      })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        return await updateFacultySubjectContentFolder(id, payload)
      } catch (error) {
        if (error?.response?.status === 404) {
          return updateSubjectContentFolder(id, payload)
        }
        throw error
      }
    },
    onSuccess: (_data, variables) => {
      invalidateFolderCaches(queryClient, {
        facultySubjectId: variables?.facultySubjectId,
        folderId: variables?.id,
      })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteSubjectContentFolder(id),
    onSuccess: (_data, variables) => {
      invalidateFolderCaches(queryClient, {
        facultySubjectId: variables?.facultySubjectId,
        folderId: variables?.id,
      })
      queryClient.invalidateQueries({ queryKey: folderKeys.content({ folderId: variables?.id }) })
    },
  })
}

export function useCreateFolderMutationResult() {
  return useCreateFolder()
}

export { normalizeCreatedFolderResponse }
