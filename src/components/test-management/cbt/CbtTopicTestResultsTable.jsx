import { useMemo } from 'react'
import { CbtAdminTable, CbtAttemptStatusBadge, CbtResultStatusBadge } from './ui'
import {
  CBT_RESULTS_TABLE_MIN_WIDTH,
  CBT_TABLE_BADGE,
  CBT_TABLE_CELL_CENTER,
  CBT_TABLE_CELL_LEFT,
  CBT_TABLE_HEADER,
} from './ui/cbtTableStyles'

export default function CbtTopicTestResultsTable({
  rows,
  loading,
  resetDeps = [],
  emptyMessage,
  sortKey,
  sortDir,
  onToggleSort,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[220px] pl-5 text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[220px] pl-5 font-bold text-slate-900`,
        render: (row) => row.studentName || '—',
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[170px] text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[170px] font-semibold tabular-nums text-[#111]`,
        render: (row) => row.rollNumber || '—',
      },
      {
        key: 'attemptStatus',
        label: 'Attempt Status',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[170px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[170px]`,
        render: (row) => (
          <div className="flex justify-center">
            <CbtAttemptStatusBadge status={row.attemptStatus} className={CBT_TABLE_BADGE} />
          </div>
        ),
      },
      {
        key: 'score',
        label: 'Score',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[110px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[110px] font-medium tabular-nums text-[#111]`,
        render: (row) => (
          <span>
            {row.score}/{row.maxMarks}
          </span>
        ),
      },
      {
        key: 'accuracyPct',
        label: 'Accuracy %',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[130px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[130px] font-medium tabular-nums text-[#111]`,
        render: (row) => <span>{row.accuracyPct}%</span>,
      },
      {
        key: 'negativeMarks',
        label: 'Negative Marks',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[150px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[150px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.negativeMarks,
      },
      {
        key: 'rank',
        label: (
          <button
            type="button"
            onClick={() => onToggleSort?.('rank')}
            className="inline-flex items-center gap-0.5 text-[15px] font-semibold text-white"
          >
            Rank {sortKey === 'rank' ? (sortDir === 'asc' ? '↑' : '↓') : '↑'}
          </button>
        ),
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[90px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[90px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.rank ?? '—',
      },
      {
        key: 'timeTaken',
        label: 'Time Taken',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[130px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[130px] font-medium text-[#686868]`,
        render: (row) => row.timeTaken || '—',
      },
      {
        key: 'submissionDate',
        label: 'Submission Time',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[180px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[180px] font-medium text-[#686868]`,
        render: (row) => row.submissionDate || '—',
      },
      {
        key: 'resultStatus',
        label: 'Result Status',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[170px] pr-5 text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[170px] pr-5`,
        render: (row) => (
          <div className="flex justify-center">
            <CbtResultStatusBadge status={row.resultStatus} className={CBT_TABLE_BADGE} />
          </div>
        ),
      },
    ],
    [onToggleSort, sortDir, sortKey],
  )

  return (
    <CbtAdminTable
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      itemLabel="students"
      loading={loading}
      skeletonRowCount={10}
      initialPageSize={10}
      resetDeps={resetDeps}
      tableMinWidth={CBT_RESULTS_TABLE_MIN_WIDTH}
    />
  )
}
