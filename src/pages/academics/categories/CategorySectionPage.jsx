import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryHubFormModal from '../../../components/categories/CategoryHubFormModal'
import ExamCategorySection from './exam-category'
import ExamSubCategorySection from './exam-sub-category'
import SubjectSection from './subject'
import TopicSection from './topic'
import TeacherSection from './teachers'
import ViewMainCategoryModal from '../../../components/categories/ViewMainCategoryModal'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import {
  CATEGORIES_HUB_INITIAL,
  PARENT_CATEGORY_OPTIONS,
  SUBJECT_OPTIONS,
} from '../../../data/categoriesHubData'
import {
  CATEGORY_HUB_SECTIONS,
  getTabIdFromPath,
} from '../../../constants/categoryHubSections'
import { useCenters } from '../../../contexts/CentersContext'
import { useEditModal } from '../../../hooks/useEditModal'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { loadSubjects, saveSubjects, nextSubjectId } from '../../../utils/subjectsStorage'
import { formatProgramLabel, loadPrograms } from '../../../utils/programsStorage'
import { toast } from '../../../utils/toast'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'

function nextId(list) {
  const max = list.reduce((m, row) => Math.max(m, parseInt(row.id, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

function emptyFilters() {
  return {
    search: '',
    status: 'all',
    category: 'all',
    subject: 'all',
    program: 'all',
    center: 'all',
  }
}

function CategoryIcon({ row }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#cbeeff] text-xs font-bold text-[#246392] shadow-sm">
      {row.iconUrl ? (
        <img src={row.iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        row.iconLabel || row.name?.slice(0, 2)?.toUpperCase()
      )}
    </div>
  )
}

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

export default function CategorySectionPage() {
  const location = useLocation()
  const activeTab = getTabIdFromPath(location.pathname)
  const section = CATEGORY_HUB_SECTIONS[activeTab]
  const Icon = section?.icon
  const isExamCategory = activeTab === 'exam-category'
  const isExamSubCategory = activeTab === 'exam-sub-category'
  const isSubject = activeTab === 'subject'
  const isTopic = activeTab === 'topic'
  const isTeachers = activeTab === 'teachers'
  const { activeCenters } = useCenters()

  const [dataBySection, setDataBySection] = useState(() => ({
    ...CATEGORIES_HUB_INITIAL,
    subject: loadSubjects(),
  }))
  const [filtersBySection, setFiltersBySection] = useState(() =>
    Object.fromEntries(
      Object.keys(CATEGORY_HUB_SECTIONS)
        .filter((k) => k !== 'programs' && k !== 'courses')
        .map((k) => [k, emptyFilters()]),
    ),
  )
  const [programs, setPrograms] = useState(() => loadPrograms(activeCenters))

  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const refresh = () => setPrograms(loadPrograms(activeCenters))
    window.addEventListener('programs-updated', refresh)
    return () => window.removeEventListener('programs-updated', refresh)
  }, [activeCenters])

  useEffect(() => {
    saveSubjects(dataBySection.subject || [])
  }, [dataBySection.subject])

  const rows = dataBySection[activeTab] || []
  const filters = filtersBySection[activeTab] || emptyFilters()

  const updateFilters = (patch) => {
    setFiltersBySection((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }))
  }

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return rows.filter((row) => {
      const matchSearch =
        !q ||
        row.name?.toLowerCase().includes(q) ||
        row.categoryId?.toLowerCase().includes(q) ||
        row.subcategoryId?.toLowerCase().includes(q) ||
        row.examCategory?.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q) ||
        row.parentCategory?.toLowerCase().includes(q) ||
        row.subject?.toLowerCase().includes(q) ||
        row.program?.toLowerCase().includes(q) ||
        row.centerName?.toLowerCase().includes(q)
      const matchStatus = filters.status === 'all' || row.status === filters.status
      const matchCategory =
        filters.category === 'all' || row.parentCategory === filters.category
      const matchSubject = filters.subject === 'all' || row.subject === filters.subject
      const matchProgram = filters.program === 'all' || row.program === filters.program
      const matchCenter =
        filters.center === 'all' ||
        String(row.centerId) === String(filters.center) ||
        row.centerName === filters.center
      return (
        matchSearch &&
        matchStatus &&
        matchCategory &&
        matchSubject &&
        matchProgram &&
        matchCenter
      )
    })
  }, [rows, filters])

  const handleGenericSave = useCallback(
    (form, { isEdit, id }) => {
      const now = new Date().toISOString()
      const centre = activeCenters.find((c) => String(c.centerId) === String(form.centerId))
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        status: form.status,
        parentCategory: form.parentCategory || '',
        subject: form.subject || '',
        program: form.program || '',
        centerId: form.centerId || centre?.centerId || '',
        centerName: form.centerName || centre?.centerName || '',
        iconUrl: form.iconUrl || '',
        iconFileName: form.iconFileName || '',
        iconLabel: form.iconLabel || form.name.slice(0, 2).toUpperCase(),
        modifiedAt: now,
      }

      setDataBySection((prev) => {
        const list = prev[activeTab] || []
        if (isEdit && id != null) {
          return {
            ...prev,
            [activeTab]: list.map((row) => (row.id === id ? { ...row, ...payload } : row)),
          }
        }
        const newRow = { id: nextId(list), ...payload, createdAt: now }
        if (activeTab === 'subject') {
          newRow.subjectId = nextSubjectId(list)
        }
        return {
          ...prev,
          [activeTab]: [...list, newRow],
        }
      })
      toast.success(isEdit ? 'Updated successfully' : 'Created successfully')
    },
    [activeTab, activeCenters],
  )

  const handleDelete = (row) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setDataBySection((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((c) => c.id !== deleteTarget.id),
    }))
    setDeleteTarget(null)
    toast.success('Deleted successfully')
  }

  const handleToggleStatus = (row) => {
    const next = row.status === 'Active' ? 'In Active' : 'Active'
    setDataBySection((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((c) =>
        c.id === row.id ? { ...c, status: next, modifiedAt: new Date().toISOString() } : c,
      ),
    }))
    toast.success(next === 'Active' ? 'Enabled' : 'Disabled')
  }

  const createdLabel = section?.dateColumns?.created || 'Created On'
  const modifiedLabel = section?.dateColumns?.modified || 'Modified On'

  const programFilterOptions = useMemo(() => {
    if (!section) return [{ value: 'all', label: 'All Programs' }]
    const fromRows = [...new Set(rows.map((r) => r.program).filter(Boolean))]
    const fromPrograms = programs.map((p) => formatProgramLabel(p))
    const merged = [...new Set([...fromRows, ...fromPrograms])].sort()
    return [
      { value: 'all', label: 'All Programs' },
      ...merged.map((p) => ({ value: p, label: p })),
    ]
  }, [rows, programs, section])

  const columns = useMemo(() => {
    if (!section) return []

    const cols = [
      {
        key: 'id',
        label: 'ID',
        headerClassName: 'pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 font-medium tabular-nums',
        render: (row) => row.id,
      },
      {
        key: 'name',
        label: section.primaryColumn,
        render: (row) => (
          <div className="flex items-center gap-3">
            {section.formFields?.includes('icon') && <CategoryIcon row={row} />}
            <span className="font-semibold">{row.name}</span>
          </div>
        ),
      },
    ]

    if (activeTab === 'topic' || activeTab === 'teachers') {
      cols.push({ key: 'subject', label: 'Subject', render: (row) => row.subject || '—' })
    }

    if (activeTab === 'teachers') {
      cols.push({
        key: 'centerName',
        label: 'Center',
        render: (row) => (
          <span className="text-sm font-medium text-[#1a3a5c]">{row.centerName || '—'}</span>
        ),
      })
    }

    cols.push(
      {
        key: 'createdAt',
        label: createdLabel,
        render: (row) => (
          <span className="whitespace-nowrap text-sm">{formatCategoryDateTime(row.createdAt)}</span>
        ),
      },
      {
        key: 'modifiedAt',
        label: modifiedLabel,
        render: (row) => (
          <span className="whitespace-nowrap text-sm">{formatCategoryDateTime(row.modifiedAt)}</span>
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
    )

    return cols
  }, [activeTab, section, modal, createdLabel, modifiedLabel])

  const categoryFilterOptions = [
    { value: 'all', label: 'Category' },
    ...PARENT_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
  ]

  const subjectFilterOptions = [
    { value: 'all', label: 'Subject' },
    ...SUBJECT_OPTIONS.map((s) => ({ value: s, label: s })),
  ]

  const centerFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Center' },
      ...activeCenters.map((c) => ({
        value: String(c.centerId),
        label: c.centerName,
      })),
    ],
    [activeCenters],
  )

  const showEmpty = rows.length === 0
  const showNoResults = !showEmpty && filtered.length === 0

  if (!section) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#111111]">This category section is not available.</p>
        <p className="mt-2 text-sm text-[#686868]">Choose a section from the tabs above or return to Programs.</p>
        <Link
          to="/academics/categories/programs"
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#246392] px-5 text-sm font-semibold text-white"
        >
          Go to Programs
        </Link>
      </div>
    )
  }

  if (isExamCategory) {
    return <ExamCategorySection section={section} Icon={Icon} />
  }

  if (isExamSubCategory) {
    return <ExamSubCategorySection section={section} Icon={Icon} />
  }

  if (isSubject) {
    return <SubjectSection section={section} Icon={Icon} />
  }

  if (isTopic) {
    return <TopicSection section={section} Icon={Icon} />
  }

  if (isTeachers) {
    return <TeacherSection section={section} Icon={Icon} />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader icon={Icon} hideTitle>
          <AddButton onClick={modal.openCreate}>{section.addLabel}</AddButton>
        </CategoryPageHeader>

        <CategoryFilterBar
          search={filters.search}
          onSearchChange={(e) => updateFilters({ search: e.target.value })}
          searchPlaceholder={section.searchPlaceholder}
          status={filters.status}
          onStatusChange={(e) => updateFilters({ status: e.target.value })}
          categoryFilter={filters.category}
          onCategoryFilterChange={(e) => updateFilters({ category: e.target.value })}
          categoryOptions={
            section.filters?.includes('category') ? categoryFilterOptions : undefined
          }
          subjectFilter={filters.subject}
          onSubjectFilterChange={(e) => updateFilters({ subject: e.target.value })}
          subjectOptions={section.filters?.includes('subject') ? subjectFilterOptions : undefined}
          centerFilter={filters.center}
          onCenterFilterChange={(e) => updateFilters({ center: e.target.value })}
          centerOptions={section.filters?.includes('centre') ? centerFilterOptions : undefined}
        />

        {section.filters?.includes('program') && (
          <div className="flex justify-end">
            <select
              value={filters.program}
              onChange={(e) => updateFilters({ program: e.target.value })}
              className="h-10 rounded-lg bg-[#55ace7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a9ad4]"
            >
              {programFilterOptions.map((o) => (
                <option key={o.value} value={o.value} className="text-[#222]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showEmpty ? (
          <CategoryEmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            ctaLabel={section.emptyCta}
            onCta={modal.openCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or filters."
            ctaLabel="Clear filters"
            onCta={() => updateFilters(emptyFilters())}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
            <PaginatedFigmaTable
              columns={columns}
              data={filtered}
              itemLabel={section.bannerTitle.toLowerCase()}
              resetDeps={[filters, activeTab]}
              rowClassName="transition-colors hover:bg-[#f8fbff]"
              tableClassName={undefined}
            />
          </div>
        )}

        <CategoryHubFormModal
          open={modal.isOpen}
          onClose={modal.close}
          item={modal.selectedItem}
          section={section}
          onSubmit={handleGenericSave}
        />
        <ViewMainCategoryModal
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
    </AnimatePresence>
  )
}
