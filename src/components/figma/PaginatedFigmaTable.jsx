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
  getRowClassName,
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
  tableMinWidth = 0,
  bodyMaxHeight,
  headerVariant = 'default',
  headerAlign,
  tableLayoutFixed = false,
  /** { selectedIds, onToggle(id), onTogglePage(pageIds, select), getRowId? } */
  selection,
  /** Server-driven pagination — skips client-side slicing */
  controlledPagination,
  paginationClassName,
  gradientActivePage = false,
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
    const selectableIds = selection.allItemIds ?? pageIds
    const allSelected =
      selectableIds.length > 0 &&
      selectableIds.every((id) => selection.selectedIds.includes(id))
    const someSelected = selectableIds.some((id) => selection.selectedIds.includes(id))
    const dataColumns = columns.filter((col) => col.key !== '__select')

    return [
      {
        key: '__select',
        label: (
          <TableSelectionCheckbox
            variant="header"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => selection.onTogglePage?.(selectableIds, !allSelected)}
            aria-label="Select all"
          />
        ),
        headerTruncate: false,
        width: selection.columnWidth ?? 44,
        align: 'center',
        headerClassName: cn('text-center', selection.headerClassName),
        cellClassName: cn('text-center', selection.cellClassName),
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
      ...dataColumns,
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
        'w-full min-w-0 max-w-full rounded-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]',
        bodyMaxHeight && 'flex flex-col',
        className,
        'overflow-x-auto',
      )}
    >
      <FigmaTable
        columns={resolvedColumns}
        data={tableRows}
        emptyMessage={emptyMessage}
        emptyState={emptyState}
        rowClassName={rowClassName}
        getRowClassName={getRowClassName}
        density={density}
        className={cn(
          'min-h-0 shrink-0 rounded-none shadow-none',
          bodyMaxHeight && 'flex-1',
          tableClassName,
        )}
        zebraStriping={zebraStriping}
        loading={loading}
        skeletonRowCount={skeletonRowCount}
        stickyHeader={stickyHeader}
        stickyLastColumn={stickyLastColumn}
        animateRows={animateRows}
        onRowClick={onRowClick}
        tableMinWidth={tableMinWidth}
        bodyMaxHeight={bodyMaxHeight}
        headerVariant={headerVariant}
        headerAlign={headerAlign}
        tableLayoutFixed={tableLayoutFixed}
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
          className={cn('shrink-0 border-t border-[#E5E7EB] bg-white', paginationClassName)}
          gradientActivePage={gradientActivePage}
        />
      )}
    </div>
  )
}
