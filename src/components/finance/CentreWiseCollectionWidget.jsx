import { useMemo, useState } from 'react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'
import {
  buildCentreWiseCollection,
  formatPeriodLabel,
  parseDateInputValue,
  startOfDay,
  toDateInputValue,
} from '../../utils/dailyCollectionUtils'
import {
  financeCardShell,
  financeCardSubtitle,
  financeCardTitle,
  financeChartCardHeader,
} from './financeCardStyles'
import ProgramUnitPriceTable from './ProgramUnitPriceTable'
import TopPerformingComboTable from './TopPerformingComboTable'

const METRIC_COLUMNS = [
  { key: 'revenueAmount', label: 'Revenue Amount', format: (row) => formatINR(row.revenueAmount) },
  { key: 'collectionAmount', label: 'Collection Amount', format: (row) => formatINR(row.collectionAmount) },
  { key: 'collectedPct', label: 'Collected Amount %', format: (row) => `${row.collectedPct}%` },
]

const CARD_9_COLUMNS = [
  { key: 'label', label: 'Centre' },
  { key: 'revenueAmount', label: 'Revenue Amount', format: (row) => formatINR(row.revenueAmount) },
  { key: 'collectionAmount', label: 'Collection Amount', format: (row) => formatINR(row.collectionAmount) },
  { key: 'collectedPct', label: 'Collected Amount %', format: (row) => `${row.collectedPct}%` },
]

const DASHBOARD_CENTERS = [
  { centerName: 'Delhi Center' },
  { centerName: 'Hyderabad Center' },
  { centerName: 'Pune Center' },
]

const wireCell =
  'border border-slate-900 bg-white px-2 py-2 text-center text-xs font-medium text-slate-900 sm:px-3 sm:text-sm'
const wireHeadCell =
  'border border-slate-900 bg-white px-2 py-2 text-center text-xs font-semibold text-slate-900 sm:px-3 sm:text-sm'
const wireGroupHeadCell =
  'border border-slate-900 bg-white px-2 py-2 text-center text-xs font-bold uppercase text-slate-900 sm:text-sm'

function formatBarAmount(amount) {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`
  return String(amount)
}

function CentreWiseCollectionTable({ rows }) {
  return (
    <table className="w-full min-w-[640px] border-collapse border border-slate-900 bg-white text-sm">
      <thead>
        <tr>
          {rows.map((row) => (
            <th key={row.centerName} colSpan={METRIC_COLUMNS.length} className={wireGroupHeadCell}>
              {row.label}
            </th>
          ))}
        </tr>
        <tr>
          {rows.flatMap((row) =>
            METRIC_COLUMNS.map((col) => (
              <th key={`${row.centerName}-${col.key}`} className={wireHeadCell}>
                {col.label}
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        <tr>
          {rows.flatMap((row) =>
            METRIC_COLUMNS.map((col) => (
              <td key={`${row.centerName}-${col.key}-val`} className={wireCell}>
                {col.format(row)}
              </td>
            )),
          )}
        </tr>
      </tbody>
    </table>
  )
}

function CentreComparisonTable({ rows }) {
  return (
    <table className="w-full min-w-[480px] border-collapse border border-slate-900 bg-white text-sm">
      <thead>
        <tr>
          {CARD_9_COLUMNS.map((col) => (
            <th key={col.key} className={wireHeadCell}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`compare-${row.centerName}`}>
            {CARD_9_COLUMNS.map((col) => (
              <td
                key={`${row.centerName}-${col.key}`}
                className={cn(wireCell, col.key === 'label' && 'text-left font-semibold')}
              >
                {col.format ? col.format(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CenterRevenueVsCollectionBarChart({ rows }) {
  const max = Math.max(...rows.flatMap((row) => [row.revenueAmount, row.collectionAmount]), 1)

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#686868]">
        Bar graph — Revenue vs Collection by centre
      </p>
      <div className="flex h-40 items-end justify-between gap-3 sm:h-48 sm:gap-5">
        {rows.map((row) => (
          <div key={row.centerName} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-1.5 sm:gap-2">
              <div className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold text-[#246392] sm:text-xs">
                  {formatBarAmount(row.revenueAmount)}
                </span>
                <div
                  className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-[#1a3a5c] to-[#246392] sm:max-w-[3rem]"
                  style={{ height: `${Math.max((row.revenueAmount / max) * 100, 6)}%` }}
                  title={`Revenue: ${formatINR(row.revenueAmount)}`}
                />
              </div>
              <div className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold text-[#69df66] sm:text-xs">
                  {formatBarAmount(row.collectionAmount)}
                </span>
                <div
                  className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-[#4fbf4c] to-[#69df66] sm:max-w-[3rem]"
                  style={{ height: `${Math.max((row.collectionAmount / max) * 100, 6)}%` }}
                  title={`Collection: ${formatINR(row.collectionAmount)}`}
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-[#686868]">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs font-medium text-[#686868]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#246392]" aria-hidden="true" />
          Revenue Amount
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#69df66]" aria-hidden="true" />
          Collection Amount
        </span>
      </div>
    </div>
  )
}

export default function CentreWiseCollectionWidget({ payments = [], loading, className }) {
  const [filterDate, setFilterDate] = useState(() => startOfDay(new Date()))

  const rows = useMemo(
    () => buildCentreWiseCollection(payments, DASHBOARD_CENTERS, filterDate),
    [payments, filterDate],
  )

  const dateLabel = formatPeriodLabel(filterDate, 'daily')

  return (
    <div className={cn(financeCardShell, className)}>
      <div className={financeChartCardHeader}>
        <h3 className={financeCardTitle}>Centre-wise Collection</h3>
        <p className={financeCardSubtitle}>Centre wise collection, filter date wise</p>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm font-semibold text-[#1a3a5c]">Filter</span>
            <input
              id="centre-collection-date"
              type="date"
              value={toDateInputValue(filterDate)}
              onChange={(e) => setFilterDate(parseDateInputValue(e.target.value))}
              className="h-9 rounded border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#246392] focus:ring-2 focus:ring-[#246392]/15"
            />
            <span className="text-sm font-medium text-[#246392]">{dateLabel}</span>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse rounded border border-slate-200 bg-slate-50" />
          ) : (
            <div className="overflow-x-auto">
              <CentreWiseCollectionTable rows={rows} />
            </div>
          )}
        </div>

        <section className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-bold text-[#1a3a5c]">Revenue vs Collection by centre</h4>
          <p className="mt-0.5 text-xs text-[#686868]">
            Bar graph presentation comparison of centre — Revenue v/s collection for {dateLabel}
          </p>

          {loading ? (
            <div className="mt-3 h-32 animate-pulse rounded border border-slate-200 bg-slate-50" />
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <CentreComparisonTable rows={rows} />
              </div>
              <CenterRevenueVsCollectionBarChart rows={rows} />
            </>
          )}
        </section>

        <section className="border-t border-slate-200 pt-6">
          <div className={cn(financeChartCardHeader, 'rounded-lg')}>
            <h4 className={financeCardTitle}>Program unit price — revenue vs collection by centre</h4>
            <p className={financeCardSubtitle}>
              All programs with course, delivery mode and centre-wise unit price for {dateLabel}
            </p>
          </div>
          <div className="mt-3">
            <ProgramUnitPriceTable payments={payments} filterDate={filterDate} />
          </div>
        </section>

        <TopPerformingComboTable payments={payments} loading={loading} />
      </div>
    </div>
  )
}
