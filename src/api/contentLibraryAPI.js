import axiosInstance from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import {
  getContentLibraryState,
  persistContentLibraryState,
  listContentItems,
  upsertContentItem,
  softDeleteContentItem,
  permanentDeleteContentItem,
  restoreContentItem,
  listContentSubjects,
  upsertContentSubject,
  deleteContentSubject,
  listContentTopics,
  upsertContentTopic,
  deleteContentTopic,
  listContentCategories,
  upsertContentCategory,
  deleteContentCategory,
  listAccessRules,
  upsertAccessRule,
  deleteAccessRule,
  listVersionsForContent,
  addContentVersion,
  getContentAnalytics,
  recordContentView,
  toggleBookmark,
  searchContent,
  getContentForStudent,
  getRecentlyViewed,
  getStudentBookmarks,
} from '../utils/contentLibraryStorage'

const BASE = '/content-library'

function useLocal() {
  return isFrontendOnly
}

export async function fetchContentItems(filters) {
  if (useLocal()) return listContentItems(filters)
  const { data } = await axiosInstance.get(`${BASE}/items`, { params: filters })
  return data.data
}

export async function saveContentItem(item) {
  if (useLocal()) return upsertContentItem(item)
  if (item.id && !String(item.id).startsWith('cnt-')) {
    const { data } = await axiosInstance.put(`${BASE}/items/${item.id}`, item)
    return data.data
  }
  const { data } = await axiosInstance.post(`${BASE}/items`, item)
  return data.data
}

export async function removeContentItem(id, { permanent = false } = {}) {
  if (useLocal()) {
    return permanent ? permanentDeleteContentItem(id) : softDeleteContentItem(id)
  }
  await axiosInstance.delete(`${BASE}/items/${id}`, { params: { permanent } })
}

export async function restoreContentItemApi(id) {
  if (useLocal()) return restoreContentItem(id)
  await axiosInstance.put(`${BASE}/items/${id}`, { status: 'Draft', deletedAt: null })
}

export { generateId } from '../utils/contentLibraryStorage'

export {
  listContentSubjects as fetchContentSubjects,
  listContentTopics as fetchContentTopics,
  listContentCategories as fetchContentCategories,
  listAccessRules as fetchAccessRules,
  listVersionsForContent,
  listVersionsForContent as fetchContentVersions,
  getContentAnalytics as fetchContentAnalytics,
  searchContent,
  getContentForStudent,
  getRecentlyViewed,
  getStudentBookmarks,
  upsertContentSubject,
  deleteContentSubject,
  upsertContentTopic,
  deleteContentTopic,
  upsertContentCategory,
  deleteContentCategory,
  upsertAccessRule,
  deleteAccessRule,
  addContentVersion,
  recordContentView,
  toggleBookmark,
  getContentLibraryState,
  persistContentLibraryState,
}
