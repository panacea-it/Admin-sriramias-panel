import { cn } from '../../utils/cn'

const DENSITY = {
  default: {
    header: 'h-12 min-h-[48px] text-sm font-semibold sm:text-base lg:text-lg',
    row: 'min-h-[60px] text-sm font-medium sm:text-base',
    cell: 'px-4 py-3 sm:px-6',
  },
  comfortable: {
    header: 'h-11 min-h-[44px] text-sm font-semibold',
    row: 'min-h-[52px] text-sm font-medium',
    cell: 'px-4 py-2.5 align-middle sm:px-5',
  },
  compact: {
    header: 'h-10 min-h-[40px] text-xs font-semibold sm:text-sm',
    row: 'min-h-[44px] text-sm font-medium',
    cell: 'px-3 py-2 align-middle sm:px-4',
  },
  helpdesk: {
    header: 'h-12 min-h-[48px] text-sm font-semibold',
    row: 'min-h-[72px] text-sm font-medium',
    cell: 'px-5 py-3.5 align-middle sm:px-6',
  },
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function TableSkeleton({ columns, rowCount, density }) {
  const d = DENSITY[density] ?? DENSITY.default
  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIdx) => (
        <tr
          key={`sk-${rowIdx}`}
          className={cn(
            'border-b border-slate-100/90 animate-pulse',
            d.row,
            rowIdx % 2 === 1 && 'bg-slate-50/80',
          )}
        >
          {columns.map((col) => (
            <td key={col.key} className={cn('first:pl-6 sm:first:pl-8', d.cell, col.cellClassName)}>
              <div
                className={cn(
                  'h-3.5 rounded bg-slate-200/80',
                  col.align === 'right' && 'ml-auto w-16',
                  col.align === 'center' && 'mx-auto w-20',
                  (!col.align || col.align === 'left') && 'w-3/4 max-w-[140px]',
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function FigmaTable({
  columns,
  data,
  emptyMessage = 'No records found.',
  emptyState,
  className,
  rowClassName,
  density = 'default',
  zebraStriping = false,
  loading = false,
  skeletonRowCount = 6,
  stickyHeader = false,
  stickyLastColumn = false,
  animateRows = false,
  onRowClick,
  tableMinWidth = 720,
}) {
  const d = DENSITY[density] ?? DENSITY.default
  const lastColKey = columns[columns.length - 1]?.key

  const alignClass = (col) => ALIGN_CLASS[col.align || 'left']

  const stickyColClass = (col, isHeader) =>
    stickyLastColumn &&
    col.key === lastColKey &&
    cn(
      'sticky right-0 z-[2] shadow-[-4px_0_8px_rgba(15,23,42,0.06)]',
      isHeader ? 'bg-[#3d8fc4]' : 'bg-inherit',
    )

  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-t-md bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div style={{ minWidth: tableMinWidth }}>
        <table className="w-full border-collapse">
          <thead
            className={cn(
              stickyHeader && 'sticky top-0 z-20 shadow-[0_2px_8px_rgba(15,23,42,0.12)]',
            )}
          >
            <tr
              className={cn(
                'bg-gradient-to-r from-[#55ace7] to-[#246392] leading-none text-white',
                d.header,
              )}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap align-middle first:pl-6 sm:first:pl-8',
                    d.cell,
                    alignClass(col),
                    col.headerClassName,
                    stickyColClass(col, true),
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <TableSkeleton columns={columns} rowCount={skeletonRowCount} density={density} />
            )}
            {!loading &&
              data.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className={cn(
                    'border-b border-slate-100/90 text-[#111111] transition-colors duration-200 last:border-0',
                    'hover:bg-[#eef6fc]/70',
                    d.row,
                    zebraStriping && (idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f8fc]'),
                    animateRows && 'animate-[fadeInRow_0.35s_ease-out_both]',
                    onRowClick && 'cursor-pointer',
                    rowClassName,
                  )}
                  style={animateRows ? { animationDelay: `${Math.min(idx, 12) * 40}ms` } : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'align-middle first:pl-6 sm:first:pl-8',
                        d.cell,
                        alignClass(col),
                        col.cellClassName,
                        stickyColClass(col, false),
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && data.length === 0 &&
          (emptyState ?? (
            <p className="py-8 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
          ))}
      </div>
    </div>
  )
}
