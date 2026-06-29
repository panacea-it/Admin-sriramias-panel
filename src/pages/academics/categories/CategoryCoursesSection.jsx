import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ExamCategoryFilterBar from '../../../components/categories/ExamCategoryFilterBar'
import ExamCategoryBulkActionsBar from '../../../components/categories/ExamCategoryBulkActionsBar'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../components/categories/ExamCategoryTableActions'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import CategoryStandardTable from '../../../components/categories/CategoryStandardTable'
import CourseFormModal from '../../../components/categories/CourseFormModal'
import ViewCourseManagementModal from '../../../components/categories/ViewCourseManagementModal'
import ConfirmExamCategoryStatusModal from '../../../components/categories/ConfirmExamCategoryStatusModal'
import ErrorState from '../../../components/feedback/ErrorState'
import { CATEGORY_HUB_SECTIONS } from '../../../constants/categoryHubSections'
import { useEditModal } from '../../../hooks/useEditModal'
import { useCourseManagement } from '../../../hooks/useCourseManagement'
import { useInitialRouteFilterSearch } from '../../../hooks/useInitialRouteSearch'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useProgramsByCenter } from '../../../hooks/useProgramsByCenter'
import { useTableRowSelection } from '../../../hooks/useTableRowSelection'
import { useCreateCourse } from '../../../hooks/course/useCreateCourse'
import { useUpdateCourse } from '../../../hooks/course/useUpdateCourse'
import { useUpdateCourseStatus } from '../../../hooks/course/useUpdateCourseStatus'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  buildCourseFormData,
  normalizeCourseSubmitForm,
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

const section = CATEGORY_HUB_SECTIONS.courses

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

function CreateButton({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {label}
    </button>
  )
}

export default function CategoryCoursesSection() {
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
    controlledPagination,
    refreshCourses,
    patchCourseLocally,
  } = useCourseManagement()

  useInitialRouteFilterSearch(setSearch)

  const { mutateAsync: createCourse, isPending: createPending } = useCreateCourse()
  const { mutateAsync: updateCourse, isPending: updatePending } = useUpdateCourse()
  const { mutateAsync: updateCourseStatus, isPending: statusMutationPending } =
    useUpdateCourseStatus()

  const { options: centreDropdownOptions } = useCentersDropdownOptions()
  const { programOptions: centerProgramOptions } = useProgramsByCenter(
    centerFilter !== 'all' ? centerFilter : null,
  )

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)
  const [viewItem, setViewItem] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewDetailLoading, setViewDetailLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const editFetchIdRef = useRef(null)

  const centreOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
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

  const loadCourseDetail = useCallback(async (row) => {
    const data = await getCourse(row.id)
    return mapApiCourseToLocal(data) || row
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem(row)
      setViewDetail(row)
      setViewDetailLoading(true)

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
    (row) => {
      const fetchId = String(row.id)
      editFetchIdRef.current = fetchId
      openEdit(row)
      setEditDetail(row)
      setEditDetailLoading(true)

      void loadCourseDetail(row)
        .then((detail) => {
          if (editFetchIdRef.current !== fetchId) return
          setEditDetail(detail || row)
        })
        .catch((error) => {
          if (editFetchIdRef.current !== fetchId) return
          toast.error(getApiErrorMessage(error, 'Failed to load course for edit'))
          close()
        })
        .finally(() => {
          if (editFetchIdRef.current !== fetchId) return
          setEditDetailLoading(false)
        })
    },
    [loadCourseDetail, openEdit, close],
  )

  useEffect(() => {
    if (!isOpen) {
      editFetchIdRef.current = null
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
        const formData = await buildCourseFormData(normalizeCourseSubmitForm(form), {
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
        clearSelection()
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, coursesById)
        const apiStatus = mapUiCourseStatusToApi('In Active')
        await Promise.all(ids.map((id) => updateCourseStatus({ id, status: apiStatus })))
        ids.forEach((id) => patchCourseLocally(id, { status: 'In Active' }))
        clearSelection()
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
    clearSelection,
  ])

  const columns = useMemo(
    () => [
      {
        key: 'courseId',
        label: 'Course ID',
        headerClassName: 'min-w-[7.5rem] whitespace-nowrap',
        cellClassName: 'min-w-[7.5rem] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-[#111]">{row.courseId}</span>
        ),
      },
      {
        key: 'name',
        label: 'Course Name',
        headerClassName: 'min-w-[10rem]',
        cellClassName: 'min-w-[10rem] max-w-[220px] align-middle',
        render: (row) => (
          <span className="block truncate font-semibold text-[#111]" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        key: 'centerName',
        label: 'Centre Name',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
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
        label: 'Program Name',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
        render: (row) => (
          <span className="block truncate text-sm font-medium text-[#444]" title={row.program}>
            {row.program || '—'}
          </span>
        ),
      },
      {
        key: 'examCategory',
        label: 'Exam Category',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
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
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
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
        headerClassName: 'min-w-[9rem] whitespace-nowrap',
        cellClassName: 'min-w-[9rem] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="text-sm font-medium text-[#686868]">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[6.5rem] whitespace-nowrap',
        cellClassName: 'min-w-[6.5rem] align-middle',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[220px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[220px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => (
          <ExamCategoryTableActions
            row={row}
            onView={() => handleView(row)}
            onEdit={() => handleEditOpen(row)}
            onStatusToggle={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, handleEditOpen],
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
          <CreateButton onClick={openCreate} label={section.addLabel} />
        </CategoryPageHeader>

        <ExamCategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={section.searchPlaceholder}
          program={programFilter}
          onProgramChange={(e) => setProgramFilter(e.target.value)}
          programOptions={programFilterOptions}
          centerFilter={centerFilter}
          onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
          centerOptions={centreOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        <ExamCategoryBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
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
          <CategoryStandardTable
            columns={columns}
            data={courses}
            itemLabel="courses"
            controlledPagination={controlledPagination}
            resetDeps={[search, statusFilter, centerFilter, programFilter]}
            selection={selection}
            loading={bulkActionLoading || statusMutationPending}
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
