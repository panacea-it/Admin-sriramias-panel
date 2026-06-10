import {
  INITIAL_ACCESS_RULES,
  INITIAL_CONTENT_ANALYTICS,
  INITIAL_CONTENT_CATEGORIES,
  INITIAL_CONTENT_ITEMS,
  INITIAL_CONTENT_SUBJECTS,
  INITIAL_CONTENT_TOPICS,
  INITIAL_CONTENT_VERSIONS,
  INITIAL_STUDENT_BOOKMARKS,
  INITIAL_STUDENT_VIEWS,
} from '../data/contentLibrarySeed'
import { RECYCLE_AUTO_DELETE_DAYS } from './contentLibraryTypes'

const STORAGE_KEY = 'sriram_content_library_v1'

const DEFAULT_STATE = {
  items: INITIAL_CONTENT_ITEMS,
  subjects: INITIAL_CONTENT_SUBJECTS,
  topics: INITIAL_CONTENT_TOPICS,
  categories: INITIAL_CONTENT_CATEGORIES,
  accessRules: INITIAL_ACCESS_RULES,
  versions: INITIAL_CONTENT_VERSIONS,
  analytics: INITIAL_CONTENT_ANALYTICS,
  bookmarks: INITIAL_STUDENT_BOOKMARKS,
  views: INITIAL_STUDENT_VIEWS,
  searchIndex: [],
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('content-library-updated'))
}

export function getContentLibraryState() {
  return loadState()
}

export function persistContentLibraryState(state) {
  saveState(state)
}

function update(mutator) {
  const next = mutator(loadState())
  saveState(next)
  return next
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ——— Items ———
export function listContentItems(filters = {}) {
  const { items } = loadState()
  return filterItems(items, filters)
}

export function getContentItem(id) {
  return loadState().items.find((i) => i.id === id) || null
}

export function upsertContentItem(item) {
  return update((s) => {
    const idx = s.items.findIndex((i) => i.id === item.id)
    const items = idx >= 0 ? s.items.map((i, n) => (n === idx ? item : i)) : [item, ...s.items]
    return { ...s, items, searchIndex: buildSearchIndex(items) }
  }).items.find((i) => i.id === item.id)
}

export function softDeleteContentItem(id) {
  const deletedAt = new Date().toISOString()
  const recycleExpiresAt = new Date(
    Date.now() + RECYCLE_AUTO_DELETE_DAYS * 86400000,
  ).toISOString()
  return update((s) => ({
    ...s,
    items: s.items.map((i) =>
      i.id === id
        ? { ...i, status: 'Deleted', deletedAt, recycleExpiresAt }
        : i,
    ),
  }))
}

export function restoreContentItem(id) {
  return update((s) => ({
    ...s,
    items: s.items.map((i) =>
      i.id === id
        ? { ...i, status: 'Draft', deletedAt: null, recycleExpiresAt: null }
        : i,
    ),
  }))
}

export function permanentDeleteContentItem(id) {
  return update((s) => ({
    ...s,
    items: s.items.filter((i) => i.id !== id),
    versions: s.versions.filter((v) => v.contentId !== id),
  }))
}

// ——— Subjects / Topics / Categories ———
export function listContentSubjects() {
  return [...loadState().subjects].sort((a, b) => a.displayOrder - b.displayOrder)
}

export function upsertContentSubject(subject) {
  return update((s) => {
    const idx = s.subjects.findIndex((x) => x.id === subject.id)
    const subjects =
      idx >= 0 ? s.subjects.map((x, n) => (n === idx ? subject : x)) : [...s.subjects, subject]
    return { ...s, subjects }
  }).subjects
}

export function deleteContentSubject(id) {
  return update((s) => ({ ...s, subjects: s.subjects.filter((x) => x.id !== id) }))
}

export function listContentTopics(subjectId) {
  const topics = loadState().topics
  if (!subjectId) return [...topics].sort((a, b) => a.displayOrder - b.displayOrder)
  return topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.displayOrder - b.displayOrder)
}

export function upsertContentTopic(topic) {
  return update((s) => {
    const idx = s.topics.findIndex((x) => x.id === topic.id)
    const topics =
      idx >= 0 ? s.topics.map((x, n) => (n === idx ? topic : x)) : [...s.topics, topic]
    return { ...s, topics }
  }).topics
}

export function deleteContentTopic(id) {
  return update((s) => ({ ...s, topics: s.topics.filter((x) => x.id !== id) }))
}

export function listContentCategories() {
  return loadState().categories
}

export function upsertContentCategory(category) {
  return update((s) => {
    const idx = s.categories.findIndex((x) => x.id === category.id)
    const categories =
      idx >= 0
        ? s.categories.map((x, n) => (n === idx ? category : x))
        : [...s.categories, category]
    return { ...s, categories }
  }).categories
}

export function deleteContentCategory(id) {
  return update((s) => ({
    ...s,
    categories: s.categories.filter((x) => x.id !== id && !x.isSystem),
  }))
}

// ——— Access rules ———
export function listAccessRules() {
  return loadState().accessRules
}

export function upsertAccessRule(rule) {
  return update((s) => {
    const idx = s.accessRules.findIndex((x) => x.id === rule.id)
    const accessRules =
      idx >= 0
        ? s.accessRules.map((x, n) => (n === idx ? rule : x))
        : [...s.accessRules, rule]
    return { ...s, accessRules }
  }).accessRules
}

export function deleteAccessRule(id) {
  return update((s) => ({ ...s, accessRules: s.accessRules.filter((x) => x.id !== id) }))
}

// ——— Versions ———
export function listVersionsForContent(contentId) {
  return loadState()
    .versions.filter((v) => v.contentId === contentId)
    .sort((a, b) => b.version - a.version)
}

export function addContentVersion(entry) {
  return update((s) => ({ ...s, versions: [...s.versions, entry] })).versions
}

// ——— Analytics ———
export function getContentAnalytics() {
  const s = loadState()
  const published = s.items.filter((i) => i.status === 'Published' && !i.deletedAt)
  return {
    ...s.analytics,
    totalUploads: s.items.filter((i) => !i.deletedAt).length,
    topViewed: [...published].sort((a, b) => b.views - a.views).slice(0, 5),
    topDownloaded: [...published].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    activeSubjects: s.subjects.filter((x) => x.status === 'Active').length,
    activeTopics: s.topics.filter((x) => x.status === 'Active').length,
  }
}

export function recordContentView(contentId, studentId, progress = 0) {
  return update((s) => ({
    ...s,
    views: [
      {
        id: generateId('view'),
        contentId,
        studentId,
        viewedAt: new Date().toISOString(),
        progress,
      },
      ...s.views,
    ].slice(0, 500),
    items: s.items.map((i) =>
      i.id === contentId ? { ...i, views: (i.views || 0) + 1 } : i,
    ),
  }))
}

export function toggleBookmark(contentId, studentId) {
  return update((s) => {
    const exists = s.bookmarks.find(
      (b) => b.contentId === contentId && b.studentId === studentId,
    )
    const bookmarks = exists
      ? s.bookmarks.filter((b) => !(b.contentId === contentId && b.studentId === studentId))
      : [
          ...s.bookmarks,
          { id: generateId('bm'), contentId, studentId, createdAt: new Date().toISOString() },
        ]
    return { ...s, bookmarks }
  })
}

export function getStudentBookmarks(studentId) {
  return loadState().bookmarks.filter((b) => b.studentId === studentId)
}

export function getRecentlyViewed(studentId, limit = 10) {
  const seen = new Set()
  const out = []
  for (const v of loadState().views) {
    if (v.studentId !== studentId || seen.has(v.contentId)) continue
    seen.add(v.contentId)
    const item = getContentItem(v.contentId)
    if (item) out.push({ ...item, lastViewedAt: v.viewedAt, progress: v.progress })
    if (out.length >= limit) break
  }
  return out
}

// ——— Search ———
function buildSearchIndex(items) {
  return items.map((i) => ({
    id: i.id,
    text: [i.title, i.description, ...(i.tags || []), ...(i.keywords || [])]
      .join(' ')
      .toLowerCase(),
  }))
}

export function searchContent(query, limit = 12) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  const index = loadState().searchIndex.length
    ? loadState().searchIndex
    : buildSearchIndex(loadState().items)
  const ids = index
    .filter((row) => row.text.includes(q))
    .slice(0, limit)
    .map((r) => r.id)
  return loadState().items.filter((i) => ids.includes(i.id))
}

export function filterItems(items, filters = {}) {
  const {
    search = '',
    status,
    subjectId,
    topicId,
    batchId,
    courseId,
    contentType,
    categoryId,
    uploadedBy,
    dateFrom,
    dateTo,
    excludeDeleted = true,
  } = filters

  const q = search.trim().toLowerCase()

  return items.filter((row) => {
    if (excludeDeleted && row.status === 'Deleted') return false
    if (status && status !== 'all' && row.status !== status) return false
    if (subjectId && subjectId !== 'all' && !row.subjectIds?.includes(subjectId)) return false
    if (topicId && topicId !== 'all' && !row.topicIds?.includes(topicId)) return false
    if (batchId && batchId !== 'all' && !row.batchIds?.includes(batchId)) return false
    if (courseId && courseId !== 'all' && !row.courseIds?.includes(courseId)) return false
    if (contentType && contentType !== 'all' && row.contentType !== contentType) return false
    if (categoryId && categoryId !== 'all' && row.categoryId !== categoryId) return false
    if (uploadedBy && uploadedBy !== 'all' && row.uploadedBy !== uploadedBy) return false
    if (q) {
      const hay = [row.title, row.description, ...(row.tags || [])].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (dateFrom && row.uploadedAt < dateFrom) return false
    if (dateTo && row.uploadedAt > dateTo) return false
    return true
  })
}

export function getContentForStudent(studentContext = {}) {
  const { batchIds = [], courseIds = [], membership = 'paid', studentId } = studentContext
  const state = loadState()
  const rules = state.accessRules.filter((r) => r.status === 'Active')

  return state.items.filter((item) => {
    if (item.status !== 'Published' || item.deletedAt) return false
    if (item.access?.expiryDate && new Date(item.access.expiryDate) < new Date()) return false
    if (item.visibility === 'Public') return true
    if (item.access?.trialUsers && membership === 'trial') return true
    if (item.access?.paidOnly && membership !== 'paid') return false
    const batchMatch =
      !item.access?.batchSpecific ||
      item.batchIds?.some((id) => batchIds.includes(id))
    const courseMatch =
      !item.access?.courseSpecific ||
      item.courseIds?.some((id) => courseIds.includes(id))
    const ruleMatch = rules.some(
      (r) =>
        r.contentIds?.includes(item.id) &&
        (r.targetIds?.some((t) => batchIds.includes(t) || courseIds.includes(t)) ||
          r.membership === membership),
    )
    void studentId
    return batchMatch && courseMatch || ruleMatch
  })
}
