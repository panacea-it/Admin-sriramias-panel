import { useMemo, useState } from 'react'
import { ClipboardList, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import EditButton from '../../components/common/EditButton'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddTestModal from '../../components/tests/AddTestModal'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { INITIAL_TESTS } from '../../data/testsData'
import { useEditModal } from '../../hooks/useEditModal'
import { testFormToRow } from '../../utils/testFormUtils'
import { TEST_STATUSES } from '../../data/testsData'
import { upsertListItem } from '../../utils/academicsCrud'

export default function TestsPage() {
  const [tests, setTests] = useState(INITIAL_TESTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const modal = useEditModal()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tests.filter((row) => {
      const matchSearch =
        !q || row.name.toLowerCase().includes(q) || row.type?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [tests, search, statusFilter])

  const handleSave = (form, { isEdit, id }) => {
    const existing = isEdit ? tests.find((t) => t.id === id) : null
    const row = testFormToRow(form, existing)
    setTests((prev) => upsertListItem(prev, row, { isEdit, id }))
  }

  const handleDelete = (id) => {
    setTests((prev) => prev.filter((t) => t.id !== id))
    toast.success('Test deleted')
  }

  const columns = [
    {
      key: 'name',
      label: 'Test',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => <ResourceNameCell name={row.name} />,
    },
    { key: 'type', label: 'Type' },
    { key: 'center', label: 'Center' },
    { key: 'totalQuestions', label: 'Questions' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <EditButton onClick={() => modal.openEdit(row)} />
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.1} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={ClipboardList} title="Tests" className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]">
          <BannerButton onClick={modal.openCreate}>Create Test</BannerButton>
        </PageBanner>

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search tests"
          category=""
          onCategoryChange={() => {}}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={[
            { value: 'all', label: 'Status' },
            ...TEST_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No tests found."
          itemLabel="tests"
          resetDeps={[search, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

      <AddTestModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSave}
      />
    </div>
  )
}
