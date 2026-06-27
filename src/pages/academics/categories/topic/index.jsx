import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle, RefreshCw } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../../components/categories/CategoryTableLoadingShell'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../components/feedback/ErrorState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useTopicManagement } from '../../../../hooks/useTopicManagement'
import {
  useTopic,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  useToggleTopicStatus,
} from '../../../../hooks/useTopics'
import { useSubjectsDropdown } from '../../../../hooks/useSubjectsDropdown'
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
import { topicService } from '../../../../services/topicService'
import {
  buildCreateTopicPayload,
  buildUpdateTopicPayload,
  buildSubjectNameLookup,
  mapApiTopicToLocal,
  resolveTopicSubjectDisplay,
} from './topicHelpers'
import AddEditTopicModal from './AddEditTopicModal'
import ViewTopicModal from './ViewTopicModal'
import ConfirmTopicStatusModal from './ConfirmTopicStatusModal'
import TopicTable from './TopicTable'
import { getSubjectsDropdown } from '../../../../services/subjectService'

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

export default function TopicSection({ section }) {
  const {
    topics,
    loading,
    isFetching,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshTopics,
  } = useTopicManagement()

  const createMutation = useCreateTopic()
  const updateMutation = useUpdateTopic()
  const deleteMutation = useDeleteTopic()
  const toggleStatusMutation = useToggleTopicStatus()

  const { options: subjectDropdownOptions, loading: subjectsLoading } = useSubjectsDropdown()

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [subjectNameById, setSubjectNameById] = useState({})

  const subjectFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Subject' }, ...subjectDropdownOptions],
    [subjectDropdownOptions],
  )

  useEffect(() => {
    getSubjectsDropdown()
      .then((data) => setSubjectNameById(buildSubjectNameLookup(data)))
      .catch(() => setSubjectNameById({}))
  }, [])

  const { data: viewQuery, isLoading: viewLoading } = useTopic(viewId, {
    enabled: Boolean(viewId),
  })
  const viewItem = useMemo(() => {
    if (!viewId) return null
    const mapped = mapApiTopicToLocal(viewQuery)
    if (!mapped) return null
    return {
      ...mapped,
      subject: resolveTopicSubjectDisplay(mapped, subjectNameById),
    }
  }, [viewId, viewQuery, subjectNameById])

  const { data: editQuery, isLoading: editDetailLoading } = useTopic(editId, {
    enabled: Boolean(editId) && isOpen,
  })
  const editDetail = useMemo(() => {
    if (!editId) return selectedItem
    return mapApiTopicToLocal(editQuery) || selectedItem
  }, [editId, editQuery, selectedItem])

  const enrichedTopics = useMemo(
    () =>
      topics.map((row) => ({
        ...row,
        subject: resolveTopicSubjectDisplay(row, subjectNameById),
      })),
    [topics, subjectNameById],
  )

  const topicsById = useMemo(
    () => new Map(enrichedTopics.map((row) => [String(row.id), row])),
    [enrichedTopics],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, topicsById),
    [selectedIds, topicsById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, topicsById),
    [selectedIds, topicsById],
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
      try {
        if (isEdit && id != null) {
          const result = await updateMutation.mutateAsync({
            id,
            payload: buildUpdateTopicPayload(form),
          })
          if (!result?.success) return
          toast.success(result?.message || 'Topic updated successfully')
        } else {
          const result = await createMutation.mutateAsync(buildCreateTopicPayload(form))
          if (!result?.success || !result?.data?._id) return
          toast.success(result?.message || 'Topic created successfully')
        }
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Failed to update topic' : 'Failed to create topic'),
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
        const result = await deleteMutation.mutateAsync(id)
        if (!result?.success) return
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} topics deleted` : 'Topic deleted successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete topic'))
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
      toast.success(result?.message || (enabling ? 'Topic enabled' : 'Topic disabled'))
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
        const ids = filterEnableableIds(selectedIds, topicsById)
        const apiStatus = mapUiStatusToApi('Active')
        await bulkUpdateMasterStatus('topics', ids, apiStatus, {
          updateSingle: topicService.toggleTopicStatus,
        })
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, topicsById)
        const apiStatus = mapUiStatusToApi('In Active')
        await bulkUpdateMasterStatus('topics', ids, apiStatus, {
          updateSingle: topicService.toggleTopicStatus,
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
      await refreshTopics()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(
        bulkConfirm.type === 'delete'
          ? getApiErrorMessage(error, 'Failed to delete selected topics')
          : getMasterBulkErrorMessage(error, bulkConfirm.type),
      )
      if (bulkConfirm.type !== 'delete') {
        await refreshTopics()
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
    !loading &&
    !listError &&
    topics.length === 0 &&
    !search &&
    statusFilter === 'all' &&
    subjectFilter === 'all'
  const showNoResults = !loading && !listError && topics.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSubjectFilter('all')
  }

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected topics? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this topic'}"? This action cannot be undone.`

  if (!section) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="topic"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Topic">
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton
              onClick={() => refreshTopics()}
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
          subjectFilter={subjectFilter}
          onSubjectFilterChange={(e) => setSubjectFilter(e.target.value)}
          subjectOptions={subjectFilterOptions}
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
            message={getApiErrorMessage(listError, 'Failed to load topics')}
            onRetry={() => refreshTopics()}
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
            description="Try adjusting your search or filters."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <TopicTable
            topics={enrichedTopics}
            loading={loading || bulkActionLoading || isFetching}
            controlledPagination={controlledPagination}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onView={handleView}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, statusFilter, subjectFilter, sortBy, sortOrder]}
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
            }}
          />
        )}

        <AddEditTopicModal
          open={isOpen}
          onClose={close}
          item={editDetail}
          onSubmit={handleFormSubmit}
          subjectOptions={subjectDropdownOptions}
          subjectsLoading={subjectsLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewTopicModal
          open={Boolean(viewId)}
          onClose={() => setViewId(null)}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmTopicStatusModal
          open={Boolean(statusTarget)}
          topicName={statusTarget?.name || 'this topic'}
          enabling={statusTarget?.status !== 'Active'}
          loading={toggleStatusMutation.isPending}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={deleteTarget?.ids?.length > 1 ? 'Delete selected topics?' : 'Delete topic?'}
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
