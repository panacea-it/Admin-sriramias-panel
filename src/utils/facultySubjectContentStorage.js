import {
  FACULTY_CONTENT_SEED_VERSION,
  FACULTY_SUBJECT_CONTENT_SEEDS,
  getFacultySubjectContentSeed,
} from '../data/facultySubjectContentSeed'
import { buildSystemCategoriesFromSubject } from './facultySubjectHierarchy'
import { generateMongoObjectId, isMongoObjectId } from './facultySubjectHelpers'

const STORAGE_KEY = 'faculty_subject_content_v3'
const LEGACY_KEYS = ['faculty_subject_content_v1', 'faculty_subject_content_v2']

export function generateContentId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function loadAll() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const key of LEGACY_KEYS) {
        const legacy = localStorage.getItem(key)
        if (legacy) {
          raw = legacy
          try {
            localStorage.setItem(STORAGE_KEY, legacy)
            localStorage.removeItem(key)
          } catch {
            // ignore storage write failures; we'll still try to parse legacy raw
          }
          break
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return {}
}

function saveAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(
      new CustomEvent('faculty-subject-content-updated', { detail: map }),
    )
  } catch {
    /* ignore */
  }
}

function createEmptyContentDoc(subjectId, subjectMeta) {
  return {
    subjectId: String(subjectId),
    subjectName: subjectMeta?.subjectName || '',
    categoryIds: subjectMeta?.categories || [],
    facultyId: '',
    facultyName: subjectMeta?.teacher || '',
    categories: buildSystemCategoriesFromSubject(subjectMeta),
    publishStatus: 'draft',
    seedVersion: FACULTY_CONTENT_SEED_VERSION,
    updatedAt: new Date().toISOString(),
  }
}

function normalizeItem(item) {
  return {
    id: item.id || generateContentId('item'),
    itemType: item.itemType || 'LIVE_CLASS',
    title: item.title || 'Untitled',
    linkedExistingFormId: item.linkedExistingFormId || '',
    status: item.status || 'draft',
    lastUpdated: item.lastUpdated || new Date().toISOString(),
    data: item.data || null,
    testSeries: item.testSeries,
    batchIds: Array.isArray(item.batchIds) ? item.batchIds : item.batchId ? [item.batchId] : [],
    batchId: item.batchId || item.batchIds?.[0] || '',
  }
}

function normalizeFolder(folder) {
  const rawId = folder._id ?? folder.id
  const id = isMongoObjectId(rawId) ? String(rawId) : generateMongoObjectId()
  return {
    id,
    apiId: isMongoObjectId(rawId) ? String(rawId) : id,
    parentFolderId: folder.parentFolderId ?? null,
    folderName: folder.folderName || 'Untitled Folder',
    description: folder.description || '',
    orderIndex: folder.orderIndex ?? 0,
    updatedAt: folder.updatedAt || new Date().toISOString(),
    items: (folder.items || []).map(normalizeItem),
  }
}

/** Upgrade legacy fld-* folder ids to Mongo ids for live-class API compatibility. */
export function ensureMongoFolderIds(doc) {
  if (!doc?.categories?.length) return { doc, changed: false }
  let changed = false
  const categories = doc.categories.map((cat) => ({
    ...cat,
    folders: (cat.folders || []).map((folder) => {
      if (isMongoObjectId(folder?.id)) {
        return normalizeFolder(folder)
      }
      changed = true
      return normalizeFolder({ ...folder, id: generateMongoObjectId() })
    }),
  }))
  return { doc: { ...doc, categories }, changed }
}

function normalizeCategory(cat) {
  return {
    id: cat.id || generateContentId('cat'),
    categoryType: cat.categoryType,
    label: cat.label || '',
    orderIndex: cat.orderIndex ?? 0,
    folders: (cat.folders || []).map(normalizeFolder),
  }
}

/** Only categories selected on the subject; merge stored folders by type */
export function mergeCategoriesForSubject(storedCategories, subjectMeta) {
  const allowed = buildSystemCategoriesFromSubject(subjectMeta)
  const byType = new Map((storedCategories || []).map((c) => [c.categoryType, c]))
  return allowed.map((base) => {
    const stored = byType.get(base.categoryType)
    if (!stored) {
      return normalizeCategory({ ...base, folders: [] })
    }
    return normalizeCategory({
      ...stored,
      id: base.id,
      label: base.label,
      categoryType: base.categoryType,
      orderIndex: base.orderIndex,
    })
  })
}

function normalizeContentDoc(doc, subjectId, subjectMeta) {
  const base = createEmptyContentDoc(subjectId, subjectMeta)
  let rawCategories = doc.categories?.length
    ? doc.categories.map(normalizeCategory)
    : doc.folders?.length
      ? migrateLegacyFolders(doc.folders)
      : []

  const categories = mergeCategoriesForSubject(rawCategories, subjectMeta)

  return {
    ...base,
    ...doc,
    subjectId: String(subjectId),
    categoryIds: subjectMeta?.categories || doc.categoryIds || base.categoryIds,
    seedVersion: doc.seedVersion ?? FACULTY_CONTENT_SEED_VERSION,
    categories,
    updatedAt: new Date().toISOString(),
  }
}

/** Legacy v1/v2: flat folders with topics → single LIVE_CLASS category */
function migrateLegacyFolders(folders) {
  return [
    {
      id: 'cat-live',
      categoryType: 'LIVE_CLASS',
      label: 'Live Class',
      orderIndex: 0,
      folders: folders.map((f) => ({
        ...normalizeFolder({
          ...f,
          items: (f.topics || []).map((t) => ({
            id: t.id,
            itemType: 'LIVE_CLASS',
            title: t.topicName,
            status: t.status,
            lastUpdated: t.lastUpdated,
          })),
        }),
      })),
    },
  ]
}

function shouldApplySeed(row, subjectId) {
  const seed = getFacultySubjectContentSeed(subjectId)
  if (!seed) return false
  if (!row) return true
  if (row.seedVersion !== FACULTY_CONTENT_SEED_VERSION) return true
  if (!row.categories?.length) return true
  return false
}

export function resetFacultySubjectContentDemos() {
  const map = loadAll()
  Object.keys(FACULTY_SUBJECT_CONTENT_SEEDS).forEach((id) => {
    const seed = getFacultySubjectContentSeed(id)
    if (seed) map[id] = normalizeContentDoc(seed, id)
  })
  saveAll(map)
}

export function loadSubjectContent(subjectId, subjectMeta) {
  const map = loadAll()
  const key = String(subjectId)
  const row = map[key]
  const seed = getFacultySubjectContentSeed(subjectId)

  if (row && !shouldApplySeed(row, subjectId)) {
    return normalizeContentDoc(row, subjectId, subjectMeta)
  }

  const base = seed
    ? normalizeContentDoc(seed, subjectId, subjectMeta)
    : createEmptyContentDoc(subjectId, subjectMeta)
  map[key] = base
  saveAll(map)
  return base
}

export function saveSubjectContent(doc, subjectMeta) {
  const map = loadAll()
  const normalized = normalizeContentDoc(doc, doc.subjectId, subjectMeta || doc)
  map[String(doc.subjectId)] = normalized
  saveAll(map)
  return normalized
}

export function deleteSubjectContentStorage(subjectId) {
  const map = loadAll()
  delete map[String(subjectId)]
  saveAll(map)
}

export function updateCategoryFolders(content, categoryId, updater) {
  return {
    ...content,
    categories: content.categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, folders: updater(cat.folders || []) }
        : cat,
    ),
  }
}

export function findFolderInContent(content, categoryId, folderId) {
  const cat = content?.categories?.find((c) => c.id === categoryId)
  return cat?.folders?.find((f) => f.id === folderId) || null
}
