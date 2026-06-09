import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createContentFolder,
  deleteContentFolder,
  getContentFolders,
  updateContentFolder,
} from '../api/facultySubjectFoldersAPI'
import { getApiErrorMessage } from '../utils/apiError'
import { buildSystemCategoriesFromSubject } from '../utils/facultySubjectHierarchy'
import {
  mapCategoryTypeToApi,
  normalizeCreatedFolderResponse,
  normalizeFoldersListResponse,
} from '../utils/facultySubjectFolderHelpers'
import { generateContentId } from '../utils/facultySubjectContentStorage'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

export function useSubjectContent(subjectId, { subjectMeta, facultySubjectApiId } = {}) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const abortRef = useRef(null)

  const resolvedFacultySubjectId = isMongoObjectId(facultySubjectApiId)
    ? String(facultySubjectApiId)
    : isMongoObjectId(subjectId)
      ? String(subjectId)
      : ''

  const loadFoldersForCategory = useCallback(
    async (categoryType, { signal } = {}) => {
      if (!resolvedFacultySubjectId || !categoryType) return []
      const data = await getContentFolders(resolvedFacultySubjectId, mapCategoryTypeToApi(categoryType), {
        signal,
      })
      return normalizeFoldersListResponse(data)
    },
    [resolvedFacultySubjectId],
  )

  const load = useCallback(async () => {
    if (!subjectId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const baseCategories = buildSystemCategoriesFromSubject(subjectMeta)

      if (!resolvedFacultySubjectId) {
        setContent({
          subjectId: String(subjectId),
          subjectName: subjectMeta?.subjectName || '',
          categoryIds: subjectMeta?.categories || [],
          facultyName: subjectMeta?.teacher || '',
          categories: baseCategories,
        })
        return
      }

      const categories = await Promise.all(
        baseCategories.map(async (cat) => {
          try {
            const folders = await loadFoldersForCategory(cat.categoryType, {
              signal: controller.signal,
            })
            return { ...cat, folders }
          } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
            if (import.meta.env.DEV) console.warn(`Folders load failed for ${cat.categoryType}`, error)
            return { ...cat, folders: [] }
          }
        }),
      )

      if (controller.signal.aborted) return

      setContent({
        subjectId: String(subjectId),
        subjectName: subjectMeta?.subjectName || '',
        categoryIds: subjectMeta?.categories || [],
        facultyName: subjectMeta?.teacher || '',
        categories,
      })
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      if (import.meta.env.DEV) console.error(error)
      setContent({
        subjectId: String(subjectId),
        subjectName: subjectMeta?.subjectName || '',
        categoryIds: subjectMeta?.categories || [],
        facultyName: subjectMeta?.teacher || '',
        categories: buildSystemCategoriesFromSubject(subjectMeta),
      })
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [subjectId, subjectMeta, resolvedFacultySubjectId, loadFoldersForCategory])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const reloadCategoryFolders = useCallback(
    async (categoryId) => {
      if (!content || !resolvedFacultySubjectId) return
      const cat = content.categories.find((c) => c.id === categoryId)
      if (!cat) return
      const folders = await loadFoldersForCategory(cat.categoryType)
      setContent((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, folders } : c,
          ),
        }
      })
    },
    [content, resolvedFacultySubjectId, loadFoldersForCategory],
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