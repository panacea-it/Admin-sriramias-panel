import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Loader2, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ProgramsFilterBar from '../../../components/categories/ProgramsFilterBar'
import { useCenters } from '../../../contexts/CentersContext'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CourseFormModal from '../../../components/categories/CourseFormModal'
import ViewCourseManagementModal from '../../../components/categories/ViewCourseManagementModal'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import {
  loadAcademicCourses,
  saveAcademicCourses,
} from '../../../utils/academicCoursesStorage'
import { CATEGORY_HUB_SECTIONS } from '../../../constants/categoryHubSections'
import { useEditModal } from '../../../hooks/useEditModal'
import { useCourseManagement } from '../../../hooks/useCourseManagement'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { syncAcademicCoursesCatalog } from '../../../api/academicCoursesAPI'
import { getApiErrorMessage } from '../../../utils/apiError'
import { buildCreateCourseFormData } from '../../../utils/courseApiHelpers'
import { createCourse } from '../../../services/courseService'
import { toast } from '../../../utils/toast'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'

const section = CATEGORY_HUB_SECTIONS.courses

function AddCourseButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
      Add Course
    </button>
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
  const [selectedIds, setSelectedIds] = useState([])
  const [createLoading, setCreateLoading] = useState(false)
  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const centreFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Centre Wise' },
      ...activeCenters.map((c) => ({
        value: String(c.centerId),
        label: c.centerName,
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
    removeCourseLocally(deleteTarget.id)
    const stored = loadAcademicCourses()
    const next = stored.filter((c) => c.id !== deleteTarget.id)
    saveAcademicCourses(next)
    setSelectedIds((prev) => prev.filter((sid) => sid !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('Course deleted')
  }, [deleteTarget, removeCourseLocally])

  const handleToggleStatus = (row) => {
    const nextStatus = row.status === 'Active' ? 'In Active' : 'Active'
    const now = new Date().toISOString()
    patchCourseLocally(row.id, { status: nextStatus, modifiedAt: now })
    const stored = loadAcademicCourses()
    const next = stored.map((c) =>
      c.id === row.id ? { ...c, status: nextStatus, modifiedAt: now } : c,
    )
    saveAcademicCourses(next)
    toast.success(nextStatus === 'Active' ? 'Course enabled' : 'Course disabled')
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((r) => r.id))
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'select',
        label: '',
        headerClassName: 'w-12 pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8',
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => {
              setSelectedIds((prev) =>
                prev.includes(row.id)
                  ? prev.filter((x) => x !== row.id)
                  : [...prev, row.id],
              )
            }}
            className="h-4 w-4 rounded accent-[#246392]"
            aria-label={`Select ${row.name}`}
          />
        ),
      },
      {
        key: 'courseId',
        label: 'Course ID',
        render: (row) => (
          <span className="font-mono text-sm font-medium text-[#111]">{row.courseId}</span>
        ),
      },
      {
        key: 'name',
        label: 'Course Name',
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
      },
      {
        key: 'centerName',
        label: 'Centre',
        render: (row) => (
          <span className="text-sm text-[#444]">{row.centerName || '—'}</span>
        ),
      },
      {
        key: 'program',
        label: 'Program',
        render: (row) => (
          <span className="text-sm text-[#444]" title={row.program}>
            {row.program || '—'}
          </span>
        ),
      },
      {
        key: 'examCategory',
        label: 'Exam Category',
        render: (row) => <span className="text-sm text-[#444]">{row.examCategory || '—'}</span>,
      },
      {
        key: 'examSubCategory',
        label: 'Exam Subcategory',
        render: (row) => (
          <span className="text-sm text-[#444]">{row.examSubCategory || '—'}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[11rem] text-right',
        cellClassName: 'min-w-[11rem] text-right',
        render: (row) => (
          <CategoryTableActions
            status={row.status}
            onView={() => setViewItem(row)}
            onEdit={() => modal.openEdit(row)}
            onDelete={() => setDeleteTarget(row)}
            onToggleStatus={() => handleToggleStatus(row)}
          />
        ),
      },
    ],
    [selectedIds, modal],
  )

  const showEmpty = !loading && courses.length === 0
  const showNoResults = !loading && !showEmpty && filtered.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 sm:space-y-6"
    >
      <CategoryPageHeader icon={BookOpen} hideTitle>
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

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium text-[#686868] shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
          Loading courses…
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-[#686868]">
              <input
                type="checkbox"
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-[#246392]"
              />
              <span>Select all on this page</span>
            </div>
          )}

          {showEmpty ? (
            <CategoryEmptyState
              title={section.emptyTitle}
              description={section.emptyDescription}
              ctaLabel="Add Course"
              onCta={modal.openCreate}
            />
          ) : showNoResults ? (
            <CategoryEmptyState
              title="No matching courses"
              description="Try adjusting search or filters."
              ctaLabel="Clear filters"
              onCta={() =>
                setFilters({ search: '', status: 'all', centre: 'all', program: 'all' })
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
              <PaginatedFigmaTable
                columns={columns}
                data={filtered}
                itemLabel="courses"
                resetDeps={[filters]}
                rowClassName="transition-colors hover:bg-[#f8fbff]"
                tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
              />
            </div>
          )}
        </>
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete item?"
        message="Are you sure you want to delete this item?"
        confirmLabel="Confirm Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </motion.div>
  )
}
