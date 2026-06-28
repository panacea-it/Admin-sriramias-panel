import { useQuery } from '@tanstack/react-query'
import { getFacultySubjectContentTree } from '../services/facultySubjectService'
import {
  mapContentTreeToUiCategories,
  unwrapContentTreeMeta,
} from '../utils/facultySubjectCmsHelpers'
import { facultySubjectKeys } from './queryKeys'

/**
 * GET /api/faculty-subjects/:id/content-tree
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useContentTree(id, options = {}) {
  const enabled = Boolean(id) && (options.enabled ?? true)

  return useQuery({
    queryKey: facultySubjectKeys.contentTree(id ?? ''),
    queryFn: ({ signal }) => getFacultySubjectContentTree(id, { signal }),
    enabled,
    select: (data) => ({
      meta: unwrapContentTreeMeta(data),
      categories: mapContentTreeToUiCategories(data),
      raw: data,
    }),
    ...options,
  })
}

export default useContentTree
