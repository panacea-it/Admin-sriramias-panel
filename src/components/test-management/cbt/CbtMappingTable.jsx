import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

function formatLastUpdated(iso) {
  if (!iso) return '—'
  return formatCategoryDateTime(iso)
}

function ScorePill({ pct }) {
  const value = Number(pct) || 0
  const tier = value >= 70 ? 'high' : value >= 50 ? 'mid' : 'low'
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
    mid: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
    low: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  }

  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tabular-nums ring-1 ring-inset',
        styles[tier],
      )}
    >
      {value}%
    </span>
  )
}

function CbtMappingTableActions({ row, onView }) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${row.subjectName}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
    </div>
  )
}

export default function CbtMappingTable({ rows, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.subjectName.toLowerCase().includes(q) ||
        r.facultyName.toLowerCase().includes(q),
    )
  }, [rows, search])

  const openFaculty = useCallback(
    (row) => {
      navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(row.subjectId))
    },
    [navigate],
  )

  const columns = useMemo(
    () => [
      {
        key: 'subjectName',
        label: 'Faculty Subject',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <button
            type="button"
            onClick={() => openFaculty(row)}
            className="block max-w-full truncate text-left font-semibold text-[#1a3a5c] transition hover:text-[#55ace7]"
            title={row.subjectName}
          >
            {row.subjectName}
          </button>
        ),
      },
      {
        key: 'facultyName',
        label: 'Faculty Name',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <button
            type="button"
            onClick={() => openFaculty(row)}
            className="block max-w-full truncate text-left font-medium text-[#111] transition hover:text-[#55ace7]"
            title={row.facultyName}
          >
            {row.facultyName}
          </button>
        ),
      },
      {
        key: 'totalTopics',
        label: 'Total Topics',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{row.totalTopics ?? 0}</span>
        ),
      },
      {
        key: 'totalTestSeries',
        label: 'Total Test Series',
        align: 'center',
        headerClassName: 'min-w-[140px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[140px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#111]">{row.totalTestSeries}</span>
        ),
      },
      {
        key: 'studentsAttempted',
        label: 'Total Students Attempted',
        align: 'center',
        headerClassName: 'min-w-[180px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[180px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">
            {row.studentsAttempted.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'averageScorePct',
        label: 'Average Score',
        align: 'center',
        headerClassName: 'min-w-[130px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle text-center',
        render: (row) => <ScorePill pct={row.averageScorePct} />,
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{formatLastUpdated(row.lastUpdated)}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[120px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => (
          <CbtMappingTableActions row={row} onView={() => openFaculty(row)} />
        ),
      },
    ],
    [openFaculty],
  )

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-[#1a3a5c]">Academic Test Mapping</h2>
        <p className="mt-0.5 text-xs font-medium text-[#686868]">
          Synced from Faculty Subjects — TEST category only
        </p>
      </div>

      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or faculty…"
            disabled={loading && rows.length === 0}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          loading={loading}
          skeletonRowCount={8}
          itemLabel="records"
          initialPageSize={10}
          resetDeps={[search, rows.length]}
          density="comfortable"
          rowClassName="hover:bg-[#eef6fc]/70"
          tableClassName="rounded-none border-0 shadow-none"
          tableMinWidth={1180}
          emptyMessage="No TEST category mappings found. Add Test Series under Faculty Subjects."
          paginationClassName={cn(
            '[&>div:last-child]:items-center',
            '[&_nav]:items-center',
            '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
            '[&_form_input]:h-9 [&_form_input]:leading-none',
            '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
          )}
        />
      </div>
    </div>
  )
}
