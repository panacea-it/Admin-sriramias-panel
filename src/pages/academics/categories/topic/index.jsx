import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamCategoryTableSkeleton from '../../../../components/categories/ExamCategoryTableSkeleton'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useTopicManagement } from '../../../../hooks/useTopicManagement'
import { useSubjectsDropdown } from '../../../../hooks/useSubjectsDropdown'
import { toast } from '../../../../utils/toast'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  createTopic,
  deleteTopic,
  getTopicById,
  updateTopic,
  updateTopicStatus,
} from '../../../../services/topicService'
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

export default function TopicSection({ section }) {
  const {
    topics,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    controlledPagination,
    refreshTopics,
    patchTopicLocally,
    removeTopicLocally,
  } = useTopicManagement()

  const { options: subjectDropdownOptions, loading: subjectsLoading } = useSubjectsDropdown()

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
    () => selectedIds.filter((id) => topicsById.get(String(id))?.status === 'Active').length,
    [selectedIds, topicsById],
  )

  const loadTopicDetail = useCallback(async (row) => {
    const data = await getTopicById(row.id)
    return mapApiTopicToLocal(data)
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem({
        ...row,
        subject: resolveTopicSubjectDisplay(row, subjectNameById),
      })
      setViewLoading(true)
      try {
        const detail = await loadTopicDetail(row)
        if (detail) {
          setViewItem({
            ...detail,
            subject: resolveTopicSubjectDisplay(detail, subjectNameById),
          })
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load topic details'))
        setViewItem(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadTopicDetail, subjectNameById],
  )

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(null)
      setEditDetailLoading(true)
      try {
        const detail = await loadTopicDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load topic for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadTopicDetail, openEdit, close],
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
        if (isEdit && id != null) {
          await updateTopic(id, buildUpdateTopicPayload(form))
          toast.success('Topic updated')
        } else {
          await createTopic(buildCreateTopicPayload(form))
          toast.success('Topic created')
        }
        await refreshTopics()
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Failed to update topic' : 'Failed to create topic'),
        )
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [refreshTopics],
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
      await Promise.all(ids.map((id) => deleteTopic(id)))
      ids.forEach((id) => removeTopicLocally(id))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} topics deleted` : 'Topic deleted')
      await refreshTopics()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete topic'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeTopicLocally, refreshTopics])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchTopicLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateTopicStatus(statusTarget.id, nextApi)
      toast.success(enabling ? 'Topic enabled' : 'Topic disabled')
      setStatusTarget(null)
      await refreshTopics()
    } catch (error) {
      patchTopicLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchTopicLocally, refreshTopics])

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => topicsById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    const apiStatus = mapUiStatusToApi('In Active')
    setBulkDisableLoading(true)

    try {
      await Promise.all(ids.map((id) => updateTopicStatus(id, apiStatus)))
      ids.forEach((id) => patchTopicLocally(id, { status: 'In Active' }))
      toast.success(ids.length > 1 ? `${ids.length} topics disabled` : 'Topic disabled')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disable selected topics'))
      await refreshTopics()
    } finally {
      setBulkDisableLoading(false)
    }
  }, [selectedIds, topicsById, patchTopicLocally, refreshTopics])

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
    !loading && topics.length === 0 && !search && statusFilter === 'all' && subjectFilter === 'all'
  const showNoResults = !loading && topics.length === 0 && !showEmpty

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
          subjectFilter={subjectFilter}
          onSubjectFilterChange={(e) => setSubjectFilter(e.target.value)}
          subjectOptions={subjectFilterOptions}
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
            description="Try adjusting your search or filters."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <TopicTable
            topics={enrichedTopics}
            loading={loading || bulkDisableLoading}
            controlledPagination={controlledPagination}
            onView={handleView}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, statusFilter, subjectFilter]}
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
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          subjectOptions={subjectDropdownOptions}
          subjectsLoading={subjectsLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewTopicModal
          open={Boolean(viewItem) || viewLoading}
          onClose={() => {
            setViewItem(null)
            setViewLoading(false)
          }}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmTopicStatusModal
          open={Boolean(statusTarget)}
          topicName={statusTarget?.name || 'this topic'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={deleteTarget?.ids?.length > 1 ? 'Delete selected topics?' : 'Delete topic?'}
          message={deleteMessage}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
