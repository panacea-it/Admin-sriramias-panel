import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { formatINR } from '../../utils/financeFilters'
import { buildProgramUnitPriceTable } from '../../utils/financeProgramUnitPrice'
import { cn } from '../../utils/cn'
import {
  financeChartTableGroupHeadCell,
  financeChartTablePanel,
  financeTableHeadCell,
} from './financeCardStyles'

const bodyCell = 'border border-slate-200/80 bg-white px-2 py-2 text-sm'
const bodyCellMuted = 'border border-slate-200/80 bg-white px-2 py-2 text-sm text-[#686868]'

const LEFT_COLUMN_COUNT = 6
const COLUMNS_PER_CENTRE = 4
const COLLAPSED_MAX_HEIGHT_PX = 260
const COLLAPSED_ROW_LIMIT = 5

function formatAmount(value) {
  if (value == null || value === '') return '—'
  return formatINR(value)
}

function CenterCells({ cell }) {
  if (!cell?.available) {
    return (
      <>
        <td className={cn(bodyCellMuted, 'text-center')}>—</td>
        <td className={cn(bodyCellMuted, 'text-center')}>—</td>
        <td className={cn(bodyCellMuted, 'text-center')}>—</td>
        <td className={cn(bodyCellMuted, 'text-center')}>—</td>
      </>
    )
  }

  return (
    <>
      <td className={cn(bodyCell, 'text-center font-medium text-[#1a3a5c]')}>Yes</td>
      <td className={cn(bodyCell, 'text-center font-semibold text-[#246392]')}>
        {formatAmount(cell.revenueAmount)}
      </td>
      <td className={cn(bodyCell, 'text-center font-semibold text-[#1a3a5c]')}>
        {formatAmount(cell.collectionAmount)}
      </td>
      <td className={cn(bodyCell, 'text-center font-bold text-[#246392]')}>
        {cell.collectedPct == null ? '—' : `${cell.collectedPct}%`}
      </td>
    </>
  )
}

function trimProgramToRowLimit(program, rowLimit) {
  if (program.rowSpan <= rowLimit) return program

  let remaining = rowLimit
  const courses = []

  for (const course of program.courses) {
    if (remaining <= 0) break
    if (course.rowSpan <= remaining) {
      courses.push(course)
      remaining -= course.rowSpan
      continue
    }

    courses.push({
      ...course,
      rowSpan: remaining,
      rows: course.rows.slice(0, remaining),
    })
    remaining = 0
  }

  const rowSpan = courses.reduce((sum, course) => sum + course.rowSpan, 0)
  return { ...program, courses, rowSpan, isPartial: true }
}

function getVisiblePrograms(programs, expanded) {
  if (expanded) return { items: programs, isPartial: false }

  let rowBudget = COLLAPSED_ROW_LIMIT
  const items = []

  for (const program of programs) {
    if (rowBudget <= 0) break

    if (program.rowSpan <= rowBudget) {
      items.push(program)
      rowBudget -= program.rowSpan
      continue
    }

    items.push(trimProgramToRowLimit(program, rowBudget))
    return { items, isPartial: true }
  }

  return { items, isPartial: programs.length > items.length }
}

export default function ProgramUnitPriceTable({ payments = [], filterDate, className }) {
  const [expanded, setExpanded] = useState(false)
  const { programs, centers, formatPct } = useMemo(
    () => buildProgramUnitPriceTable(payments, filterDate),
    [payments, filterDate],
  )

  const totalRows = useMemo(
    () => programs.reduce((sum, program) => sum + program.rowSpan, 0),
    [programs],
  )
  const { items: visiblePrograms, isPartial } = useMemo(
    () => getVisiblePrograms(programs, expanded),
    [programs, expanded],
  )
  const visibleRowCount = visiblePrograms.reduce((sum, program) => sum + program.rowSpan, 0)
  const hiddenRowCount = Math.max(0, totalRows - visibleRowCount)
  const showToggle = totalRows > COLLAPSED_ROW_LIMIT

  const centreColumnCount = centers.length * COLUMNS_PER_CENTRE

  return (
    <div className={cn(financeChartTablePanel, className)}>
      <div className="relative">
        <div
          className={cn('overflow-x-auto overflow-y-auto')}
          style={!expanded && showToggle ? { maxHeight: `${COLLAPSED_MAX_HEIGHT_PX}px` } : undefined}
        >
        <table className="min-w-[1100px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th colSpan={LEFT_COLUMN_COUNT} rowSpan={2} className={financeChartTableGroupHeadCell}>
                Unit Price
              </th>
              <th colSpan={centreColumnCount} className={financeChartTableGroupHeadCell}>
                Centre
              </th>
            </tr>
            <tr>
              {centers.map((center) => (
                <th key={center.key} colSpan={COLUMNS_PER_CENTRE} className={financeChartTableGroupHeadCell}>
                  {center.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className={financeTableHeadCell}>Program Name</th>
              <th className={financeTableHeadCell}>Revenue Amount</th>
              <th className={financeTableHeadCell}>Collection Amount</th>
              <th className={financeTableHeadCell}>%</th>
              <th className={financeTableHeadCell}>Course Name</th>
              <th className={financeTableHeadCell}>Delivery Mode</th>
              {centers.flatMap((center) => [
                <th key={`${center.key}-avail`} className={financeTableHeadCell}>
                  Available
                </th>,
                <th key={`${center.key}-rev`} className={financeTableHeadCell}>
                  Revenue Amount
                </th>,
                <th key={`${center.key}-col`} className={financeTableHeadCell}>
                  Collection Amount
                </th>,
                <th key={`${center.key}-pct`} className={financeTableHeadCell}>
                  %
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {visiblePrograms.map((program) =>
              program.courses.map((course, courseIndex) =>
                course.rows.map((row, modeIndex) => {
                  const isFirstProgramRow = courseIndex === 0 && modeIndex === 0
                  const isFirstCourseRow = modeIndex === 0
                  const rowKey = `${program.programName}-${course.courseName}-${row.deliveryMode}`

                  return (
                    <tr key={rowKey}>
                      {isFirstProgramRow && (
                        <>
                          <td
                            rowSpan={program.rowSpan}
                            className={cn(
                              bodyCell,
                              'px-3 align-top text-left font-bold text-[#1a3a5c]',
                            )}
                          >
                            {program.programName}
                          </td>
                          <td
                            rowSpan={program.rowSpan}
                            className={cn(bodyCell, 'align-top text-center font-semibold text-[#246392]')}
                          >
                            {formatAmount(program.revenueAmount)}
                          </td>
                          <td
                            rowSpan={program.rowSpan}
                            className={cn(bodyCell, 'align-top text-center font-semibold text-[#1a3a5c]')}
                          >
                            {formatAmount(program.collectionAmount)}
                          </td>
                          <td
                            rowSpan={program.rowSpan}
                            className={cn(bodyCell, 'align-top text-center font-bold text-[#246392]')}
                          >
                            {formatPct(program.collectedPct)}
                          </td>
                        </>
                      )}
                      {isFirstCourseRow && (
                        <td
                          rowSpan={course.rowSpan}
                          className={cn(bodyCell, 'px-3 align-top text-left font-medium text-[#1a3a5c]')}
                        >
                          {course.courseName}
                        </td>
                      )}
                      <td className={cn(bodyCell, 'text-center text-[#444]')}>{row.deliveryMode}</td>
                      {centers.map((center) => (
                        <CenterCells key={`${rowKey}-${center.key}`} cell={row.centers[center.key]} />
                      ))}
                    </tr>
                  )
                }),
              ),
            )}
          </tbody>
        </table>
        </div>
        {!expanded && showToggle && isPartial && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/95 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {showToggle && (
        <div className="flex justify-center border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#246392] transition hover:text-[#1a4d73]"
          >
            {expanded ? (
              <>
                View less
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                View more
                {hiddenRowCount > 0 && (
                  <span className="font-medium text-[#686868]">({hiddenRowCount} more rows)</span>
                )}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
