import { useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PaymentAttemptFailureBadge from './PaymentAttemptFailureBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatLastAttemptDisplay } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

function ContactCell({ row }) {
  return (
    <div className="min-w-[120px] text-[13px]">
      <p className="font-medium text-[#111]">{row.mobile || '—'}</p>
      {row.email ? (
        <a
          href={`mailto:${row.email}`}
          className="truncate text-[#246392] hover:underline"
          title={row.email}
          onClick={(e) => e.stopPropagation()}
        >
          {row.email}
        </a>
      ) : (
        <p className="text-[#686868]">—</p>
      )}
    </div>
  )
}

function LastAttemptCell({ row }) {
  const { time, date } = formatLastAttemptDisplay(row.lastAttemptDate || row.dateTime)
  return (
    <div className="whitespace-nowrap text-[13px]">
      <p className="font-medium text-[#111]">{time}</p>
      <p className="text-[#686868]">{date}</p>
    </div>
  )
}

function SortableLabel({ label, columnKey, sortKey, sortDir }) {
  const active = sortKey === columnKey
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        )
      ) : null}
    </span>
  )
}

export default function PaymentAttemptTable({
  rows,
  loading,
  resetDeps = [],
  emptyMessage,
  sortKey,
  sortDir,
  onSort,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'attemptId',
        label: (
          <button type="button" className="w-full text-left" onClick={() => onSort?.('attemptId')}>
            <SortableLabel label="Attempt ID" columnKey="attemptId" sortKey={sortKey} sortDir={sortDir} />
          </button>
        ),
        headerClassName: 'min-w-[110px] cursor-pointer select-none',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#246392]">{row.attemptId || row.id}</span>
        ),
      },
      {
        key: 'center',
        label: 'Center',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.center || row.centerName?.replace(' Center', '') || '—'}</span>
        ),
      },
      {
        key: 'student',
        label: (
          <button type="button" className="w-full text-left" onClick={() => onSort?.('student')}>
            <SortableLabel label="Student" columnKey="student" sortKey={sortKey} sortDir={sortDir} />
          </button>
        ),
        headerClassName: 'min-w-[140px] cursor-pointer select-none',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => <span className="font-semibold text-slate-900">{row.student}</span>,
      },
      {
        key: 'contact',
        label: 'Contact',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle',
        render: (row) => <ContactCell row={row} />,
      },
      {
        key: 'course',
        label: 'Course',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="block max-w-[200px] truncate text-[13px] text-[#111]" title={row.course}>
            {row.course || '—'}
          </span>
        ),
      },
      {
        key: 'amount',
        label: (
          <button type="button" className="w-full text-left" onClick={() => onSort?.('amount')}>
            <SortableLabel label="Amount" columnKey="amount" sortKey={sortKey} sortDir={sortDir} />
          </button>
        ),
        headerClassName: 'min-w-[100px] cursor-pointer select-none whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap',
        render: (row) => <span className="font-semibold text-[#111]">{formatINR(row.amount)}</span>,
      },
      {
        key: 'failureCategory',
        label: 'Failure Reason',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle',
        render: (row) => <PaymentAttemptFailureBadge category={row.failureCategory} />,
      },
      {
        key: 'retryCount',
        label: (
          <button type="button" className="w-full text-left" onClick={() => onSort?.('retryCount')}>
            <SortableLabel label="Retries" columnKey="retryCount" sortKey={sortKey} sortDir={sortDir} />
          </button>
        ),
        headerClassName: 'min-w-[80px] cursor-pointer select-none whitespace-nowrap',
        cellClassName: 'min-w-[80px] align-middle whitespace-nowrap',
        render: (row) => <span className="font-medium text-[#111]">{row.retryCount ?? 0}</span>,
      },
      {
        key: 'lastAttempt',
        label: (
          <button type="button" className="w-full text-left" onClick={() => onSort?.('lastAttempt')}>
            <SortableLabel label="Last Attempt" columnKey="lastAttempt" sortKey={sortKey} sortDir={sortDir} />
          </button>
        ),
        headerClassName: 'min-w-[120px] cursor-pointer select-none whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap',
        render: (row) => <LastAttemptCell row={row} />,
      },
      {
        key: 'counselorName',
        label: 'Counselor',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'min-w-[130px] align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.counselorName || '—'}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[180px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[180px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderActions(row),
      },
    ],
    [sortKey, sortDir, onSort, renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      itemLabel="attempts"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1180}
      paginationClassName={cn(
        '[&>div:last-child]:items-center',
        '[&_nav]:items-center',
        '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
        '[&_form_input]:h-9 [&_form_input]:leading-none',
        '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
      )}
    />
  )
}
