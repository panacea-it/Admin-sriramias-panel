import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import PaymentAttemptFailureBadge from '../finance/payment-attempts/PaymentAttemptFailureBadge'
import { formatINR } from '../../utils/financeFilters'
import { formatLastAttemptDisplay } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'

function ContactCell({ row }) {
  return (
    <div className="min-w-[120px] text-[13px]">
      <p className="font-medium text-[#111]">{row.mobile || row.mobileNumber || '—'}</p>
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

export default function PaymentAttemptLogsTable({
  attempts,
  loading,
  resetDeps = [],
  emptyMessage = 'No payment attempts found',
}) {
  const columns = useMemo(
    () => [
      {
        key: 'attemptId',
        label: 'Attempt ID',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#246392]">{row.attemptId || '—'}</span>
        ),
      },
      {
        key: 'studentName',
        label: 'Student Name',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.studentName || row.student || '—'}</span>
        ),
      },
      {
        key: 'contact',
        label: 'Contact',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle',
        render: (row) => <ContactCell row={row} />,
      },
      {
        key: 'bookName',
        label: 'Book Name',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="block max-w-[220px] truncate text-[13px] text-[#111]" title={row.bookName}>
            {row.bookName || '—'}
          </span>
        ),
      },
      {
        key: 'amount',
        label: 'Amount',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap',
        render: (row) => <span className="font-semibold text-[#111]">{formatINR(row.amount)}</span>,
      },
      {
        key: 'failureCategory',
        label: 'Failure Reason',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle',
        render: (row) => (
          <PaymentAttemptFailureBadge category={row.failureCategory} rawMessage={row.failureMessage} />
        ),
      },
      {
        key: 'retryCount',
        label: 'Retry Count',
        headerClassName: 'min-w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] align-middle whitespace-nowrap',
        render: (row) => <span className="font-medium text-[#111]">{row.retryCount ?? 0}</span>,
      },
      {
        key: 'lastAttempt',
        label: 'Last Attempt',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap',
        render: (row) => <LastAttemptCell row={row} />,
      },
    ],
    [],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={attempts}
      emptyMessage={emptyMessage}
      itemLabel="attempts"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1050}
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
