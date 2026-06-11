import { getLiveClasses } from '../api/liveClassesHttpAPI'
import { getRecordings } from '../api/recordingsAPI'
import { postFacultySubjectCategoryContent } from '../api/facultySubjectFoldersAPI'
import { createCachedRequest } from './apiRequestCache'

const folderContentCache = createCachedRequest({ ttlMs: 45_000 })

/** After a 404, skip POST /content/categories and use GET list endpoints directly. */
let categoryContentPostUnavailable = false

export function clearFolderContentCache() {
  folderContentCache.clear()
}

export function resetCategoryContentPostRoute() {
  categoryContentPostUnavailable = false
}

export async function fetchFolderContentByCategory(
  { facultySubjectId, category, folderId },
  { signal, bypassCache = false } = {},
) {
  const subjectId = String(facultySubjectId || '').trim()
  const apiCategory = String(category || '').trim()
  const resolvedFolderId = String(folderId || '').trim()
  const cacheKey = `${subjectId}:${apiCategory}:${resolvedFolderId}`

  return folderContentCache.fetch(
    cacheKey,
    async () => {
      if (!categoryContentPostUnavailable) {
        try {
          return await postFacultySubjectCategoryContent(
            {
              facultySubjectId: subjectId,
              category: apiCategory,
              folderId: resolvedFolderId,
            },
            { signal },
          )
        } catch (error) {
          if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
          if (error?.response?.status !== 404) throw error
          categoryContentPostUnavailable = true
        }
      }

      if (apiCategory === 'LIVE_CLASS') {
        return getLiveClasses(
          { facultySubjectId: subjectId, folderId: resolvedFolderId },
          { signal },
        )
      }

      if (apiCategory === 'RECORDING') {
        return getRecordings(
          { facultySubjectId: subjectId, folderId: resolvedFolderId },
          { signal },
        )
      }

      throw Object.assign(new Error(`Unsupported folder content category: ${apiCategory}`), {
        status: 400,
      })
    },
    { bypass: bypassCache },
  )
}
