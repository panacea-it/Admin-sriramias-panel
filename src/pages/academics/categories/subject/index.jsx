import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ConfirmSubjectStatusModal from './ConfirmSubjectStatusModal'
import ExamCategoryTableSkeleton from '../../../../components/categories/ExamCategoryTableSkeleton'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useSubjectManagement } from '../../../../hooks/useSubjectManagement'
import { toast } from '../../../../utils/toast'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  updateSubject,
  updateSubjectStatus,
} from '../../../../services/subjectService'
import {
  buildSubjectApiPayload,
  mapApiSubjectToLocal,
} from './subjectHelpers'
import AddEditSubjectModal from './AddEditSubjectModal'
import ViewSubjectModal from './ViewSubjectModal'
import SubjectTable from './SubjectTable'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
]

function AddButton({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

export default function SubjectSection({ section }) {
  const {
    subjects,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    controlledPagination,
    refreshSubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  } = useSubjectManagement()

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false)

  const subjectsById = useMemo(
    () => new Map(subjects.map((row) => [String(row.id), row])),
    [subjects],
  )

  const disableableCount = useMemo(
    () => selectedIds.filter((id) => subjectsById.get(String(id))?.status === 'Active').length,
    [selectedIds, subjectsById],
  )

  const loadSubjectDetail = useCallback(async (row) => {
    const data = await getSubjectById(row.id)
    return mapApiSubjectToLocal(data)
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem(row)
      setViewLoading(true)
      try {
        const detail = await loadSubjectDetail(row)
        if (detail) setViewItem(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
        setViewItem(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadSubjectDetail],
  )

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(null)
      setEditDetailLoading(true)
      try {
        const detail = await loadSubjectDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load subject for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadSubjectDetail, openEdit, close],
  )

  useEffect(() => {
    if (!isOpen) {
      setEditDetail(null)
      setEditDetailLoading(false)
    }
  }, [isOpen])

  const handleFormSubmit = useCallback(
    async (form, { isEdit, id }) => {
      setFormSubmitting(true)
      try {
        const payload = buildSubjectApiPayload(form)
        if (isEdit && id != null) {
          await updateSubject(id, payload)
          toast.success('Subject updated')
        } else {
          await createSubject(payload)
          toast.success('Subject created')
        }
        await refreshSubjects()
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Failed to update subject' : 'Failed to create subject'),
        )
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [refreshSubjects],
  )

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const ids = deleteTarget.ids ?? (deleteTarget.id ? [deleteTarget.id] : [])
    if (!ids.length) return

    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => deleteSubject(id)))
      ids.forEach((id) => removeSubjectLocally(id))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} subjects deleted` : 'Subject deleted')
      await refreshSubjects()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete subject'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeSubjectLocally, refreshSubjects])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchSubjectLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateSubjectStatus(statusTarget.id, nextApi)
      toast.success(enabling ? 'Subject enabled' : 'Subject disabled')
      setStatusTarget(null)
    } catch (error) {
      patchSubjectLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchSubjectLocally])

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => subjectsById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    const apiStatus = mapUiStatusToApi('In Active')
    setBulkDisableLoading(true)

    try {
      await Promise.all(ids.map((id) => updateSubjectStatus(id, apiStatus)))
      ids.forEach((id) => patchSubjectLocally(id, { status: 'In Active' }))
      toast.success(ids.length > 1 ? `${ids.length} subjects disabled` : 'Subject disabled')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disable selected subjects'))
      await refreshSubjects()
    } finally {
      setBulkDisableLoading(false)
    }
  }, [selectedIds, subjectsById, patchSubjectLocally, refreshSubjects])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return [...merged]
    })
  }, [])

  const showEmpty =
    !loading && subjects.length === 0 && !search && statusFilter === 'all'
  const showNoResults = !loading && subjects.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected subjects? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this subject'}"? This action cannot be undone.`

  if (!section) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="subject"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Subject">
          <AddButton onClick={openCreate} disabled={loading}>
            {section.addLabel}
          </AddButton>
        </CategoryPageHeader>

        <CategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={section.searchPlaceholder}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onDisable={handleBulkDisable}
          onDelete={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
        />

        {loading ? (
          <ExamCategoryTableSkeleton />
        ) : showEmpty ? (
          <CategoryEmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            ctaLabel={section.emptyCta}
            onCta={openCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or status filter."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <SubjectTable
            subjects={subjects}
            loading={loading || bulkDisableLoading}
            controlledPagination={controlledPagination}
            onView={handleView}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, statusFilter]}
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
            }}
          />
        )}

        <AddEditSubjectModal
          open={isOpen}
          onClose={close}
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewSubjectModal
          open={Boolean(viewItem) || viewLoading}
          onClose={() => {
            setViewItem(null)
            setViewLoading(false)
          }}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmSubjectStatusModal
          open={Boolean(statusTarget)}
          subjectName={statusTarget?.name || 'this subject'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={deleteTarget?.ids?.length > 1 ? 'Delete selected subjects?' : 'Delete subject?'}
          message={deleteMessage}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
