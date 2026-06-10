import { useMemo, useRef } from 'react'
import { cn } from '../../utils/cn'
import { usePagination } from '../../hooks/usePagination'
import FigmaTable from './FigmaTable'
import TablePagination from './TablePagination'
import TableSelectionCheckbox from './TableSelectionCheckbox'

export default function PaginatedFigmaTable({
  columns,
  data,
  emptyMessage = 'No records found.',
  emptyState,
  className,
  rowClassName,
  itemLabel = 'records',
  initialPageSize = 10,
  resetDeps = [],
  tableRef: externalRef,
  density = 'default',
  tableClassName,
  zebraStriping = false,
  loading = false,
  skeletonRowCount = 6,
  stickyHeader = false,
  stickyLastColumn = false,
  animateRows = false,
  onRowClick,
  tableMinWidth = 720,
  /** { selectedIds, onToggle(id), onTogglePage(pageIds, select), getRowId? } */
  selection,
  /** Server-driven pagination — skips client-side slicing */
  controlledPagination,
}) {
  const internalRef = useRef(null)
  const tableRef = externalRef ?? internalRef

  const clientPagination = usePagination(data, { initialPageSize, resetDeps })
  const pagination = controlledPagination ?? clientPagination
  const tableRows = controlledPagination ? data : clientPagination.paginatedItems

  const resolvedColumns = useMemo(() => {
    if (!selection) return columns
    const getRowId = selection.getRowId ?? ((row) => row.id)
    const pageIds = tableRows.map((row) => getRowId(row))
    const allPageSelected =
      pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id))
    const somePageSelected = pageIds.some((id) => selection.selectedIds.includes(id))

    return [
      {
        key: '__select',
        label: (
          <TableSelectionCheckbox
            variant="header"
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => selection.onTogglePage?.(pageIds, !allPageSelected)}
            aria-label="Select all on this page"
          />
        ),
        headerClassName: 'w-10 pl-5 sm:pl-6',
        cellClassName: 'w-10 pl-5 sm:pl-6',
        render: (row) => {
          const id = getRowId(row)
          return (
            <TableSelectionCheckbox
              checked={selection.selectedIds.includes(id)}
              onChange={() => selection.onToggle?.(id)}
              aria-label={`Select row ${id}`}
            />
          )
        },
      },
      ...columns,
    ]
  }, [columns, selection, tableRows])

  const handlePageChange = (nextPage) => {
    if (controlledPagination) {
      controlledPagination.onPageChange?.(nextPage)
    } else {
      clientPagination.setPage(nextPage)
    }
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handlePageSizeChange = (nextSize) => {
    if (controlledPagination) {
      controlledPagination.onPageSizeChange?.(nextSize)
    } else {
      clientPagination.setPageSize(nextSize)
    }
  }

  const showPagination = controlledPagination
    ? !loading && controlledPagination.totalItems > 0
    : !loading && data.length > 0

  return (
    <div
      ref={tableRef}
      className={cn(
        'overflow-hidden rounded-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <FigmaTable
        columns={resolvedColumns}
        data={tableRows}
        emptyMessage={emptyMessage}
        emptyState={emptyState}
        rowClassName={rowClassName}
        density={density}
        className={cn('rounded-none shadow-none', tableClassName)}
        zebraStriping={zebraStriping}
        loading={loading}
        skeletonRowCount={skeletonRowCount}
        stickyHeader={stickyHeader}
        stickyLastColumn={stickyLastColumn}
        animateRows={animateRows}
        onRowClick={onRowClick}
        tableMinWidth={tableMinWidth}
      />
      {showPagination && (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemLabel={itemLabel}
        />
      )}
    </div>
  )
}
