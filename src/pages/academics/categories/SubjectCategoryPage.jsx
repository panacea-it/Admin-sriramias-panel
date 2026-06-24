import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, PlusCircle } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import CategoryRouteTabs from '../../../components/categories/CategoryRouteTabs'
import CategoryBreadcrumb from '../../../components/categories/CategoryBreadcrumb'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import SubjectCategoryModal from '../../../components/categories/SubjectCategoryModal'
import ViewSubjectCategoryModal from '../../../components/categories/ViewSubjectCategoryModal'
import { INITIAL_MAIN_CATEGORIES } from '../../../data/mainCategoriesData'
import { INITIAL_SUBJECT_CATEGORIES } from '../../../data/subjectCategoriesData'
import { useEditModal } from '../../../hooks/useEditModal'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { toast } from '../../../utils/toast'

function nextId(list) {
  const max = list.reduce((m, row) => Math.max(m, parseInt(row.id, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

function CategoryIcon({ row }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#cbeeff] text-xs font-bold text-[#246392] shadow-sm ring-1 ring-[#55ace7]/10">
      {row.iconUrl ? (
        <img src={row.iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        row.iconLabel || row.name?.slice(0, 2)?.toUpperCase()
      )}
    </div>
  )
}

function AddCategoryButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(3,4,94,0.4)] active:scale-[0.98] sm:text-base"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
        <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
      </span>
      {children}
    </button>
  )
}

export default function SubjectCategoryPage() {
  const [subjects, setSubjects] = useState(INITIAL_SUBJECT_CATEGORIES)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mainCategoryFilter, setMainCategoryFilter] = useState('all')
  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const mainCategoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Main Category' },
      ...INITIAL_MAIN_CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
    ],
    [],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return subjects.filter((row) => {
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q) ||
        row.mainCategoryName?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      const matchMain =
        mainCategoryFilter === 'all' || row.mainCategoryId === mainCategoryFilter
      return matchSearch && matchStatus && matchMain
    })
  }, [subjects, search, statusFilter, mainCategoryFilter])

  const handleSave = (form, { isEdit, id, mainCategoryName }) => {
    const now = new Date().toISOString()
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || '',
      mainCategoryId: form.mainCategoryId,
      mainCategoryName,
      status: form.status,
      iconUrl: form.iconUrl,
      iconFileName: form.iconFileName,
      iconLabel: form.iconLabel || form.name.slice(0, 2).toUpperCase(),
      formData: form.formData || {
        topicId: form.topicId,
        topicName: form.topicName,
        teacherId: form.teacherId,
        teacherName: form.teacherName,
        categoryType: form.categoryType,
        classTitle: form.classTitle,
        center: form.center,
        classRoom: form.classRoom,
        scheduleDate: form.scheduleDate,
        timeHrs: form.timeHrs,
        timeMin: form.timeMin,
        timeSec: form.timeSec,
        durationHrs: form.durationHrs,
        durationMin: form.durationMin,
        durationSec: form.durationSec,
        scheduledTime: form.formData?.scheduledTime,
        duration: form.formData?.duration,
      },
      modifiedAt: now,
    }

    if (isEdit && id != null) {
      setSubjects((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...payload } : row)),
      )
      return
    }

    setSubjects((prev) => [
      ...prev,
      {
        id: nextId(prev),
        ...payload,
        createdAt: now,
      },
    ])
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setSubjects((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    toast.success('Subject category deleted')
    setDeleteTarget(null)
  }

  const handleToggleStatus = (row) => {
    const next = row.status === 'Active' ? 'In Active' : 'Active'
    setSubjects((prev) =>
      prev.map((c) =>
        c.id === row.id
          ? { ...c, status: next, modifiedAt: new Date().toISOString() }
          : c,
      ),
    )
    toast.success(next === 'Active' ? 'Subject enabled' : 'Subject disabled')
  }

  const columns = [
    {
      key: 'name',
      label: 'Subject Name',
      headerClassName: 'pl-6 sm:pl-8',
      cellClassName: 'pl-6 sm:pl-8',
      render: (row) => (
        <div className="flex items-center gap-3">
          <CategoryIcon row={row} />
          <span className="font-semibold text-[#222]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'mainCategoryName',
      label: 'Main Category',
      render: (row) => (
        <span className="inline-flex rounded-md bg-[#eef2fc] px-2.5 py-1 text-sm font-medium text-[#246392]">
          {row.mainCategoryName || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CategoryStatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row) => (
        <span className="whitespace-nowrap text-[#222]">
          {formatCategoryDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
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
  ]

  const showEmpty = subjects.length === 0
  const showNoResults = !showEmpty && filtered.length === 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="figma-admin-section min-h-full bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6"
    >
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <CategoryBreadcrumb
          items={[
            { label: 'Academics' },
            { label: 'Categories' },
            { label: 'Subject' },
          ]}
        />

        <CategoryRouteTabs />

        <PageBanner
          icon={BookOpen}
          iconClassName="text-[#246392]"
          title="Subject Categories"
          className="from-[#55ace7] via-[#7ba8c9] to-[#8b98bb]"
        >
          <AddCategoryButton onClick={modal.openCreate}>Add Subject</AddCategoryButton>
        </PageBanner>

        <CategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search subject categories"
          categoryFilter={mainCategoryFilter}
          onCategoryFilterChange={(e) => setMainCategoryFilter(e.target.value)}
          categoryOptions={mainCategoryOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        {showEmpty ? (
          <CategoryEmptyState
            icon={BookOpen}
            title="No Subject Categories Found"
            description="Create your first subject category to map academics content under a main exam track."
            ctaLabel="Add Subject"
            onCta={modal.openCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            icon={BookOpen}
            title="No matching subjects"
            description="Try adjusting your search, main category, or status filter."
            ctaLabel="Clear filters"
            onCta={() => {
              setSearch('')
              setStatusFilter('all')
              setMainCategoryFilter('all')
            }}
          />
        ) : (
          <PaginatedFigmaTable
            columns={columns}
            data={filtered}
            emptyMessage="No subject categories found."
            itemLabel="subjects"
            resetDeps={[search, statusFilter, mainCategoryFilter]}
            rowClassName="transition-colors duration-200 hover:bg-slate-50/90"
            tableClassName="shadow-[0_11px_25px_rgba(15,23,42,0.06)] backdrop-blur-[2px]"
          />
        )}
      </section>

      <SubjectCategoryModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        mainCategories={INITIAL_MAIN_CATEGORIES}
        onSubmit={handleSave}
      />

      <ViewSubjectCategoryModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      
    </motion.div>
  )
}
