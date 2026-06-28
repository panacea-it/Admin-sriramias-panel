import { listFolderContent } from '../services/subjectContentFolderService'
import { listFacultySubjectContentCategories } from '../services/facultySubjectService'
import { createCachedRequest } from './apiRequestCache'

const folderContentCache = createCachedRequest({ ttlMs: 45_000 })

export function clearFolderContentCache() {
  folderContentCache.clear()
}

export function resetCategoryContentPostRoute() {
  /* retained for callers that toggled POST fallback — POST is primary per integration spec */
}

/**
 * Loads folder content via GET /api/folders/content, falling back to
 * POST /api/faculty-subjects/content/categories when needed.
 */
export async function fetchFolderContentByCategory(
  { facultySubjectId, category, folderId, page = 1, limit = 50, sortBy, sortOrder },
  { signal, bypassCache = false } = {},
) {
  const subjectId = String(facultySubjectId || '').trim()
  const apiCategory = String(category || '').trim()
  const resolvedFolderId = String(folderId || '').trim()
  const cacheKey = `${subjectId}:${apiCategory}:${resolvedFolderId}:${page}:${limit}`

  return folderContentCache.fetch(
    cacheKey,
    async () => {
      try {
        return await listFolderContent(
          {
            facultySubjectId: subjectId,
            category: apiCategory,
            folderId: resolvedFolderId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          { signal },
        )
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
        if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error

        return listFacultySubjectContentCategories(
          {
            facultySubjectId: subjectId,
            category: apiCategory,
            folderId: resolvedFolderId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          { signal },
        )
      }
    },
    { bypass: bypassCache },
  )
}
