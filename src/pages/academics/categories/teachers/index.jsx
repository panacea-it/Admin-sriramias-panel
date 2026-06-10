import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamCategoryTableSkeleton from '../../../../components/categories/ExamCategoryTableSkeleton'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useTeacherManagement } from '../../../../hooks/useTeacherManagement'
import { useSubjectsDropdown } from '../../../../hooks/useSubjectsDropdown'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { toast } from '../../../../utils/toast'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
} from '../../../../services/teacherService'
import {
  buildCreateTeacherPayload,
  buildUpdateTeacherPayload,
  mapApiTeacherToLocal,
} from './teacherHelpers'
import AddEditTeacherModal from './AddEditTeacherModal'
import ViewTeacherModal from './ViewTeacherModal'
import ConfirmTeacherStatusModal from './ConfirmTeacherStatusModal'
import TeacherTable from './TeacherTable'

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

export default function TeacherSection({ section, Icon }) {
  const {
    teachers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    subjectFilter,
    setSubjectFilter,
    centerFilter,
    setCenterFilter,
    controlledPagination,
    refreshTeachers,
    patchTeacherLocally,
    removeTeacherLocally,
  } = useTeacherManagement()

  const { options: subjectDropdownOptions, loading: subjectsLoading } = useSubjectsDropdown()
  const { options: centerDropdownOptions } = useCentersDropdownOptions()

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

  const centerFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centerDropdownOptions],
    [centerDropdownOptions],
  )

  const loadTeacherDetail = useCallback(async (row) => {
    const data = await getTeacherById(row.id)
    return mapApiTeacherToLocal(data)
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem(row)
      setViewLoading(true)
      try {
        const detail = await loadTeacherDetail(row)
        if (detail) setViewItem(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load teacher details'))
        setViewItem(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadTeacherDetail],
  )

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(null)
      setEditDetailLoading(true)
      try {
        const detail = await loadTeacherDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load teacher for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadTeacherDetail, openEdit, close],
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
          await updateTeacher(id, buildUpdateTeacherPayload(form))
          toast.success('Teacher updated')
        } else {
          await createTeacher(buildCreateTeacherPayload(form))
          toast.success('Teacher created')
        }
        await refreshTeachers()
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Failed to update teacher' : 'Failed to create teacher'),
        )
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [refreshTeachers],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteTeacher(deleteTarget.id)
      removeTeacherLocally(deleteTarget.id)
      toast.success('Teacher deleted')
      setDeleteTarget(null)
      await refreshTeachers()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete teacher'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeTeacherLocally, refreshTeachers])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchTeacherLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateTeacherStatus(statusTarget.id, nextApi)
      toast.success(enabling ? 'Teacher enabled' : 'Teacher disabled')
      setStatusTarget(null)
      await refreshTeachers()
    } catch (error) {
      patchTeacherLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchTeacherLocally, refreshTeachers])

  const showEmpty =
    !loading &&
    teachers.length === 0 &&
    !search &&
    statusFilter === 'all' &&
    subjectFilter === 'all' &&
    centerFilter === 'all'
  const showNoResults = !loading && teachers.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSubjectFilter('all')
    setCenterFilter('all')
  }

  if (!section) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="teachers"
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
          centerFilter={centerFilter}
          onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
          centerOptions={centerFilterOptions}
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
            <TeacherTable
              teachers={teachers}
              loading={loading}
              controlledPagination={controlledPagination}
              onView={handleView}
              onEdit={handleEditOpen}
              onDelete={setDeleteTarget}
              onToggleStatus={setStatusTarget}
              resetDeps={[search, statusFilter, subjectFilter, centerFilter]}
            />
          </div>
        )}

        <AddEditTeacherModal
          open={isOpen}
          onClose={close}
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          subjectOptions={subjectDropdownOptions}
          subjectsLoading={subjectsLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewTeacherModal
          open={Boolean(viewItem) || viewLoading}
          onClose={() => {
            setViewItem(null)
            setViewLoading(false)
          }}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmTeacherStatusModal
          open={Boolean(statusTarget)}
          teacherName={statusTarget?.name || 'this teacher'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title="Delete teacher?"
          message={`Are you sure you want to delete "${deleteTarget?.name || 'this teacher'}"? This action cannot be undone.`}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
