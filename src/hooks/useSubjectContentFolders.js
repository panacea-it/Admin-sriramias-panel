import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listSubjectContentFolders } from '../services/subjectContentFolderService'
import { normalizeFoldersListResponse } from '../utils/facultySubjectFolderHelpers'
import { folderKeys } from './queryKeys'

/**
 * GET /api/folders — flat folder list scoped by faculty subject + category
 * @param {import('../types/subjectContentFolder.types').FolderListParams} params
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useSubjectContentFolders(params, options = {}) {
  const facultySubjectId = String(params?.facultySubjectId || '').trim()
  const enabled =
    Boolean(facultySubjectId) && (options.enabled ?? true)

  return useQuery({
    queryKey: folderKeys.list(params),
    queryFn: ({ signal }) =>
      listSubjectContentFolders(params, { signal }).then((data) => ({
        ...data,
        folders: normalizeFoldersListResponse(data),
      })),
    enabled,
    placeholderData: keepPreviousData,
    ...options,
  })
}

export default useSubjectContentFolders
