import { useMemo, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePagination } from '../../hooks/usePagination'
import TablePagination from '../figma/TablePagination'

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
  '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
  '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm',
  '[&_tbody_td]:align-middle',
)

function SortableRow({ row, rowId, columns, rowClassName, renderPriorityDrag }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b border-[#E5E7EB] text-[#111111] min-h-[52px] text-sm font-medium',
        'transition-colors duration-200 hover:bg-[#eef6fc]/70',
        rowClassName?.(row),
        isDragging && 'z-10 bg-white opacity-95 shadow-lg ring-2 ring-[#55ace7]/40',
      )}
    >
      <td className="w-[4.5rem] px-3 py-2.5 align-middle sm:px-4">
        <div className="flex items-center gap-0.5">
          {renderPriorityDrag?.(row)}
          <button
            type="button"
            className="cursor-grab rounded p-1 text-[#9ca0a8] hover:bg-[#eef6fc] hover:text-[#246392] active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
      {columns.map((col) => (
        <td
          key={col.key}
          className={cn('px-3 py-2.5 align-middle sm:px-4', col.cellClassName)}
          style={col.width ? { width: `${col.width}px` } : undefined}
        >
          {col.render ? col.render(row) : row[col.key]}
        </td>
      ))}
    </tr>
  )
}

export default function YoutubeSortablePaginatedTable({
  columns,
  data,
  onReorder,
  emptyMessage = 'No records found.',
  itemLabel = 'videos',
  initialPageSize = 6,
  resetDeps = [],
  className,
  getRowClassName,
  renderPriorityDrag,
  tableMinWidth,
}) {
  const tableRef = useRef(null)
  const pagination = usePagination(data, { initialPageSize, resetDeps })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const pageIds = useMemo(
    () => pagination.paginatedItems.map((r) => r.id),
    [pagination.paginatedItems],
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return
    const localOld = pageIds.indexOf(active.id)
    const localNew = pageIds.indexOf(over.id)
    if (localOld < 0 || localNew < 0) return
    const globalOld = pagination.startIndex + localOld
    const globalNew = pagination.startIndex + localNew
    const rowA = data[globalOld]
    const rowB = data[globalNew]
    const rankA = rowA?.priorityOrder ?? null
    const rankB = rowB?.priorityOrder ?? null
    if (rankA !== rankB) return
    const reordered = arrayMove(data, globalOld, globalNew)
    onReorder(reordered.map((r) => r.id))
  }

  const allColumns = useMemo(
    () => [
      {
        key: '__drag',
        label: '',
        headerClassName: 'w-[4.5rem]',
        cellClassName: 'w-[4.5rem]',
        width: 72,
      },
      ...columns,
    ],
    [columns],
  )

  const resolvedMinWidth = useMemo(
    () => tableMinWidth ?? allColumns.reduce((sum, col) => sum + (col.width || 120), 0),
    [allColumns, tableMinWidth],
  )

  const handlePageChange = (nextPage) => {
    pagination.setPage(nextPage)
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div
      ref={tableRef}
      className={cn(
        'w-full max-w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className={cn('w-full overflow-x-auto', TABLE_CLASS)}>
        <div style={{ minWidth: resolvedMinWidth }}>
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="h-11 min-h-[44px]">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-left align-middle first:pl-4 sm:px-4',
                      col.headerClassName,
                    )}
                    style={col.width ? { width: `${col.width}px` } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {pagination.paginatedItems.map((row, idx) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      rowId={row.id}
                      columns={columns}
                      rowClassName={(r) =>
                        cn(
                          getRowClassName?.(r),
                          idx % 2 === 1 && 'bg-[#F8FBFF]',
                        )
                      }
                      renderPriorityDrag={renderPriorityDrag}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
          {data.length === 0 && (
            <p className="py-10 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
          )}
        </div>
      </div>
      {data.length > 0 && (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={pagination.setPageSize}
          itemLabel={itemLabel}
          className="shrink-0 border-t border-[#E5E7EB] bg-white"
          gradientActivePage
        />
      )}
    </div>
  )
}
