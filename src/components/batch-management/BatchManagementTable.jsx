import { Link, useNavigate } from 'react-router-dom'
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

export default function BatchManagementTable({
  batches,
  onEditBatch,
  onQuickViewBatch,
  listState,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  resetDeps = [],
  onStatusChange,
  statusUpdatingIds,
  onDuplicate,
  onDelete,
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
  const totalItems = batches.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedItems = batches.slice(startIndex, endIndex)

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
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead className="sticky top-0 z-20 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
            <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-sm font-semibold text-white sm:text-base">
              <th className="px-4 py-3.5 sm:pl-6">Batch ID</th>
              <th className="px-4 py-3.5 sm:px-5">Batch Name</th>
              <th className="px-4 py-3.5">Course Name</th>
              <th className="px-4 py-3.5">Trainer Name</th>
              <th className="px-4 py-3.5">Start Date</th>
              <th className="px-4 py-3.5">End Date</th>
              <th className="px-4 py-3.5">Total Students</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right sm:pr-6">Actions</th>
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
                  statusUpdating={statusUpdatingIds?.has(String(batch.id))}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
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
  statusUpdating = false,
  onDuplicate,
  onDelete,
}) {
  const navigate = useNavigate()
  const detailsPath = batchDetailsPath(batch)
  const linkState = listState ? { listState } : undefined

  return (
    <tr className="border-b border-slate-100 transition-colors duration-150 hover:bg-[#f8fbff]">
      <td className="px-4 py-4 sm:pl-6">
        <Link
          to={detailsPath}
          state={linkState}
          className={cn(linkClassName, 'font-mono text-sm')}
        >
          {batch.batchId}
        </Link>
      </td>
      <td className="px-4 py-4 sm:px-5">
        <div>
          <Link to={detailsPath} state={linkState} className={linkClassName}>
            {batch.displayName}
          </Link>
          {batch.mergedIntoName && (
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Merged Into: {batch.mergedIntoName}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-[#444]">
        {batch.courseName}
      </td>
      <td className="px-4 py-4 text-sm text-[#444]">{batch.trainerName}</td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#444]">
        {formatBatchDate(batch.startDate)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#444]">
        {formatBatchDate(batch.endDate)}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-[#333]">
          <Users className="h-3.5 w-3.5 text-[#246392]" />
          {batch.totalStudents}
        </span>
      </td>
      <td className="px-4 py-4">
        <BatchStatusSelector
          status={batch.status}
          disabled={statusUpdating}
          onStatusChange={(next) => onStatusChange?.(batch, next)}
        />
      </td>
      <td className="px-4 py-4 text-right sm:pr-6">
        <BatchTableActions
          batch={batch}
          onViewDetails={() => navigate(detailsPath, { state: linkState })}
          onQuickView={() => onQuickViewBatch?.(batch)}
          onEdit={() => onEditBatch?.(batch)}
          onDuplicate={() => onDuplicate?.(batch)}
          onDelete={() => onDelete?.(batch)}
        />
      </td>
    </tr>
  )
}
