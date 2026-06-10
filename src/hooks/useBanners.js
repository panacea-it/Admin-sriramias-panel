import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteBanner,
  fetchBanners,
  toggleBannerStatus,
  updateBanner,
} from '../api/bannersAPI'
import { toast } from '../utils/toast'

export function useBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())
  const [editBanner, setEditBanner] = useState(null)
  const [previewBanner, setPreviewBanner] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setLoadError(null)
    try {
      const list = await fetchBanners({ signal: controller.signal })
      if (!controller.signal.aborted) setBanners(list)
    } catch (e) {
      if (e?.name === 'AbortError') return
      const message = e?.message || 'Failed to load banners'
      setLoadError(message)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const mergeRow = useCallback((saved) => {
    if (!saved?.id) return
    setBanners((prev) => prev.map((b) => (b.id === saved.id ? saved : b)))
  }, [])

  const handleSave = useCallback(
    async (payload, { id }) => {
      setSaving(true)
      try {
        const saved = await updateBanner(payload, { id })
        mergeRow(saved)
        return saved
      } finally {
        setSaving(false)
      }
    },
    [mergeRow],
  )

  const handleToggleStatus = useCallback(
    async (row) => {
      let blocked = false
      setStatusUpdatingIds((prev) => {
        if (prev.has(row.id)) {
          blocked = true
          return prev
        }
        return new Set(prev).add(row.id)
      })
      if (blocked) return

      const previous = row.status
      const optimistic = previous === 'Active' ? 'In Active' : 'Active'

      setBanners((prev) =>
        prev.map((b) => (b.id === row.id ? { ...b, status: optimistic } : b)),
      )

      try {
        const saved = await toggleBannerStatus(row.id)
        mergeRow(saved)
        toast.success(
          saved.status === 'Active' ? 'Banner activated' : 'Banner marked inactive',
        )
      } catch (e) {
        setBanners((prev) =>
          prev.map((b) => (b.id === row.id ? { ...b, status: previous } : b)),
        )
        toast.error(e?.message || 'Failed to update status')
      } finally {
        setStatusUpdatingIds((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [mergeRow],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const id = deleteTarget.id
    const snapshot = banners
    setBanners((prev) => prev.filter((b) => b.id !== id))
    try {
      await deleteBanner(id)
      toast.success('Banner deleted')
      setDeleteTarget(null)
    } catch (e) {
      setBanners(snapshot)
      toast.error(e?.message || 'Failed to delete banner')
    } finally {
      setDeleting(false)
    }
  }, [banners, deleteTarget])

  const handlers = useMemo(
    () => ({
      openEdit: setEditBanner,
      closeEdit: () => setEditBanner(null),
      openPreview: setPreviewBanner,
      closePreview: () => setPreviewBanner(null),
      requestDelete: setDeleteTarget,
      cancelDelete: () => setDeleteTarget(null),
    }),
    [],
  )

  return {
    banners,
    loading,
    loadError,
    statusUpdatingIds,
    editBanner,
    previewBanner,
    deleteTarget,
    deleting,
    saving,
    load,
    handleSave,
    handleToggleStatus,
    handleDelete,
    ...handlers,
  }
}
