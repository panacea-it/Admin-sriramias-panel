import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listFolderContent } from '../services/subjectContentFolderService'
import { mapUiCategoryToApiCategory, normalizeFolderContentResponse } from '../utils/folderContentHelpers'
import { mapCategoryTypeToApi } from '../utils/facultySubjectFolderHelpers'
import { folderKeys } from './queryKeys'

/**
 * GET /api/folders/content — paginated folder content (all delivery categories)
 * @param {import('../types/subjectContentFolder.types').FolderContentParams & { categoryType?: string }} params
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFolderContent(params, options = {}) {
  const facultySubjectId = String(params?.facultySubjectId || '').trim()
  const folderId = String(params?.folderId || '').trim()
  const apiCategory =
    params?.category ||
    mapCategoryTypeToApi(params?.categoryType) ||
    mapUiCategoryToApiCategory(params?.categoryType)

  const queryParams = {
    facultySubjectId,
    category: apiCategory,
    folderId,
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder,
  }

  const enabled =
    Boolean(facultySubjectId) &&
    Boolean(folderId) &&
    Boolean(apiCategory) &&
    (options.enabled ?? true)

  return useQuery({
    queryKey: folderKeys.content(queryParams),
    queryFn: ({ signal }) =>
      listFolderContent(queryParams, { signal }).then((data) =>
        normalizeFolderContentResponse(data, apiCategory),
      ),
    enabled,
    placeholderData: keepPreviousData,
    ...options,
  })
}

export default useFolderContent
