import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
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
  mapApiTopicToLocal,
  resolveTopicSubjectDisplay,
} from './topicHelpers'
import AddEditTopicModal from './AddEditTopicModal'
import ViewTopicModal from './ViewTopicModal'
import ConfirmTopicStatusModal from './ConfirmTopicStatusModal'
import TopicTable from './TopicTable'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
]

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02]"
    >
      <PlusCircle className="h-4 w-4" />
      {children}
    </button>
  )
}

export default function TopicSection({ section, Icon }) {
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

  const subjectFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Subject' }, ...subjectDropdownOptions],
    [subjectDropdownOptions],
  )

  const subjectNameById = useMemo(
    () => Object.fromEntries(subjectDropdownOptions.map((opt) => [opt.value, opt.label])),
    [subjectDropdownOptions],
  )

  const enrichedTopics = useMemo(
    () =>
      topics.map((row) => ({
        ...row,
        subject: resolveTopicSubjectDisplay(row, subjectNameById),
      })),
    [topics, subjectNameById],
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

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteTopic(deleteTarget.id)
      removeTopicLocally(deleteTarget.id)
      toast.success('Topic deleted')
      setDeleteTarget(null)
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

  const showEmpty =
    !loading && topics.length === 0 && !search && statusFilter === 'all' && subjectFilter === 'all'
  const showNoResults = !loading && topics.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSubjectFilter('all')
  }

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
        <CategoryPageHeader icon={Icon} hideTitle>
          <AddButton onClick={openCreate}>{section.addLabel}</AddButton>
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
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
            <TopicTable
              topics={enrichedTopics}
              loading={loading}
              controlledPagination={controlledPagination}
              onView={handleView}
              onEdit={handleEditOpen}
              onDelete={setDeleteTarget}
              onToggleStatus={setStatusTarget}
              resetDeps={[search, statusFilter, subjectFilter]}
            />
          </div>
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
          title="Delete topic?"
          message={`Are you sure you want to delete "${deleteTarget?.name || 'this topic'}"? This action cannot be undone.`}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
