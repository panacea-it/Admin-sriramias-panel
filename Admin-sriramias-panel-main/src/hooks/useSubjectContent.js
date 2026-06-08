import { useCallback, useEffect, useState } from 'react'
import {
  fetchSubjectContent,
  persistSubjectContent,
} from '../api/facultySubjectContentAPI'
import { generateContentId } from '../utils/facultySubjectContentStorage'

export function useSubjectContent(subjectId, { subjectMeta } = {}) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!subjectId) return
    setLoading(true)
    try {
      const doc = await fetchSubjectContent(subjectId, subjectMeta)
      setContent({
        ...doc,
        subjectName: doc.subjectName || subjectMeta?.subjectName || '',
        categoryIds: doc.categoryIds?.length
          ? doc.categoryIds
          : subjectMeta?.categories || [],
        facultyName: doc.facultyName || subjectMeta?.teacher || '',
      })
    } finally {
      setLoading(false)
    }
  }, [subjectId, subjectMeta?.subjectName, subjectMeta?.categories, subjectMeta?.teacher])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const refresh = () => {
      if (subjectId) load()
    }
    window.addEventListener('faculty-subject-content-updated', refresh)
    return () => window.removeEventListener('faculty-subject-content-updated', refresh)
  }, [subjectId, load])

  const save = useCallback(
    async (nextDoc) => {
      setSaving(true)
      try {
        const saved = await persistSubjectContent(nextDoc, subjectMeta)
        setContent(saved)
        return saved
      } finally {
        setSaving(false)
      }
    },
    [subjectMeta],
  )

  const updateContent = useCallback(
    (updater) => {
      setContent((prev) => {
        if (!prev) return prev
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        return next
      })
    },
    [],
  )

  const persist = useCallback(
    async (updater) => {
      const next =
        typeof updater === 'function'
          ? updater(content)
          : { ...content, ...updater }
      if (!next) return null
      return save(next)
    },
    [content, save],
  )

  return {
    content,
    setContent,
    loading,
    saving,
    reload: load,
    save,
    updateContent,
    persist,
    generateContentId,
  }
}
