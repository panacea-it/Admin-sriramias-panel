import { facultySubjectKeys, folderKeys } from '../hooks/queryKeys'
import {
  API_CATEGORY_TO_TYPE,
  normalizeFolderFromApi,
} from './facultySubjectFolderHelpers'
import { DEFAULT_FACULTY_SUBJECT_CATEGORIES } from './facultySubjectHelpers'
import { contentTypeLabel } from './subjectCategoryHelpers'
import { CATEGORY_TO_CONTENT_TYPE } from './facultySubjectHierarchy'

const CATEGORY_LABEL_BY_VALUE = Object.fromEntries(
  DEFAULT_FACULTY_SUBJECT_CATEGORIES.map((o) => [o.value, o.label]),
)

const ALL_CATEGORY_KEYS = DEFAULT_FACULTY_SUBJECT_CATEGORIES.map((o) => o.value)

/**
 * Maps GET /api/faculty-subjects/:id/content-tree into UI category sidebar shape.
 * Only includes categories enabled on the faculty subject (flat folders per category).
 */
export function mapContentTreeToUiCategories(treeResponse) {
  const enabled = Array.isArray(treeResponse?.categories)
    ? treeResponse.categories
    : ALL_CATEGORY_KEYS

  const folderMap = treeResponse?.data && typeof treeResponse.data === 'object'
    ? treeResponse.data
    : {}

  return enabled
    .map((apiCategory, index) => {
      const categoryType = API_CATEGORY_TO_TYPE[apiCategory] || apiCategory
      const contentType = CATEGORY_TO_CONTENT_TYPE[categoryType] || 'live'
      const folders = (Array.isArray(folderMap[apiCategory]) ? folderMap[apiCategory] : [])
        .map(normalizeFolderFromApi)
        .filter(Boolean)
        .sort((a, b) => String(a.folderName).localeCompare(String(b.folderName)))

      return {
        id: `cat-${categoryType}`,
        categoryType,
        apiCategory,
        label: CATEGORY_LABEL_BY_VALUE[apiCategory] || contentTypeLabel(contentType),
        orderIndex: index,
        folders,
      }
    })
    .filter(Boolean)
}

export function unwrapContentTreeMeta(treeResponse) {
  return {
    facultySubjectId: treeResponse?.facultySubjectId ?? '',
    subjectName: treeResponse?.subjectName ?? '',
    categories: Array.isArray(treeResponse?.categories) ? treeResponse.categories : [],
  }
}

export function invalidateFolderCaches(queryClient, { facultySubjectId, folderId } = {}) {
  queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
  if (folderId) {
    queryClient.invalidateQueries({ queryKey: folderKeys.detail(folderId) })
    queryClient.invalidateQueries({ queryKey: folderKeys.summary(folderId) })
    queryClient.invalidateQueries({ queryKey: folderKeys.content({ folderId }) })
  }
  if (facultySubjectId) {
    queryClient.invalidateQueries({
      queryKey: facultySubjectKeys.contentTree(facultySubjectId),
    })
  }
}

export { facultySubjectKeys, folderKeys }
