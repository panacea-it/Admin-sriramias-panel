import { useCallback, useMemo, useState } from 'react'
import { getCentreDropdownDisplayName } from '../../../utils/centreDropdownDisplay'
import { motion } from 'framer-motion'
import { Loader2, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ProgramsFilterBar from '../../../components/categories/ProgramsFilterBar'
import ProgramsTable from '../../../components/categories/ProgramsTable'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import { useCenters } from '../../../contexts/CentersContext'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../components/categories/ExamCategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import CourseFormModal from '../../../components/categories/CourseFormModal'
import ViewCourseManagementModal from '../../../components/categories/ViewCourseManagementModal'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import {
  loadAcademicCourses,
  saveAcademicCourses,
} from '../../../utils/academicCoursesStorage'
import { CATEGORY_HUB_SECTIONS } from '../../../constants/categoryHubSections'
import { useEditModal } from '../../../hooks/useEditModal'
import { useCourseManagement } from '../../../hooks/useCourseManagement'
import { useInitialRouteFilterSearch } from '../../../hooks/useInitialRouteSearch'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { CATEGORY_COL } from '../../../utils/categoryUiStandards'
import { syncAcademicCoursesCatalog } from '../../../api/academicCoursesAPI'
import { getApiErrorMessage } from '../../../utils/apiError'
import { buildCreateCourseFormData } from '../../../utils/courseApiHelpers'
import { createCourse } from '../../../services/courseService'
import { toast, TOAST_DURATION } from '../../../utils/toast'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../utils/masterBulkActions'
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

function NoMatchesState({ onClear }) {
  return (
    <CategoryEmptyState
      title="No matching records"
      description="Try adjusting your search or filters."
      ctaLabel="Clear filters"
      onCta={onClear}
    />
  )
}

export default function CategoryCoursesSection() {
  const { activeCenters } = useCenters()
  const {
    courses,
    loading,
    refreshCourses,
    patchCourseLocally,
    removeCourseLocally,
  } = useCourseManagement()
  const [filters, setFilters] = useState({ search: '', status: 'all', centre: 'all', program: 'all' })
  useInitialRouteFilterSearch(setFilters)
  const [selectedIds, setSelectedIds] = useState([])
  const [createLoading, setCreateLoading] = useState(false)
  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centreFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Centre Wise' },
      ...activeCenters.map((c) => ({
        value: String(c.centerId),
        label: getCentreDropdownDisplayName(c),
      })),
    ],
    [activeCenters],
  )

  const programFilterOptions = useMemo(() => {
    const scoped =
      filters.centre === 'all'
        ? courses
        : courses.filter((c) => String(c.centerId) === filters.centre)
    const programs = [...new Set(scoped.map((c) => c.program).filter(Boolean))].sort()
    return [
      { value: 'all', label: 'Program' },
      ...programs.map((p) => ({ value: p, label: p })),
    ]
  }, [courses, filters.centre])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return courses.filter((row) => {
      const matchSearch =
        !q ||
        row.name?.toLowerCase().includes(q) ||
        row.courseId?.toLowerCase().includes(q) ||
        row.program?.toLowerCase().includes(q) ||
        row.examCategory?.toLowerCase().includes(q) ||
        row.examSubCategory?.toLowerCase().includes(q) ||
        row.centerName?.toLowerCase().includes(q)
      const matchStatus = filters.status === 'all' || row.status === filters.status
      const matchCentre =
        filters.centre === 'all' || String(row.centerId) === filters.centre
      const matchProgram = filters.program === 'all' || row.program === filters.program
      return matchSearch && matchStatus && matchCentre && matchProgram
    })
  }, [courses, filters])

  const coursesById = useMemo(
    () => new Map(filtered.map((row) => [String(row.id), row])),
    [filtered],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, coursesById),
    [selectedIds, coursesById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, coursesById),
    [selectedIds, coursesById],
  )

  const handleSave = useCallback(
    async (form, { isEdit, id }) => {
      if (!isEdit) {
        setCreateLoading(true)
        try {
          const formData = buildCreateCourseFormData(form)
          await createCourse(formData)
          toast.success('Course created successfully')
          modal.close()
          await refreshCourses()
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Failed to create course'))
          throw error
        } finally {
          setCreateLoading(false)
        }
        return
      }

      const now = new Date().toISOString()
      const payload = {
        name: form.name,
        centerId: form.centerId,
        centerName: form.centerName,
        programId: form.programId,
        program: form.program,
        examCategoryId: form.examCategoryId,
        examCategory: form.examCategory,
        examSubCategoryId: form.examSubCategoryId,
        examSubCategory: form.examSubCategory,
        status: form.status || 'Active',
        subjects: form.subjects || [],
        overview: form.overview || form.courseOverview || '',
        courseOverview: form.courseOverview || form.overview || '',
        keyFeatures: form.keyFeatures || [],
        whyChooseFeatures: form.whyChooseFeatures || [],
        howWill: form.howWill || [],
        whyChooseCourse: form.whyChooseCourse || '',
        howCourseHelps: form.howCourseHelps || '',
        courseFormData: form.courseFormData || null,
        whyChooseTitle: form.whyChooseTitle || '',
        whyChooseSubtitle: form.whyChooseSubtitle || '',
        sectionTitleOverview: form.sectionTitleOverview || '',
        sectionTitleKeyFeatures: form.sectionTitleKeyFeatures || '',
        sectionTitleWhyChoose: form.sectionTitleWhyChoose || form.whyChooseTitle || '',
        sectionTitleHowHelps: form.sectionTitleHowHelps || '',
        sectionTitles: form.sectionTitles || null,
        modifiedAt: now,
      }

      patchCourseLocally(id, payload)

      const stored = loadAcademicCourses()
      const next = stored.map((row) => (row.id === id ? { ...row, ...payload } : row))
      saveAcademicCourses(next)
      syncAcademicCoursesCatalog(next)
      toast.success('Course updated')
    },
    [modal, patchCourseLocally, refreshCourses],
  )

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return

    const ids = deleteTarget.ids ?? (deleteTarget.id ? [deleteTarget.id] : [])
    if (!ids.length) return

    ids.forEach((id) => removeCourseLocally(id))
    const stored = loadAcademicCourses()
    const next = stored.filter((c) => !ids.includes(c.id))
    saveAcademicCourses(next)
    setSelectedIds((prev) => prev.filter((sid) => !ids.includes(sid)))
    setDeleteTarget(null)
    toast.success(ids.length > 1 ? `${ids.length} courses deleted` : 'Course deleted')
  }, [deleteTarget, removeCourseLocally])

  const handleToggleStatus = useCallback(
    (row) => {
      const nextStatus = row.status === 'Active' ? 'In Active' : 'Active'
      const now = new Date().toISOString()
      patchCourseLocally(row.id, { status: nextStatus, modifiedAt: now })
      const stored = loadAcademicCourses()
      const next = stored.map((c) =>
        c.id === row.id ? { ...c, status: nextStatus, modifiedAt: now } : c,
      )
      saveAcademicCourses(next)
      toast.success(nextStatus === 'Active' ? 'Course enabled' : 'Course disabled')
    },
    [patchCourseLocally],
  )

  const handleBulkEnableRequest = useCallback(() => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }, [enableableCount])

  const handleBulkDisableRequest = useCallback(() => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }, [disableableCount])

  const handleBulkDeleteRequest = useCallback(() => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'deactivate' })
  }, [selectedIds.length])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      const now = new Date().toISOString()

      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, coursesById)
        ids.forEach((id) => {
          patchCourseLocally(id, { status: 'Active', modifiedAt: now })
        })
        const stored = loadAcademicCourses()
        const next = stored.map((c) =>
          ids.includes(c.id) ? { ...c, status: 'Active', modifiedAt: now } : c,
        )
        saveAcademicCourses(next)
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, coursesById)
        ids.forEach((id) => {
          patchCourseLocally(id, { status: 'In Active', modifiedAt: now })
        })
        const stored = loadAcademicCourses()
        const next = stored.map((c) =>
          ids.includes(c.id) ? { ...c, status: 'In Active', modifiedAt: now } : c,
        )
        saveAcademicCourses(next)
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'delete') {
        const ids = [...selectedIds]
        ids.forEach((id) => removeCourseLocally(id))
        const stored = loadAcademicCourses()
        const next = stored.filter((c) => !ids.includes(c.id))
        saveAcademicCourses(next)
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, coursesById, patchCourseLocally, removeCourseLocally])

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }, [])

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
          <ExamCategoryTableActions
            row={row}
            onView={() => setViewItem(row)}
            onEdit={() => modal.openEdit(row)}
            onDelete={() => handleDelete(row)}
            onStatusToggle={() => handleToggleStatus(row)}
          />
        ),
      },
    ],
    [handleDelete, handleToggleStatus, modal],
  )

  const showEmpty = !loading && courses.length === 0
  const showNoResults = !loading && !showEmpty && filtered.length === 0

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected courses? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this course'}"? This action cannot be undone.`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 sm:space-y-6"
    >
      <CategoryPageHeader title="Courses">
        <AddCourseButton onClick={modal.openCreate} disabled={loading} />
      </CategoryPageHeader>

      <ProgramsFilterBar
        search={filters.search}
        onSearchChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        searchPlaceholder={section.searchPlaceholder}
        centre={filters.centre}
        onCentreChange={(e) =>
          setFilters((f) => ({ ...f, centre: e.target.value, program: 'all' }))
        }
        centreOptions={centreFilterOptions}
        program={filters.program}
        onProgramChange={(e) => setFilters((f) => ({ ...f, program: e.target.value }))}
        programOptions={programFilterOptions}
        status={filters.status}
        onStatusChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
      />

      <ProgramsBulkActionsBar
        count={selectedIds.length}
        enableCount={enableableCount}
        disableCount={disableableCount}
        onClearSelection={() => setSelectedIds([])}
        onEnable={handleBulkEnableRequest}
        onDisable={handleBulkDisableRequest}
      />

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100/80 bg-white/70 px-4 py-2.5 text-sm text-[#686868]">
          <Loader2 className="h-4 w-4 animate-spin text-[#246392]" />
          Loading courses…
        </div>
      )}

      {loading ? (
        <CategoryTableLoadingShell />
      ) : showEmpty ? (
        <CategoryEmptyState
          title={section.emptyTitle}
          description={section.emptyDescription}
          ctaLabel="Add Course"
          onCta={modal.openCreate}
        />
      ) : showNoResults ? (
        <NoMatchesState
          onClear={() =>
            setFilters({ search: '', status: 'all', centre: 'all', program: 'all' })
          }
        />
      ) : (
        <ProgramsTable
          columns={columns}
          data={filtered}
          loading={loading || bulkActionLoading}
          resetDeps={[filters]}
          tableMinWidth={1180}
          emptyMessage="No courses match your filters."
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onTogglePage: toggleSelectPage,
          }}
        />
      )}

      <CourseFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSave}
        submitting={createLoading}
      />

      <ViewCourseManagementModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      

      <MasterBulkConfirmModal
        open={Boolean(bulkConfirm)}
        type={bulkConfirm?.type}
        loading={bulkActionLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => !bulkActionLoading && setBulkConfirm(null)}
      />
    </motion.div>
  )
}
