import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ProgramsFilterBar from '../../../components/categories/ProgramsFilterBar'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import CourseTableActions from '../../../components/categories/CourseTableActions'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import CategoryStandardTable from '../../../components/categories/CategoryStandardTable'
import CourseFormModal from '../../../components/categories/CourseFormModal'
import ViewCourseManagementModal from '../../../components/categories/ViewCourseManagementModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import ConfirmExamCategoryStatusModal from '../../../components/categories/ConfirmExamCategoryStatusModal'
import ErrorState from '../../../components/feedback/ErrorState'
import { CATEGORY_HUB_SECTIONS } from '../../../constants/categoryHubSections'
import { useEditModal } from '../../../hooks/useEditModal'
import { useCourseManagement } from '../../../hooks/useCourseManagement'
import { useInitialRouteFilterSearch } from '../../../hooks/useInitialRouteSearch'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useProgramsByCenter } from '../../../hooks/useProgramsByCenter'
import { useCreateCourse } from '../../../hooks/course/useCreateCourse'
import { useUpdateCourse } from '../../../hooks/course/useUpdateCourse'
import { useDeleteCourse } from '../../../hooks/course/useDeleteCourse'
import { useUpdateCourseStatus } from '../../../hooks/course/useUpdateCourseStatus'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  buildCourseFormData,
  extractCourseMutationWarnings,
  formatCourseWarningsToast,
  mapApiCourseToLocal,
  mapUiCourseStatusToApi,
} from '../../../utils/courseApiHelpers'
import { getCourse } from '../../../services/courseService'
import { toast, TOAST_DURATION } from '../../../utils/toast'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../utils/masterBulkActions'
import { CATEGORY_COL } from '../../../utils/categoryUiStandards'
import { useAuth } from '../../../contexts/AuthContext'

const section = CATEGORY_HUB_SECTIONS.courses

function AddCourseButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      Add Course
    </button>
  )
}

function hasCourseFormFields(row) {
  return Boolean(row?.centerId && row?.programId && row?.examCategoryId && row?.examSubCategoryId)
}

export default function CategoryCoursesSection() {
  const { isSuperAdmin } = useAuth()

  const {
    courses,
    totalCourses,
    loading,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    debouncedSearch,
    controlledPagination,
    refreshCourses,
    patchCourseLocally,
    removeCourseLocally,
  } = useCourseManagement()

  useInitialRouteFilterSearch(setSearch)

  const { mutateAsync: createCourse, isPending: createPending } = useCreateCourse()
  const { mutateAsync: updateCourse, isPending: updatePending } = useUpdateCourse()
  const { mutateAsync: deleteCourse, isPending: deleteMutationPending } = useDeleteCourse()
  const { mutateAsync: updateCourseStatus, isPending: statusMutationPending } =
    useUpdateCourseStatus()

  const { options: centreDropdownOptions } = useCentersDropdownOptions()
  const { programOptions: centerProgramOptions } = useProgramsByCenter(
    centerFilter !== 'all' ? centerFilter : null,
  )

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewDetailLoading, setViewDetailLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centreFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Centre Wise' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const programFilterOptions = useMemo(() => {
    if (centerFilter === 'all') {
      return [{ value: 'all', label: 'Program' }]
    }
    return [{ value: 'all', label: 'Program' }, ...centerProgramOptions]
  }, [centerFilter, centerProgramOptions])

  const formSubmittingBusy = formSubmitting || createPending || updatePending

  const coursesById = useMemo(
    () => new Map(courses.map((row) => [String(row.id), row])),
    [courses],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, coursesById),
    [selectedIds, coursesById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, coursesById),
    [selectedIds, coursesById],
  )

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

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: statusFilter,
      center: centerFilter,
      program: programFilter,
    }),
    [debouncedSearch, statusFilter, centerFilter, programFilter],
  )

  const loadCourseDetail = useCallback(async (row) => {
    const data = await getCourse(row.id)
    return mapApiCourseToLocal(data) || row
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem(row)
      setViewDetail(row)
      setViewDetailLoading(!hasCourseFormFields(row))

      if (hasCourseFormFields(row)) return

      try {
        const detail = await loadCourseDetail(row)
        setViewDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load course details'))
      } finally {
        setViewDetailLoading(false)
      }
    },
    [loadCourseDetail],
  )

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(row)
      setEditDetailLoading(true)

      try {
        const detail = await loadCourseDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load course for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadCourseDetail, openEdit, close],
  )

  useEffect(() => {
    if (!isOpen) {
      setEditDetail(null)
      setEditDetailLoading(false)
    }
  }, [isOpen])

  const showMutationWarnings = useCallback((response) => {
    const warnings = extractCourseMutationWarnings(response)
    const warningText = formatCourseWarningsToast(warnings)
    if (warningText) {
      toast.warning(warningText)
    }
  }, [])

  const handleSave = useCallback(
    async (form, { isEdit, id }) => {
      setFormSubmitting(true)
      try {
        const originalCourse = isEdit ? editDetail ?? selectedItem : null
        const formData = await buildCourseFormData(form, {
          isEdit,
          originalCourse,
        })

        if (isEdit && id != null) {
          const response = await updateCourse({ id, formData })
          toast.success('Course updated successfully')
          showMutationWarnings(response)
        } else {
          const response = await createCourse(formData)
          toast.success('Course created successfully')
          showMutationWarnings(response)
        }

        await refreshCourses()
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            isEdit ? 'Failed to update course' : 'Failed to create course',
          ),
        )
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [createCourse, updateCourse, refreshCourses, editDetail, selectedItem, showMutationWarnings],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCourse(deleteTarget.id)
      removeCourseLocally(deleteTarget.id)
      toast.success(
        'Course deleted successfully (soft delete — enrollments remain linked)',
      )
      setDeleteTarget(null)
      await refreshCourses()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete course'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, deleteCourse, removeCourseLocally, refreshCourses])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiCourseStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchCourseLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateCourseStatus({ id: statusTarget.id, status: nextApi })
      toast.success(enabling ? 'Course enabled' : 'Course disabled')
      setStatusTarget(null)
    } catch (error) {
      patchCourseLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update course status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchCourseLocally, updateCourseStatus])

  const handleBulkEnableRequest = useCallback(() => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }, [enableableCount])

  const handleBulkDisableRequest = useCallback(() => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }, [disableableCount])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, coursesById)
        const apiStatus = mapUiCourseStatusToApi('Active')
        await Promise.all(ids.map((id) => updateCourseStatus({ id, status: apiStatus })))
        ids.forEach((id) => patchCourseLocally(id, { status: 'Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, coursesById)
        const apiStatus = mapUiCourseStatusToApi('In Active')
        await Promise.all(ids.map((id) => updateCourseStatus({ id, status: apiStatus })))
        ids.forEach((id) => patchCourseLocally(id, { status: 'In Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update course status'))
      await refreshCourses()
    } finally {
      setBulkActionLoading(false)
    }
  }, [
    bulkConfirm,
    selectedIds,
    coursesById,
    updateCourseStatus,
    patchCourseLocally,
    refreshCourses,
  ])

  const columns = useMemo(
    () => [
      {
        key: 'courseId',
        label: 'Course ID',
        headerClassName: CATEGORY_COL.idHeader,
        cellClassName: CATEGORY_COL.idCell,
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-[#111]">{row.courseId}</span>
        ),
      },
      {
        key: 'name',
        label: 'Course Name',
        headerClassName: CATEGORY_COL.nameHeader,
        cellClassName: CATEGORY_COL.nameCell,
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
      },
      {
        key: 'centerName',
        label: 'Centre',
        headerClassName: CATEGORY_COL.textHeader,
        cellClassName: CATEGORY_COL.textCell,
        render: (row) => (
          <span
            className="block truncate text-sm font-medium text-[#1a3a5c]"
            title={row.centerName}
          >
            {row.centerName || '—'}
          </span>
        ),
      },
      {
        key: 'program',
        label: 'Program',
        headerClassName: CATEGORY_COL.textHeader,
        cellClassName: CATEGORY_COL.textCell,
        render: (row) => (
          <span className="block truncate text-sm font-medium text-[#444]" title={row.program}>
            {row.program || '—'}
          </span>
        ),
      },
      {
        key: 'examCategory',
        label: 'Exam Category',
        headerClassName: CATEGORY_COL.textHeader,
        cellClassName: CATEGORY_COL.textCell,
        render: (row) => (
          <span
            className="block truncate text-sm font-medium text-[#444]"
            title={row.examCategory}
          >
            {row.examCategory || '—'}
          </span>
        ),
      },
      {
        key: 'examSubCategory',
        label: 'Exam Subcategory',
        headerClassName: CATEGORY_COL.textHeader,
        cellClassName: CATEGORY_COL.textCell,
        render: (row) => (
          <span
            className="block truncate text-sm font-medium text-[#444]"
            title={row.examSubCategory}
          >
            {row.examSubCategory || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        headerClassName: CATEGORY_COL.dateHeader,
        cellClassName: CATEGORY_COL.dateCell,
        render: (row) => (
          <span className="text-sm font-medium text-[#686868]">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: CATEGORY_COL.statusHeader,
        cellClassName: CATEGORY_COL.statusCell,
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: CATEGORY_COL.actionsHeader,
        cellClassName: CATEGORY_COL.actionsCell,
        render: (row) => (
          <CourseTableActions
            row={row}
            onView={() => handleView(row)}
            onEdit={() => handleEditOpen(row)}
            onDelete={isSuperAdmin ? () => setDeleteTarget(row) : undefined}
            onToggleStatus={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, handleEditOpen, isSuperAdmin],
  )

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    programFilter !== 'all'
  const showEmpty = !loading && !listError && totalCourses === 0 && !hasActiveFilters
  const showNoResults = !loading && !listError && courses.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
  }

  const deleteMessage = `Are you sure you want to delete "${deleteTarget?.name || 'this course'}"? This is a soft delete — enrollments will remain linked.`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="courses"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Courses">
          <AddCourseButton onClick={openCreate} disabled={loading} />
        </CategoryPageHeader>

        <ProgramsFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={section.searchPlaceholder}
          centre={centerFilter}
          onCentreChange={(e) => setCenterFilter(e.target.value)}
          centreOptions={centreFilterOptions}
          program={programFilter}
          onProgramChange={(e) => setProgramFilter(e.target.value)}
          programOptions={programFilterOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
        />

        {listError && !loading ? (
          <ErrorState
            title="Unable to load courses"
            message={listError}
            onRetry={refreshCourses}
          />
        ) : loading ? (
          <CategoryTableLoadingShell />
        ) : showEmpty ? (
          <CategoryEmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            ctaLabel="Add Course"
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
          <CategoryStandardTable
            columns={columns}
            data={courses}
            itemLabel="courses"
            controlledPagination={controlledPagination}
            resetDeps={[filters]}
            loading={deleteMutationPending || statusMutationPending || bulkActionLoading}
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
            }}
          />
        )}

        <CourseFormModal
          open={isOpen}
          onClose={close}
          item={editDetail ?? selectedItem}
          onSubmit={handleSave}
          submitting={formSubmittingBusy}
          detailLoading={editDetailLoading}
        />

        <ViewCourseManagementModal
          open={Boolean(viewItem)}
          onClose={() => {
            setViewItem(null)
            setViewDetail(null)
          }}
          item={viewDetail ?? viewItem}
          loading={viewDetailLoading}
        />

        {isSuperAdmin && (
          <ConfirmDeleteDialog
            open={Boolean(deleteTarget)}
            title="Delete course?"
            message={deleteMessage}
            loading={deleteLoading}
            onCancel={() => !deleteLoading && setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
        )}

        <ConfirmExamCategoryStatusModal
          open={Boolean(statusTarget)}
          categoryName={statusTarget?.name || 'this course'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
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
