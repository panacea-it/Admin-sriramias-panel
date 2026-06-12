import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import TablePagination from '../figma/TablePagination'
import BatchStatusSelector from './BatchStatusSelector'
import BatchTableActions from './BatchTableActions'
import { formatBatchDate } from '../../data/batchManagementData'
import { batchDetailsPath } from '../../constants/batchNav'
import { cn } from '../../utils/cn'

const linkClassName =
  'font-semibold text-[#246392] underline-offset-2 transition hover:text-[#1a3a5c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 rounded'

const thClass =
  'px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap sm:text-base'
const tdClass = 'px-4 py-4 align-middle text-sm text-[#444]'

function TruncatedText({ children, className }) {
  return (
    <span
      className={cn('block max-w-[220px] truncate', className)}
      title={typeof children === 'string' ? children : undefined}
    >
      {children}
    </span>
  )
}

export default function BatchManagementTable({
  batches,
  onEditBatch,
  onQuickViewBatch,
  listState,
  page: controlledPage,
  pageSize: controlledPageSize,
  totalItems: totalItemsProp,
  serverPaginated = false,
  onPageChange,
  onPageSizeChange,
  resetDeps = [],
  onStatusChange,
  onStatusToggle,
  statusUpdatingIds,
  onDuplicate,
}) {
  const isControlled =
    controlledPage != null &&
    controlledPageSize != null &&
    onPageChange &&
    onPageSizeChange

  const internalPagination = usePagination(batches, {
    initialPageSize: controlledPageSize ?? 10,
    resetDeps,
  })

  const page = isControlled ? controlledPage : internalPagination.page
  const pageSize = isControlled ? controlledPageSize : internalPagination.pageSize
  const totalItems = totalItemsProp ?? batches.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = serverPaginated
    ? Math.min(startIndex + batches.length, totalItems)
    : Math.min(startIndex + pageSize, totalItems)
  const paginatedItems = serverPaginated ? batches : batches.slice(startIndex, endIndex)

  const handlePageChange = (next) => {
    if (isControlled) onPageChange(next)
    else internalPagination.setPage(next)
  }

  const handlePageSizeChange = (size) => {
    if (isControlled) onPageSizeChange(size)
    else internalPagination.setPageSize(size)
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
      <div className="max-h-[min(70vh,720px)] overflow-auto overscroll-contain">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="sticky top-0 z-20 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-white">
              <th className={cn(thClass, 'min-w-[100px] sm:pl-6')}>Batch ID</th>
              <th className={cn(thClass, 'min-w-[200px]')}>Batch Name</th>
              <th className={cn(thClass, 'min-w-[160px]')}>Course Name</th>
              <th className={cn(thClass, 'min-w-[180px]')}>Mentor Name</th>
              <th className={cn(thClass, 'min-w-[110px]')}>Start Date</th>
              <th className={cn(thClass, 'min-w-[110px]')}>End Date</th>
              <th className={cn(thClass, 'min-w-[120px] text-center')}>Total Students</th>
              <th className={cn(thClass, 'min-w-[130px]')}>Status</th>
              <th className={cn(thClass, 'min-w-[240px] text-right sm:pr-6')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm font-medium text-slate-500">
                  No batches found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((batch) => (
                <BatchTableRow
                  key={batch.id}
                  batch={batch}
                  listState={listState}
                  onEditBatch={onEditBatch}
                  onQuickViewBatch={onQuickViewBatch}
                  onStatusChange={onStatusChange}
                  onStatusToggle={onStatusToggle}
                  statusUpdating={statusUpdatingIds?.has(String(batch.id))}
                  onDuplicate={onDuplicate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {batches.length > 0 && (
        <TablePagination
          page={safePage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="batches"
        />
      )}
    </div>
  )
}

function BatchTableRow({
  batch,
  listState,
  onEditBatch,
  onQuickViewBatch,
  onStatusChange,
  onStatusToggle,
  statusUpdating = false,
  onDuplicate,
}) {
  const detailsPath = batchDetailsPath(batch)
  const linkState = {
    ...(listState ? { listState } : {}),
    ...(batch.apiRow ? { batchRow: batch.apiRow } : {}),
  }
  const hasLinkState = Object.keys(linkState).length > 0 ? linkState : undefined

  return (
    <tr className="border-b border-slate-100 transition-colors duration-150 hover:bg-[#f8fbff]">
      <td className={cn(tdClass, 'sm:pl-6')}>
        <Link
          to={detailsPath}
          state={hasLinkState}
          className={cn(linkClassName, 'font-mono text-sm')}
          title={batch.batchId}
        >
          {batch.batchId}
        </Link>
      </td>
      <td className={tdClass}>
        <div className="min-w-0">
          <Link
            to={detailsPath}
            state={hasLinkState}
            className={linkClassName}
            title={batch.displayName}
          >
            <TruncatedText>{batch.displayName}</TruncatedText>
          </Link>
          {batch.mergedIntoName && (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500" title={batch.mergedIntoName}>
              Merged Into: {batch.mergedIntoName}
            </p>
          )}
        </div>
      </td>
      <td className={tdClass}>
        <TruncatedText className="font-medium">{batch.courseName}</TruncatedText>
      </td>
      <td className={tdClass}>
        <TruncatedText>{batch.mentorName}</TruncatedText>
      </td>
      <td className={cn(tdClass, 'whitespace-nowrap')}>{formatBatchDate(batch.startDate)}</td>
      <td className={cn(tdClass, 'whitespace-nowrap')}>{formatBatchDate(batch.endDate)}</td>
      <td className={cn(tdClass, 'text-center')}>
        <Link
          to={detailsPath}
          state={hasLinkState}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-[#246392] transition hover:bg-[#eef6fc]"
          title={`View students for ${batch.displayName}`}
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          {batch.totalStudents}
        </Link>
      </td>
      <td className={tdClass}>
        <BatchStatusSelector
          status={batch.status}
          disabled={statusUpdating}
          onStatusChange={(next) => onStatusChange?.(batch, next)}
        />
      </td>
      <td className={cn(tdClass, 'text-right sm:pr-6')}>
        <BatchTableActions
          batch={batch}
          onView={() => onQuickViewBatch?.(batch)}
          onEdit={() => onEditBatch?.(batch)}
          onDuplicate={() => onDuplicate?.(batch)}
          onStatusToggle={() => onStatusToggle?.(batch)}
        />
      </td>
    </tr>
  )
}
