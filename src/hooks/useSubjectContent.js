import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createContentFolder,
  deleteContentFolder,
  getContentFolders,
  updateContentFolder,
} from '../api/facultySubjectFoldersAPI'
import { buildSystemCategoriesFromSubject } from '../utils/facultySubjectHierarchy'
import {
  mapCategoryTypeToApi,
  normalizeCreatedFolderResponse,
  normalizeFoldersListResponse,
} from '../utils/facultySubjectFolderHelpers'
import { isMongoObjectId, mapApiCategoriesToUi } from '../utils/facultySubjectHelpers'
import {
  generateContentId,
  loadSubjectContent,
  saveSubjectContent,
} from '../utils/facultySubjectContentStorage'

function buildSubjectForCategories(subjectMeta) {
  if (!subjectMeta) return subjectMeta
  return {
    ...subjectMeta,
    categories: mapApiCategoriesToUi(subjectMeta.categories),
  }
}

function buildContentSnapshot(subjectId, subjectMeta, categories) {
  return {
    subjectId: String(subjectId),
    subjectName: subjectMeta?.subjectName || '',
    categoryIds: mapApiCategoriesToUi(subjectMeta?.categories),
    facultyName: subjectMeta?.teacher || '',
    categories,
  }
}

function resolveStoredFolders(storedContent, categoryType) {
  return (
    storedContent?.categories?.find((c) => c.categoryType === categoryType)?.folders || []
  )
}

function mergeFolderLists(apiFolders, storedFolders, preservedFolders) {
  if (apiFolders?.length) return apiFolders
  if (storedFolders?.length) return storedFolders
  return preservedFolders || []
}

export function useSubjectContent(subjectId, { subjectMeta, facultySubjectApiId } = {}) {
  const [content, setContent] = useState(() => {
    if (!subjectId) return null
    const stored = loadSubjectContent(subjectId, subjectMeta)
    return stored?.categories?.length ? stored : null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const abortRef = useRef(null)
  const contentRef = useRef(null)
  const subjectMetaRef = useRef(subjectMeta)

  subjectMetaRef.current = subjectMeta
  contentRef.current = content

  const resolvedFacultySubjectId = isMongoObjectId(facultySubjectApiId)
    ? String(facultySubjectApiId)
    : isMongoObjectId(subjectId)
      ? String(subjectId)
      : ''

  const subjectLoadKey = useMemo(() => {
    const cats = mapApiCategoriesToUi(subjectMeta?.categories)
    return `${resolvedFacultySubjectId}:${JSON.stringify([...cats].sort())}`
  }, [resolvedFacultySubjectId, subjectMeta?.categories])

  const loadFoldersForCategory = useCallback(
    async (categoryType, { signal, bypassCache = false } = {}) => {
      if (!resolvedFacultySubjectId || !categoryType) return []
      const data = await getContentFolders(
        resolvedFacultySubjectId,
        mapCategoryTypeToApi(categoryType),
        { signal, bypassCache },
      )
      return normalizeFoldersListResponse(data)
    },
    [resolvedFacultySubjectId],
  )

  const load = useCallback(async () => {
    if (!subjectId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const subjectForCategories = buildSubjectForCategories(subjectMetaRef.current)
    const baseCategories = buildSystemCategoriesFromSubject(subjectForCategories)
    const storedContent = loadSubjectContent(subjectId, subjectForCategories)
    const existingContent =
      contentRef.current?.subjectId === String(subjectId) ? contentRef.current : storedContent
    const showInitialLoading = !existingContent?.categories?.some((c) => c.folders?.length)

    if (showInitialLoading) setLoading(true)

    try {
      if (!resolvedFacultySubjectId) {
        if (controller.signal.aborted) return
        setContent(buildContentSnapshot(subjectId, subjectMetaRef.current, baseCategories))
        return
      }

      const categories = await Promise.all(
        baseCategories.map(async (cat) => {
          if (controller.signal.aborted) return { ...cat, folders: [] }
          const preserved =
            existingContent?.categories?.find((c) => c.id === cat.id)?.folders || []
          const storedFolders = resolveStoredFolders(storedContent, cat.categoryType)
          try {
            const folders = await loadFoldersForCategory(cat.categoryType, {
              signal: controller.signal,
            })
            return {
              ...cat,
              folders: mergeFolderLists(folders, storedFolders, preserved),
            }
          } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
            if (import.meta.env.DEV) {
              console.warn(`Folders load failed for ${cat.categoryType}`, error)
            }
            return { ...cat, folders: mergeFolderLists([], storedFolders, preserved) }
          }
        }),
      )

      if (controller.signal.aborted) return

      const snapshot = buildContentSnapshot(subjectId, subjectMetaRef.current, categories)
      setContent(snapshot)
      try {
        saveSubjectContent(snapshot, subjectForCategories)
      } catch {
        /* ignore storage failures */
      }
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      if (import.meta.env.DEV) console.error(error)
      const fallbackCategories = buildSystemCategoriesFromSubject(subjectForCategories)
      const mergedCategories = fallbackCategories.map((cat) => {
        const preserved =
          contentRef.current?.categories?.find((c) => c.id === cat.id)?.folders ||
          resolveStoredFolders(storedContent, cat.categoryType)
        return { ...cat, folders: preserved }
      })
      const snapshot = buildContentSnapshot(subjectId, subjectMetaRef.current, mergedCategories)
      setContent(snapshot)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [subjectId, resolvedFacultySubjectId, loadFoldersForCategory])

  useEffect(() => {
    if (!subjectId) return undefined
    load()
    return () => abortRef.current?.abort()
  }, [subjectLoadKey, subjectId, load])

  const reloadCategoryFolders = useCallback(
    async (categoryId) => {
      if (!content || !resolvedFacultySubjectId) return
      const cat = content.categories.find((c) => c.id === categoryId)
      if (!cat) return
      const folders = await loadFoldersForCategory(cat.categoryType, { bypassCache: true })
      setContent((prev) => {
        if (!prev) return prev
        const storedFolders = resolveStoredFolders(loadSubjectContent(subjectId, subjectMeta), cat.categoryType)
        const merged = mergeFolderLists(
          folders,
          storedFolders,
          prev.categories.find((c) => c.id === categoryId)?.folders,
        )
        const next = {
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, folders: merged } : c,
          ),
        }
        try {
          saveSubjectContent(next, subjectMeta)
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [content, resolvedFacultySubjectId, loadFoldersForCategory, subjectId, subjectMeta],
  )

  const createFolder = useCallback(
    async ({ categoryId, categoryType, folderName, description = '' }) => {
      if (!resolvedFacultySubjectId) {
        throw new Error('Faculty subject id is missing')
      }
      setSaving(true)
      try {
        const data = await createContentFolder({
          facultySubjectId: resolvedFacultySubjectId,
          category: mapCategoryTypeToApi(categoryType),
          folderName: String(folderName || '').trim(),
          description: String(description || '').trim(),
        })
        const folder =
          normalizeCreatedFolderResponse(data) ||
          normalizeFoldersListResponse({ data: [data?.data ?? data] })[0]
        if (!folder) {
          await reloadCategoryFolders(categoryId)
          const refreshed = content?.categories?.find((c) => c.id === categoryId)?.folders
          return refreshed?.[refreshed.length - 1] || null
        }
        setContent((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            categories: prev.categories.map((c) =>
              c.id === categoryId ? { ...c, folders: [...(c.folders || []), folder] } : c,
            ),
          }
        })
        return folder
      } finally {
        setSaving(false)
      }
    },
    [resolvedFacultySubjectId, reloadCategoryFolders, content?.categories],
  )

  const renameFolder = useCallback(async ({ folderId, folderName, description }) => {
    setSaving(true)
    try {
      await updateContentFolder(folderId, {
        folderName: String(folderName || '').trim(),
        description: String(description ?? '').trim(),
      })
      setContent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            folders: (cat.folders || []).map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    folderName: String(folderName || '').trim(),
                    description: String(description ?? f.description ?? '').trim(),
                    updatedAt: new Date().toISOString(),
                  }
                : f,
            ),
          })),
        }
      })
    } finally {
      setSaving(false)
    }
  }, [])

  const removeFolder = useCallback(async (folderId) => {
    setSaving(true)
    try {
      await deleteContentFolder(folderId)
      setContent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            folders: (cat.folders || []).filter((f) => f.id !== folderId),
          })),
        }
      })
    } finally {
      setSaving(false)
    }
  }, [])

  /** Update folder items in local UI state (live class links, etc.) */
  const updateFolderItems = useCallback((categoryId, folderId, updater) => {
    setContent((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        categories: prev.categories.map((cat) => {
          if (cat.id !== categoryId) return cat
          return {
            ...cat,
            folders: (cat.folders || []).map((f) => {
              if (f.id !== folderId) return f
              const items = typeof updater === 'function' ? updater(f.items || []) : updater
              return { ...f, items, updatedAt: new Date().toISOString() }
            }),
          }
        }),
      }
    })
  }, [])

  const persist = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(content) : { ...content, ...updater }
    if (!next) return null
    setContent(next)
    return next
  }, [content])

  return {
    content,
    setContent,
    loading,
    saving,
    reload: load,
    reloadCategoryFolders,
    createFolder,
    renameFolder,
    removeFolder,
    updateFolderItems,
    persist,
    generateContentId,
    facultySubjectApiId: resolvedFacultySubjectId,
  }
}
