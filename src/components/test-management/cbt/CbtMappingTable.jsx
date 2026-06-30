import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CbtCardSearchInput,
  CbtPrimaryActionButton,
  CbtAdminTable,
  CBT_DATA_PANEL,
  CBT_TABLE_CONTAINER,
} from './ui'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { createActionsColumn, TABLE_ACTIONS_WRAP_CENTER } from '../../../utils/tableColumnHelpers'

function formatLastUpdated(iso) {
  if (!iso) return '—'
  return formatCategoryDateTime(iso)
}

function CbtMappingTableActions({ onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <CbtPrimaryActionButton onClick={onView} label="View" />
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
        render: (row) => (
          <span className="font-semibold tabular-nums text-[#55ace7]">{row.averageScorePct}%</span>
        ),
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
      createActionsColumn({
        buttonCount: 1,
        align: 'center',
        render: (row) => <CbtMappingTableActions onView={() => openFaculty(row)} />,
      }),
    ],
    [openFaculty],
  )

  return (
    <section className={CBT_DATA_PANEL}>
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1a3a5c]">Academic Test Mapping</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Synced from Faculty Subjects — TEST category only
          </p>
        </div>
        <CbtCardSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject or faculty…"
          disabled={loading && rows.length === 0}
        />
      </header>

      <div className={CBT_TABLE_CONTAINER}>
        <CbtAdminTable
          columns={columns}
          data={filtered}
          loading={loading}
          skeletonRowCount={8}
          itemLabel="mappings"
          initialPageSize={10}
          resetDeps={[search, rows.length]}
          tableMinWidth={1180}
          onRowClick={openFaculty}
          rowClassName="cursor-pointer hover:bg-[#eef6fc]/70"
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Click any row, faculty subject, faculty name, or View to open test series details.
      </p>
    </section>
  )
}
