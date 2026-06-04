import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import {
  fetchContentItems,
  saveContentItem,
  removeContentItem,
  restoreContentItemApi,
  fetchContentSubjects,
  fetchContentTopics,
  fetchContentCategories,
  fetchAccessRules,
  fetchContentAnalytics,
  upsertContentSubject,
  deleteContentSubject,
  upsertContentTopic,
  deleteContentTopic,
  upsertContentCategory,
  deleteContentCategory,
  upsertAccessRule,
  deleteAccessRule,
  addContentVersion,
} from '../api/contentLibraryAPI'
import { formToContentItem } from '../utils/contentLibraryMappers'
import { generateId } from '../utils/contentLibraryStorage'

const ContentLibraryContext = createContext(null)

export function ContentLibraryProvider({ children }) {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [categories, setCategories] = useState([])
  const [accessRules, setAccessRules] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [itemRows, subRows, topRows, catRows, ruleRows, analyticsRow] =
        await Promise.all([
          fetchContentItems({ excludeDeleted: false }),
          fetchContentSubjects(),
          fetchContentTopics(),
          fetchContentCategories(),
          fetchAccessRules(),
          fetchContentAnalytics(),
        ])
      setItems(itemRows)
      setSubjects(subRows)
      setTopics(topRows)
      setCategories(catRows)
      setAccessRules(ruleRows)
      setAnalytics(analyticsRow)
    } catch {
      toast.error('Failed to load content library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener('content-library-updated', onUpdate)
    return () => window.removeEventListener('content-library-updated', onUpdate)
  }, [refresh])

  const saveItem = useCallback(
    async (form, existing, meta = {}) => {
      const row = formToContentItem(form, existing, meta)
      if (existing && form.files?.some((f) => f.file)) {
        addContentVersion({
          id: generateId('ver'),
          contentId: row.id,
          version: (existing.version || 1) + 1,
          fileName: form.files[0]?.name,
          changedBy: row.uploadedBy,
          changedAt: new Date().toISOString(),
          note: 'File replaced',
        })
        row.version = (existing.version || 1) + 1
      }
      await saveContentItem(row)
      if (meta.notify && row.notifyOnPublish) {
        toast.message('Students will be notified of new content')
      }
      await refresh()
      return row
    },
    [refresh],
  )

  const deleteItem = useCallback(
    async (id, permanent = false) => {
      await removeContentItem(id, { permanent })
      toast.success(permanent ? 'Permanently deleted' : 'Moved to recycle bin')
      await refresh()
    },
    [refresh],
  )

  const restoreItem = useCallback(
    async (id) => {
      await restoreContentItemApi(id)
      toast.success('Content restored')
      await refresh()
    },
    [refresh],
  )

  const duplicateItem = useCallback(
    async (item) => {
      const copy = {
        ...item,
        id: generateId('cnt'),
        title: `${item.title} (Copy)`,
        status: 'Draft',
        views: 0,
        downloads: 0,
        publishedAt: '',
        deletedAt: null,
        recycleExpiresAt: null,
        seoSlug: `${item.seoSlug}-copy`,
      }
      await saveContentItem(copy)
      toast.success('Content duplicated')
      await refresh()
    },
    [refresh],
  )

  const togglePublish = useCallback(
    async (item) => {
      const nextStatus = item.status === 'Published' ? 'Draft' : 'Published'
      const updated = {
        ...item,
        status: nextStatus,
        publishedAt: nextStatus === 'Published' ? new Date().toISOString() : item.publishedAt,
        approvalStatus: nextStatus === 'Published' ? 'approved' : item.approvalStatus,
      }
      await saveContentItem(updated)
      toast.success(nextStatus === 'Published' ? 'Content published' : 'Content unpublished')
      await refresh()
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      items,
      subjects,
      topics,
      categories,
      accessRules,
      analytics,
      loading,
      refresh,
      saveItem,
      deleteItem,
      restoreItem,
      duplicateItem,
      togglePublish,
      upsertContentSubject,
      deleteContentSubject,
      upsertContentTopic,
      deleteContentTopic,
      upsertContentCategory,
      deleteContentCategory,
      upsertAccessRule,
      deleteAccessRule,
      setSubjects,
      setTopics,
      setCategories,
      setAccessRules,
    }),
    [
      items,
      subjects,
      topics,
      categories,
      accessRules,
      analytics,
      loading,
      refresh,
      saveItem,
      deleteItem,
      restoreItem,
      duplicateItem,
      togglePublish,
    ],
  )

  return (
    <ContentLibraryContext.Provider value={value}>{children}</ContentLibraryContext.Provider>
  )
}

export function useContentLibrary() {
  const ctx = useContext(ContentLibraryContext)
  if (!ctx) throw new Error('useContentLibrary must be used within ContentLibraryProvider')
  return ctx
}
