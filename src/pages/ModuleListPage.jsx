import { useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import PageBanner from '../components/figma/PageBanner'
import FilterToolbar from '../components/figma/FilterToolbar'
import PaginatedFigmaTable from '../components/figma/PaginatedFigmaTable'
import EditButton from '../components/common/EditButton'
import { TABLE_ACTIONS_WRAP } from '../utils/tableColumnHelpers'

const SAMPLE = [
  { id: 1, name: 'UPSC Foundation 2026', status: 'Active', updated: 'May 12, 2026', price: '12,000' },
  { id: 2, name: 'GS Prelims Crash Course', status: 'Active', updated: 'May 10, 2026', price: '8,500' },
  { id: 3, name: 'Optional Sociology Batch', status: 'Draft', updated: 'May 8, 2026', price: '6,000' },
  { id: 4, name: 'Interview Guidance Program', status: 'Active', updated: 'May 5, 2026', price: '15,000' },
  { id: 5, name: 'Ethics & Integrity Module', status: 'Archived', updated: 'Apr 28, 2026', price: '4,500' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

function ActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-slate-50 sm:text-base"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

export default function ModuleListPage({
  title,
  description,
  icon: Icon,
  addLabel = 'Add new',
  searchPlaceholder,
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    return SAMPLE.filter((row) => {
      const matchSearch = row.name.toLowerCase().includes(search.toLowerCase())
      const matchFilter =
        filter === 'all' || row.status.toLowerCase() === filter
      return matchSearch && matchFilter
    })
  }, [search, filter])

  const columns = [
    {
      key: 'name',
      label: 'Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => (
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="h-6 w-6 shrink-0 rounded bg-[#cbeeff]" />
          <span className="truncate font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => <span className="whitespace-nowrap">₹ {row.price}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex h-8 min-w-[80px] items-center justify-center rounded px-3 text-sm font-semibold text-white ${
            row.status === 'Active'
              ? 'bg-[#69df66]'
              : row.status === 'Draft'
                ? 'bg-[#efb36d]'
                : 'bg-[#9ca3af]'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: () => (
        <div className={TABLE_ACTIONS_WRAP}>
          <EditButton onClick={() => {}} />
        </div>
      ),
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        {description && (
          <p className="text-sm font-medium text-[#686868]">{description}</p>
        )}

        <PageBanner icon={Icon} title={title}>
          <ActionButton>{addLabel}</ActionButton>
        </PageBanner>

        <FilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={searchPlaceholder || `Search ${title}...`}
          filterValue={filter}
          onFilterChange={(e) => setFilter(e.target.value)}
          filterOptions={STATUS_OPTIONS}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={`No ${title?.toLowerCase()} found.`}
          itemLabel={title?.toLowerCase() || 'records'}
          resetDeps={[search, filter]}
        />
      </section>
    </div>
  )
}
