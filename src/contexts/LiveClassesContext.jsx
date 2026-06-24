import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  deleteLiveClass as apiDelete,
  fetchLiveClasses,
  saveLiveClass as apiSave,
} from '../api/liveClassesAPI'
import { lessonFormToRow } from '../utils/liveClassesMappers'
import { toast } from '../utils/toast'

const LiveClassesContext = createContext(null)

export function LiveClassesProvider({ children }) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLiveClasses()
      setLessons(data)
    } catch (err) {
      setError(err?.message || 'Failed to load live classes')
      toast.error('Could not load live classes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveLesson = useCallback(async (form, { isEdit, id, scope, actor } = {}) => {
    const existing = isEdit ? lessons.find((l) => l.id === id) : null
    const row = lessonFormToRow(form, existing)
    try {
      await apiSave(row, { isEdit, id, scope, actor })
    } catch (err) {
      toast.error(err?.message || 'Failed to save lesson')
      throw err
    }
    const data = await fetchLiveClasses()
    setLessons(data)
    return data.find((l) => l.id === (isEdit ? id : data[0]?.id)) ?? data[0]
  }, [lessons])

  const removeLesson = useCallback(async (id, { scope } = {}) => {
    await apiDelete(id, { scope })
    const data = await fetchLiveClasses()
    setLessons(data)
  }, [])

  const toggleDisabled = useCallback((id) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: l.status === 'Disabled' ? 'Scheduled' : 'Disabled',
              modifiedAt: new Date().toISOString(),
            }
          : l,
      ),
    )
  }, [])

  const rescheduleLesson = useCallback((id, { scheduledDate, scheduledTime }) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              scheduledDate,
              scheduledTime,
              modifiedAt: new Date().toISOString(),
            }
          : l,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({
      lessons,
      loading,
      error,
      reload: load,
      saveLesson,
      removeLesson,
      toggleDisabled,
      rescheduleLesson,
    }),
    [lessons, loading, error, load, saveLesson, removeLesson, toggleDisabled, rescheduleLesson],
  )

  return (
    <LiveClassesContext.Provider value={value}>{children}</LiveClassesContext.Provider>
  )
}

export function useLiveClasses() {
  const ctx = useContext(LiveClassesContext)
  if (!ctx) throw new Error('useLiveClasses must be used within LiveClassesProvider')
  return ctx
}
