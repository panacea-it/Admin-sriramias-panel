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
        'border-b border-slate-100/90 text-[#111111] min-h-[44px] text-sm font-medium',
        'hover:bg-[#eef6fc]/70',
        rowClassName?.(row),
        isDragging && 'z-10 bg-white opacity-95 shadow-lg ring-2 ring-[#55ace7]/40',
      )}
    >
      <td className="w-[4.5rem] px-2 py-2 align-middle sm:px-3">
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
          className={cn('px-3 py-2 align-middle sm:px-4 first:pl-2', col.cellClassName)}
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
      },
      ...columns,
    ],
    [columns],
  )

  const handlePageChange = (nextPage) => {
    pagination.setPage(nextPage)
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div
      ref={tableRef}
      className={cn(
        'overflow-hidden rounded-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="w-full overflow-x-auto rounded-t-md">
        <div style={{ minWidth: 800 }}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="h-10 min-h-[40px] bg-gradient-to-r from-[#55ace7] to-[#246392] text-xs font-semibold text-white sm:text-sm">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-3 py-2 text-left align-middle first:pl-4 sm:px-4',
                      col.headerClassName,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {pagination.paginatedItems.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      rowId={row.id}
                      columns={columns}
                      rowClassName={getRowClassName}
                      renderPriorityDrag={renderPriorityDrag}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
          {data.length === 0 && (
            <p className="py-8 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
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
        />
      )}
    </div>
  )
}
