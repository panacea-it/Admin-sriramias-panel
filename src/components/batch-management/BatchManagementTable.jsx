import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { StatusBadge } from '../academics/AcademicsUi'
import BatchTableActions from './BatchTableActions'
import { formatBatchDate } from '../../data/batchManagementData'
import { batchDetailsPath } from '../../constants/batchNav'
import { cn } from '../../utils/cn'

const OVERFLOW_CELL = 'min-w-0 max-w-0 overflow-hidden align-middle'

const linkClassName =
  'font-semibold text-[#246392] underline-offset-2 transition hover:text-[#1a3a5c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 rounded'

function CellWrap({ children, className }) {
  return <div className={cn('w-full min-w-0 overflow-hidden', className)}>{children}</div>
}

function CellText({ children, className, title }) {
  return (
    <span
      className={cn('block truncate', className)}
      title={title || (typeof children === 'string' ? children : undefined)}
    >
      {children}
    </span>
  )
}

export default function BatchManagementTable({
  batches,
  onEditBatch,
  onQuickViewBatch,
  onDeleteBatch,
  listState,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  resetDeps = [],
  onStatusToggle,
  statusUpdatingIds,
  onDuplicate,
  loading = false,
  emptyMessage = 'No batches found.',
  selectedIds = [],
  onToggleSelect,
  onToggleSelectPage,
}) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + batches.length, totalItems || 0)

  const columns = useMemo(
    () => [
      {
        key: 'batchId',
        label: 'Batch ID',
        width: '8%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (batch) => {
          const detailsPath = batchDetailsPath(batch)
          const linkState = {
            ...(listState ? { listState } : {}),
            ...(batch.apiRow ? { batchRow: batch.apiRow } : {}),
          }
          const hasLinkState = Object.keys(linkState).length > 0 ? linkState : undefined
          const batchIdLabel = batch.displayBatchId || batch.batchId || '—'
          return (
            <CellWrap>
              <Link
                to={detailsPath}
                state={hasLinkState}
                className={cn(linkClassName, 'block min-w-0 truncate font-mono text-xs font-bold tracking-tight text-[#1a3a5c]')}
                title={batchIdLabel}
              >
                {batchIdLabel}
              </Link>
            </CellWrap>
          )
        },
      },
      {
        key: 'batchName',
        label: 'Batch Name',
        width: '16%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (batch) => {
          const detailsPath = batchDetailsPath(batch)
          const linkState = {
            ...(listState ? { listState } : {}),
            ...(batch.apiRow ? { batchRow: batch.apiRow } : {}),
          }
          const hasLinkState = Object.keys(linkState).length > 0 ? linkState : undefined
          const batchNameLabel = batch.batchName || batch.batchLabel || '—'
          return (
            <CellWrap>
              <Link
                to={detailsPath}
                state={hasLinkState}
                className={cn(linkClassName, 'block min-w-0')}
                title={batchNameLabel}
              >
                <CellText className="text-sm font-semibold text-[#111]" title={batchNameLabel}>
                  {batchNameLabel}
                </CellText>
              </Link>
              {batch.mergedIntoName && (
                <p
                  className="mt-0.5 truncate text-xs font-medium text-slate-500"
                  title={batch.mergedIntoName}
                >
                  Merged Into: {batch.mergedIntoName}
                </p>
              )}
            </CellWrap>
          )
        },
      },
      {
        key: 'mentor',
        label: 'Mentor Name',
        width: '14%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (batch) => {
          const mentorLabel = batch.mentorName || '—'
          return (
            <CellWrap>
              <CellText className="text-sm font-medium text-[#686868]" title={mentorLabel}>
                {mentorLabel}
              </CellText>
            </CellWrap>
          )
        },
      },
      {
        key: 'startDate',
        label: 'Start Date',
        width: '10%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (batch) => (
          <CellWrap>
            <span className="block truncate whitespace-nowrap text-sm text-[#444]">
              {formatBatchDate(batch.startDate)}
            </span>
          </CellWrap>
        ),
      },
      {
        key: 'endDate',
        label: 'End Date',
        width: '10%',
        headerClassName: OVERFLOW_CELL,
        cellClassName: OVERFLOW_CELL,
        render: (batch) => (
          <CellWrap>
            <span className="block truncate whitespace-nowrap text-sm text-[#444]">
              {formatBatchDate(batch.endDate)}
            </span>
          </CellWrap>
        ),
      },
      {
        key: 'students',
        label: 'Students',
        width: '8%',
        align: 'center',
        headerClassName: cn(OVERFLOW_CELL, 'text-center'),
        cellClassName: cn(OVERFLOW_CELL, 'text-center'),
        render: (batch) => {
          const detailsPath = batchDetailsPath(batch)
          const linkState = {
            ...(listState ? { listState } : {}),
            ...(batch.apiRow ? { batchRow: batch.apiRow } : {}),
          }
          const hasLinkState = Object.keys(linkState).length > 0 ? linkState : undefined
          const batchNameLabel = batch.batchName || batch.batchLabel || '—'
          return (
            <div className="flex items-center justify-center">
              <Link
                to={detailsPath}
                state={hasLinkState}
                className="inline-flex h-9 min-w-[3.25rem] items-center justify-center gap-1.5 rounded-[9px] bg-slate-100 px-3 text-sm font-bold text-[#246392] transition hover:bg-[#eef6fc]"
                title={`View students for ${batchNameLabel}`}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                {batch.totalStudents}
              </Link>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '9%',
        align: 'center',
        headerClassName: cn(OVERFLOW_CELL, 'text-center'),
        cellClassName: cn(OVERFLOW_CELL, 'text-center'),
        render: (batch) => (
          <div className="flex w-full items-center justify-center">
            <StatusBadge status={batch.status} />
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        width: 520,
        align: 'center',
        headerClassName: 'min-w-[520px] whitespace-nowrap align-middle text-center px-2 sm:px-3',
        cellClassName: 'min-w-[520px] whitespace-nowrap align-middle text-center px-2 sm:px-3',
        headerTruncate: false,
        render: (batch) => (
          <BatchTableActions
            batch={batch}
            onView={() => onQuickViewBatch?.(batch)}
            onEdit={() => onEditBatch?.(batch)}
            onDuplicate={() => onDuplicate?.(batch)}
            onStatusToggle={() => onStatusToggle?.(batch)}
            onDelete={() => onDeleteBatch?.(batch)}
            disabled={statusUpdatingIds?.has(String(batch.id))}
          />
        ),
      },
    ],
    [
      listState,
      onDeleteBatch,
      onDuplicate,
      onEditBatch,
      onQuickViewBatch,
      onStatusToggle,
      statusUpdatingIds,
    ],
  )

  const selection =
    onToggleSelect && onToggleSelectPage
      ? {
          selectedIds,
          onToggle: onToggleSelect,
          onTogglePage: onToggleSelectPage,
          getRowId: (row) => String(row.id),
          columnWidth: 44,
          headerClassName: 'w-11 min-w-[2.75rem] max-w-[2.75rem] px-2 text-center align-middle',
          cellClassName: 'w-11 min-w-[2.75rem] max-w-[2.75rem] px-2 text-center align-middle',
        }
      : undefined

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={batches}
      emptyMessage={emptyMessage}
      itemLabel="batches"
      resetDeps={resetDeps}
      loading={loading}
      rowClassName="hover:bg-[#eef6fc]/70"
      density="comfortable"
      skeletonRowCount={8}
      tableMinWidth={1680}
      tableLayoutFixed
      className="overflow-hidden rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
      tableClassName={cn(
        'rounded-none border-0 shadow-none',
        '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
        '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
        '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
        '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm',
        '[&_tbody_td]:align-middle',
      )}
      selection={selection}
      controlledPagination={{
        page: safePage,
        pageSize,
        totalItems: totalItems || 0,
        totalPages,
        startIndex,
        endIndex,
        onPageChange,
        onPageSizeChange,
      }}
      gradientActivePage
    />
  )
}
