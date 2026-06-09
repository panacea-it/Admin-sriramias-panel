import { isMongoObjectId } from './facultySubjectHelpers'
import { generateContentId } from './facultySubjectContentStorage'

/** UI hierarchy categoryType → API folder category enum */
export const CATEGORY_TYPE_TO_API = {
  LIVE_CLASS: 'LIVE_CLASS',
  RECORDED_CLASS: 'RECORDING',
  TEST_SERIES: 'PRELIMS_TEST',
  PDFS: 'PDF',
  MAINS_ANSWER_WRITING: 'MAINS_ANSWER_WRITING',
}

export const API_CATEGORY_TO_TYPE = {
  LIVE_CLASS: 'LIVE_CLASS',
  RECORDING: 'RECORDED_CLASS',
  PRELIMS_TEST: 'TEST_SERIES',
  PDF: 'PDFS',
  MAINS_ANSWER_WRITING: 'MAINS_ANSWER_WRITING',
}

export function mapCategoryTypeToApi(categoryType) {
  const key = String(categoryType || '').trim()
  return CATEGORY_TYPE_TO_API[key] || key
}

function normalizeFolderItem(item) {
  if (!item || typeof item !== 'object') return null
  return {
    id: item.id || generateContentId('item'),
    itemType: item.itemType || 'LIVE_CLASS',
    title: item.title || 'Untitled',
    linkedExistingFormId: item.linkedExistingFormId || '',
    status: item.status || 'draft',
    lastUpdated: item.lastUpdated || new Date().toISOString(),
    data: item.data || null,
    testSeries: item.testSeries,
    batchIds: Array.isArray(item.batchIds) ? item.batchIds : [],
    batchId: item.batchId || '',
  }
}

export function normalizeFolderFromApi(row) {
  if (!row || typeof row !== 'object') return null
  const id = String(row._id ?? row.id ?? '').trim()
  if (!id) return null
  return {
    id,
    apiId: id,
    folderName: String(row.folderName ?? row.name ?? 'Untitled Folder').trim(),
    description: String(row.description ?? '').trim(),
    orderIndex: row.orderIndex ?? 0,
    parentFolderId: row.parentFolderId ?? null,
    category: row.category ? String(row.category) : undefined,
    items: (Array.isArray(row.items) ? row.items : [])
      .map(normalizeFolderItem)
      .filter(Boolean),
    updatedAt: row.updatedAt || row.createdAt || new Date().toISOString(),
  }
}

export function normalizeFoldersListResponse(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : []

  return (Array.isArray(list) ? list : [])
    .map(normalizeFolderFromApi)
    .filter(Boolean)
}

export function unwrapFolderPayload(data) {
  if (data?.data != null && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }
  if (data?.data != null && Array.isArray(data.data) && data.data.length === 1) {
    return data.data[0]
  }
  return data
}

export function normalizeCreatedFolderResponse(data) {
  const row = unwrapFolderPayload(data)
  return normalizeFolderFromApi(row) || normalizeFolderFromApi(data)
}

export function resolveFolderApiId(folder) {
  if (!folder || typeof folder !== 'object') return ''
  for (const raw of [folder.apiId, folder._id, folder.id]) {
    const id = String(raw || '').trim()
    if (isMongoObjectId(id)) return id
  }
  return ''
}
