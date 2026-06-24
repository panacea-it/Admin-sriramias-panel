import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle, RefreshCw } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ConfirmSubjectStatusModal from './ConfirmSubjectStatusModal'
import CategoryTableLoadingShell from '../../../../components/categories/CategoryTableLoadingShell'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../components/feedback/ErrorState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useSubjectManagement } from '../../../../hooks/useSubjectManagement'
import { useCreateSubject } from '../../../../hooks/useCreateSubject'
import { useUpdateSubject } from '../../../../hooks/useUpdateSubject'
import { useDeleteSubject } from '../../../../hooks/useDeleteSubject'
import { useToggleSubjectStatus } from '../../../../hooks/useToggleSubjectStatus'
import { useSubject } from '../../../../hooks/useSubject'
import { toast, TOAST_DURATION } from '../../../../utils/toast'
import {
  bulkUpdateMasterStatus,
  getMasterBulkErrorMessage,
} from '../../../../services/masterBulkStatusService'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../../utils/masterBulkActions'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import { subjectService } from '../../../../services/subjectService'
import { buildSubjectApiPayload, mapApiSubjectToLocal } from './subjectHelpers'
import AddEditSubjectModal from './AddEditSubjectModal'
import ViewSubjectModal from './ViewSubjectModal'
import SubjectTable from './SubjectTable'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
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

function RefreshButton({ onClick, disabled, fetching }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
      {fetching ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}

export default function SubjectSection({ section }) {
  const {
    subjects,
    loading,
    isFetching,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshSubjects,
  } = useSubjectManagement()

  const createMutation = useCreateSubject()
  const updateMutation = useUpdateSubject()
  const deleteMutation = useDeleteSubject()
  const toggleStatusMutation = useToggleSubjectStatus()

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const { data: viewQuery, isLoading: viewLoading } = useSubject(viewId, {
    enabled: Boolean(viewId),
  })
  const viewItem = useMemo(() => {
    if (!viewId) return null
    return mapApiSubjectToLocal(viewQuery) || null
  }, [viewId, viewQuery])

  const { data: editQuery, isLoading: editDetailLoading } = useSubject(editId, {
    enabled: Boolean(editId) && isOpen,
  })
  const editDetail = useMemo(() => {
    if (!editId) return selectedItem
    return mapApiSubjectToLocal(editQuery) || selectedItem
  }, [editId, editQuery, selectedItem])

  const subjectsById = useMemo(
    () => new Map(subjects.map((row) => [String(row.id), row])),
    [subjects],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, subjectsById),
    [selectedIds, subjectsById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, subjectsById),
    [selectedIds, subjectsById],
  )

  const handleView = useCallback((row) => {
    setViewId(row.id)
  }, [])

  const handleEditOpen = useCallback(
    (row) => {
      setEditId(row.id)
      openEdit(row)
    },
    [openEdit],
  )

  useEffect(() => {
    if (!isOpen) {
      setEditId(null)
    }
  }, [isOpen])

  const formSubmitting = createMutation.isPending || updateMutation.isPending

  const handleFormSubmit = useCallback(
    async (form, { isEdit, id }) => {
      const payload = buildSubjectApiPayload(form)
      try {
        if (isEdit && id != null) {
          const result = await updateMutation.mutateAsync({ id, payload })
          toast.success(result?.message || 'Subject updated')
        } else {
          const result = await createMutation.mutateAsync(payload)
          toast.success(result?.message || 'Subject created')
        }
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Failed to update subject' : 'Failed to create subject'),
        )
        throw error
      }
    },
    [createMutation, updateMutation],
  )

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const ids = deleteTarget.ids ?? (deleteTarget.id ? [deleteTarget.id] : [])
    if (!ids.length) return

    try {
      for (const id of ids) {
        await deleteMutation.mutateAsync(id)
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} subjects deleted` : 'Subject deleted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete subject'))
    }
  }, [deleteTarget, deleteMutation])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextApi = mapUiStatusToApi(enabling ? 'Active' : 'In Active')

    try {
      const result = await toggleStatusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextApi,
      })
      toast.success(result?.message || (enabling ? 'Subject enabled' : 'Subject disabled'))
      setStatusTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    }
  }, [statusTarget, toggleStatusMutation])

  const handleBulkEnableRequest = () => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }

  const handleBulkDisableRequest = () => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, subjectsById)
        const apiStatus = mapUiStatusToApi('Active')
        await bulkUpdateMasterStatus('subjects', ids, apiStatus, {
          updateSingle: subjectService.updateSubjectStatus,
        })
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, subjectsById)
        const apiStatus = mapUiStatusToApi('In Active')
        await bulkUpdateMasterStatus('subjects', ids, apiStatus, {
          updateSingle: subjectService.updateSubjectStatus,
        })
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'delete') {
        const ids = [...selectedIds]
        for (const id of ids) {
          await deleteMutation.mutateAsync(id)
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
      await refreshSubjects()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(
        bulkConfirm.type === 'delete'
          ? getApiErrorMessage(error, 'Failed to delete selected subjects')
          : getMasterBulkErrorMessage(error, bulkConfirm.type),
      )
      if (bulkConfirm.type !== 'delete') {
        await refreshSubjects()
      }
    } finally {
      setBulkActionLoading(false)
    }
  }

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
    !loading && !listError && subjects.length === 0 && !search && statusFilter === 'all'
  const showNoResults = !loading && !listError && subjects.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected subjects? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this subject'}"? This cannot be undone.`

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
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton
              onClick={() => refreshSubjects()}
              disabled={loading || isFetching}
              fetching={isFetching}
            />
            <AddButton onClick={openCreate} disabled={loading}>
              {section.addLabel}
            </AddButton>
          </div>
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
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
        />

        {loading ? (
          <CategoryTableLoadingShell />
        ) : listError ? (
          <ErrorState
            message={getApiErrorMessage(listError, 'Failed to load subjects')}
            onRetry={() => refreshSubjects()}
          />
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
            loading={loading || bulkActionLoading || isFetching}
            controlledPagination={controlledPagination}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onView={handleView}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, statusFilter, sortBy, sortOrder]}
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
          item={editDetail}
          onSubmit={handleFormSubmit}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewSubjectModal
          open={Boolean(viewId)}
          onClose={() => setViewId(null)}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmSubjectStatusModal
          open={Boolean(statusTarget)}
          subjectName={statusTarget?.name || 'this subject'}
          enabling={statusTarget?.status !== 'Active'}
          loading={toggleStatusMutation.isPending}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={deleteTarget?.ids?.length > 1 ? 'Delete selected subjects?' : 'Delete subject?'}
          message={deleteMessage}
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
        />

        <MasterBulkConfirmModal
          open={Boolean(bulkConfirm)}
          type={bulkConfirm?.type}
          loading={bulkActionLoading}
          onConfirm={confirmBulkAction}
          onCancel={() => !bulkActionLoading && setBulkConfirm(null)}
        />
      </motion.div>
    </AnimatePresence>
  )
}
