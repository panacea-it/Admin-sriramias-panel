import { useRef } from 'react'
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
  payment: {
    header: 'h-14 min-h-[56px] text-base font-bold',
    row: 'min-h-[56px] text-sm',
    cell: 'px-5 py-4 align-middle',
  },
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const PREMIUM_HEADER_BG = 'bg-gradient-to-r from-[#58A8DF] to-[#1F5E99]'
const ADMIN_HEADER_BG = 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'
const DEFAULT_HEADER_BG = 'bg-[#55ace7]'

const HEADER_BAR_HEIGHT = {
  default: 48,
  comfortable: 44,
  compact: 40,
  helpdesk: 48,
  payment: 56,
}

function resolveColumnWidthPx(width) {
  if (typeof width === 'number' && width > 0) return width
  if (typeof width === 'string' && /^\d+px$/.test(width)) return parseInt(width, 10)
  return null
}

function colWidthStyle(width) {
  if (typeof width === 'number') return { width: `${width}px` }
  if (width) return { width }
  return undefined
}

function TableSkeleton({ columns, rowCount, density, showFillColumn = false }) {
  const d = DENSITY[density] ?? DENSITY.default
  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIdx) => (
        <tr
          key={`sk-${rowIdx}`}
          className={cn(
            'border-b border-[#E5E7EB] animate-pulse',
            d.row,
            rowIdx % 2 === 1 && 'bg-[#F8FBFF]',
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
          {showFillColumn ? <td className="w-full p-0" aria-hidden="true" data-fill-column /> : null}
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
  getRowClassName,
  density = 'default',
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
  fullWidth = false,
  /** When true, parent handles horizontal scroll (no nested overflow-x-auto) */
  suppressInnerScroll = false,
  /** Adds trailing column so header bg fills remaining width (body uses row bg) */
  headerFillColumn = false,
}) {
  const d = DENSITY[density] ?? DENSITY.default
  const lastColKey = columns[columns.length - 1]?.key
  const isPremium = headerVariant === 'premium'
  const isAdmin = headerVariant === 'admin'
  const headerBg = isPremium
    ? PREMIUM_HEADER_BG
    : isAdmin
      ? ADMIN_HEADER_BG
      : DEFAULT_HEADER_BG
  const containedScroll = stickyHeader && bodyMaxHeight
  const resolvedHeaderAlign = headerAlign || (isPremium ? 'center' : undefined)

  const headerScrollRef = useRef(null)
  const bodyScrollRef = useRef(null)

  const alignClass = (col, forHeader = false) => {
    if (forHeader && resolvedHeaderAlign) return ALIGN_CLASS[resolvedHeaderAlign]
    return ALIGN_CLASS[col.align || 'left']
  }

  const stickyColClass = (col, isHeader, rowBg) =>
    stickyLastColumn &&
    !containedScroll &&
    col.key === lastColKey &&
    cn(
      'sticky right-0 z-[3] shadow-[-4px_0_8px_rgba(15,23,42,0.06)]',
      isHeader ? cn(headerBg, 'z-[21]') : rowBg || 'bg-inherit',
    )

  const headerStickyClass = (col) =>
    stickyHeader &&
    !containedScroll &&
    cn(
      'sticky top-0 z-20',
      headerBg,
      isPremium && 'shadow-[0_4px_12px_rgba(31,94,153,0.2)]',
      !isPremium && 'shadow-[0_2px_8px_rgba(15,23,42,0.12)]',
      stickyColClass(col, true),
    )

  const syncBodyScroll = (e) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const fixedTableWidth = columns.reduce(
    (sum, col) => sum + (resolveColumnWidthPx(col.width) || 0),
    0,
  )

  const hasPercentageWidths = columns.some(
    (col) => typeof col.width === 'string' && String(col.width).includes('%'),
  )

  const useFullWidthLayout = tableLayoutFixed && fullWidth
  const showFillColumn =
    headerFillColumn || (useFullWidthLayout && !hasPercentageWidths)

  const stretchMinWidth =
    tableMinWidth > 0 ? `max(100%, ${tableMinWidth}px)` : '100%'

  const resolvedTableMinWidth = showFillColumn
    ? stretchMinWidth
    : tableMinWidth > 0
      ? tableMinWidth
      : 0

  const tableStyle = tableLayoutFixed
    ? showFillColumn || hasPercentageWidths || fixedTableWidth <= 0 || useFullWidthLayout
      ? { width: '100%', maxWidth: '100%', minWidth: resolvedTableMinWidth }
      : { width: fixedTableWidth, minWidth: fixedTableWidth }
    : {
        width: '100%',
        maxWidth: '100%',
        minWidth: resolvedTableMinWidth,
      }

  const tableWrapperStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: showFillColumn ? stretchMinWidth : tableLayoutFixed && tableMinWidth > 0 ? tableMinWidth : 0,
  }

  const colGroup = (
    <colgroup>
      {columns.map((col) => (
        <col key={col.key} style={colWidthStyle(col.width)} />
      ))}
      {showFillColumn ? <col key="__fill" /> : null}
    </colgroup>
  )

  const cellOverflowClass = containedScroll ? 'overflow-hidden' : undefined

  const headerRow = (
    <tr
      className={cn(
        'font-bold leading-none text-white',
        isPremium && 'rounded-t-[10px]',
        d.header,
      )}
    >
      {columns.map((col) => (
        <th
          key={col.key}
          className={cn(
            'relative z-[1] align-middle first:pl-6 sm:first:pl-8',
            d.cell,
            alignClass(col, true),
            col.headerClassName,
            headerBg,
            headerStickyClass(col),
            containedScroll && isPremium && 'shadow-[0_4px_12px_rgba(31,94,153,0.15)]',
            cellOverflowClass,
          )}
        >
          <span className={cn('block', col.headerTruncate !== false && 'truncate')}>
            {col.label}
          </span>
        </th>
      ))}
      {showFillColumn ? (
        <th
          className={cn('relative z-[1] w-full p-0', d.header, headerBg, cellOverflowClass)}
          aria-hidden="true"
          data-fill-column
        />
      ) : null}
    </tr>
  )

  const bodyRows =
    !loading &&
    data.map((row, idx) => {
      const customRowClass = getRowClassName?.(row)
      const rowBg = customRowClass
        ? undefined
        : zebraStriping
          ? idx % 2 === 0
            ? 'bg-white'
            : 'bg-[#F8FBFF]'
          : 'bg-white'

      return (
        <tr
          key={row.id ?? idx}
          className={cn(
            'border-b border-[#E5E7EB] text-[#111111] transition-colors duration-200 last:border-0',
            'hover:bg-[#EAF4FD]',
            d.row,
            rowBg,
            animateRows && 'animate-[fadeInRow_0.35s_ease-out_both]',
            onRowClick && 'cursor-pointer',
            typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
            customRowClass,
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
                stickyColClass(col, false, rowBg),
                cellOverflowClass,
              )}
            >
              {col.render ? col.render(row) : row[col.key]}
            </td>
          ))}
          {showFillColumn ? (
            <td className={cn('w-full p-0', rowBg)} aria-hidden="true" data-fill-column />
          ) : null}
        </tr>
      )
    })

  if (containedScroll) {
    return (
      <div className={cn('flex w-full min-h-0 flex-col bg-white', className)}>
        <div
          ref={headerScrollRef}
          className="shrink-0 overflow-x-hidden overflow-y-hidden"
          aria-hidden="true"
        >
          <table
            className={cn(
              'w-full border-separate border-spacing-0',
              tableLayoutFixed && 'table-fixed',
            )}
            style={tableStyle}
          >
            {colGroup}
            <thead className={cn(headerBg, isPremium && 'rounded-t-[10px]')}>{headerRow}</thead>
          </table>
        </div>

        <div
          ref={bodyScrollRef}
          className="min-h-0 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          style={{ maxHeight: bodyMaxHeight }}
          onScroll={syncBodyScroll}
        >
          <table
            className={cn(
              'w-full border-separate border-spacing-0',
              tableLayoutFixed && 'table-fixed',
            )}
            style={tableStyle}
          >
            {colGroup}
            <tbody>
              {loading && data.length === 0 && (
                <TableSkeleton
                  columns={columns}
                  rowCount={skeletonRowCount}
                  density={density}
                  showFillColumn={showFillColumn}
                />
              )}
              {bodyRows}
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

  return (
    <div
      className={cn(
        'w-full bg-white',
        showFillColumn ? 'min-w-full' : 'min-w-0',
        !containedScroll && !suppressInnerScroll && 'overflow-x-auto',
        className,
      )}
    >
      <div className="relative w-full min-w-full" style={tableWrapperStyle}>
        <table
          className={cn(
            'relative z-[1] w-full min-w-full border-collapse border-spacing-0',
            tableLayoutFixed && 'table-fixed',
          )}
          style={tableStyle}
        >
          {colGroup}
          <thead
            className={cn(
              headerBg,
              isPremium && 'rounded-t-[10px]',
            )}
          >
            {headerRow}
          </thead>
          <tbody>
            {loading && data.length === 0 && (
              <TableSkeleton
                columns={columns}
                rowCount={skeletonRowCount}
                density={density}
                showFillColumn={showFillColumn}
              />
            )}
            {bodyRows}
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
