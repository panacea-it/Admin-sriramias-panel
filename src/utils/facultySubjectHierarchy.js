import { contentTypeLabel, getSubjectContentTypes } from './subjectCategoryHelpers'

export const CATEGORY_TYPES = {
  LIVE_CLASS: 'LIVE_CLASS',
  RECORDED_CLASS: 'RECORDED_CLASS',
  TEST_SERIES: 'TEST_SERIES',
  PDFS: 'PDFS',
  MAINS_ANSWER_WRITING: 'MAINS_ANSWER_WRITING',
}

/** Map system category → form contentType */
export const CATEGORY_TO_CONTENT_TYPE = {
  [CATEGORY_TYPES.LIVE_CLASS]: 'live',
  [CATEGORY_TYPES.RECORDED_CLASS]: 'recording',
  [CATEGORY_TYPES.TEST_SERIES]: 'test',
  [CATEGORY_TYPES.PDFS]: 'pdf',
  [CATEGORY_TYPES.MAINS_ANSWER_WRITING]: 'mainsAnswerWriting',
}

/** Map subject category label → system category type */
export const SUBJECT_CATEGORY_TO_TYPE = {
  'Live Class': CATEGORY_TYPES.LIVE_CLASS,
  Recording: CATEGORY_TYPES.RECORDED_CLASS,
  'Recorded Class': CATEGORY_TYPES.RECORDED_CLASS,
  Test: CATEGORY_TYPES.TEST_SERIES,
  'Test Series': CATEGORY_TYPES.TEST_SERIES,
  PDF: CATEGORY_TYPES.PDFS,
  'Mains Answer Writing': CATEGORY_TYPES.MAINS_ANSWER_WRITING,
}

export function contentTypeFromCategoryType(categoryType) {
  return CATEGORY_TO_CONTENT_TYPE[categoryType] || 'live'
}

export function categoryLabelFromType(categoryType) {
  const contentType = contentTypeFromCategoryType(categoryType)
  return contentTypeLabel(contentType)
}

export function buildSystemCategoriesFromSubject(subject) {
  const types = getSubjectContentTypes(subject?.categories)
  const map = {
    live: CATEGORY_TYPES.LIVE_CLASS,
    recording: CATEGORY_TYPES.RECORDED_CLASS,
    test: CATEGORY_TYPES.TEST_SERIES,
    pdf: CATEGORY_TYPES.PDFS,
    mainsAnswerWriting: CATEGORY_TYPES.MAINS_ANSWER_WRITING,
  }
  return types.map((t, index) => ({
    id: `cat-${t}`,
    categoryType: map[t],
    label: contentTypeLabel(t),
    orderIndex: index,
    folders: [],
  }))
}

export function findCategoryById(categories, categoryId) {
  return categories?.find((c) => c.id === categoryId) || null
}

export function findFolderInCategory(category, folderId) {
  return category?.folders?.find((f) => f.id === folderId) || null
}

export function findItemInHierarchy(categories, itemId) {
  for (const cat of categories || []) {
    for (const folder of cat.folders || []) {
      const item = folder.items?.find((i) => i.id === itemId)
      if (item) return { category: cat, folder, item }
    }
  }
  return { category: null, folder: null, item: null }
}

export function buildBreadcrumb({ subjectName, category, folder, item }) {
  const parts = [subjectName || 'Subject']
  if (category) parts.push(category.label || categoryLabelFromType(category.categoryType))
  if (folder) parts.push(folder.folderName)
  if (item) parts.push(item.title)
  return parts
}

export function itemTypeLabel(itemType) {
  const map = {
    LIVE_CLASS: 'Class',
    RECORDED_CLASS: 'Recording',
    TEST_SERIES: 'Test Series',
    PDFS: 'PDF',
    MAINS_ANSWER_WRITING: 'Mains Answer Writing',
  }
  return map[itemType] || 'Item'
}

export function addItemLabelForCategory(categoryType) {
  const map = {
    [CATEGORY_TYPES.LIVE_CLASS]: 'Add Class',
    [CATEGORY_TYPES.RECORDED_CLASS]: 'Add Recording',
    [CATEGORY_TYPES.TEST_SERIES]: 'Add Test Series',
    [CATEGORY_TYPES.PDFS]: 'Add PDF',
    [CATEGORY_TYPES.MAINS_ANSWER_WRITING]: 'Add Assignment',
  }
  return map[categoryType] || 'Add Item'
}
