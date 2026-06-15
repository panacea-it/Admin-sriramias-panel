import { useEffect, useMemo, useState } from 'react'
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
  financeChartTableGroupHeadCell,
  financeTableHeadCell,
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

const comparisonTableBodyCell =
  'border border-[#D9E2EC] px-3 py-3.5 text-center text-sm transition-colors'

const ANALYTICS_CARD_ACCENTS = {
  revenue: 'from-[#4FA3D9] to-[#1F5E99]',
  collection: 'from-[#4fbf4c] to-[#2d9a4a]',
  average: 'from-[#8b5cf6] to-[#6d28d9]',
  topCentre: 'from-[#f59e0b] to-[#ea580c]',
}

function computeCentreAnalytics(rows) {
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueAmount, 0)
  const totalCollection = rows.reduce((sum, row) => sum + row.collectionAmount, 0)
  const avgCollectionPct = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.collectedPct, 0) / rows.length)
    : 0
  const overallCollectionPct =
    totalRevenue > 0
      ? Math.round((totalCollection / totalRevenue) * 100)
      : totalCollection > 0
        ? 100
        : 0
  const topCentre = rows.reduce(
    (best, row) => (row.collectionAmount > best.collectionAmount ? row : best),
    rows[0] || { label: '—', collectionAmount: 0 },
  )

  return {
    totalRevenue,
    totalCollection,
    avgCollectionPct,
    overallCollectionPct,
    topCentre,
  }
}

function isAllCentreDataZero(rows) {
  return rows.every((row) => row.revenueAmount === 0 && row.collectionAmount === 0)
}

const centreTableBodyCell =
  'border border-[#D9E2EC] bg-white px-3 py-3.5 text-center text-sm transition-colors group-hover:bg-[#EAF4FD]'

function formatBarAmount(amount) {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`
  return String(amount)
}

function CentreWiseCollectionTable({ rows }) {
  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              {rows.map((row) => (
                <th
                  key={row.centerName}
                  colSpan={METRIC_COLUMNS.length}
                  className={cn(financeChartTableGroupHeadCell, 'border-[#D9E2EC] px-4 py-3')}
                >
                  {row.label}
                </th>
              ))}
            </tr>
            <tr>
              {rows.flatMap((row) =>
                METRIC_COLUMNS.map((col) => (
                  <th
                    key={`${row.centerName}-${col.key}`}
                    className={cn(
                      financeTableHeadCell,
                      'border-[#D9E2EC] bg-[#EAF4FD] px-3 py-3 text-xs font-semibold text-[#1F5E99]',
                    )}
                  >
                    {col.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="group bg-[#FAFCFE] transition-colors hover:bg-[#EAF4FD]">
              {rows.flatMap((row) =>
                METRIC_COLUMNS.map((col) => (
                  <td
                    key={`${row.centerName}-${col.key}-val`}
                    className={cn(
                      centreTableBodyCell,
                      col.key === 'revenueAmount' && 'font-bold text-[#1a3a5c]',
                      col.key === 'collectionAmount' && 'font-bold text-[#1a3a5c]',
                      col.key === 'collectedPct' && 'font-semibold text-[#246392]',
                    )}
                  >
                    {col.format(row)}
                  </td>
                )),
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CentreAnalyticsSummaryCard({ label, value, accent, delay = 0 }) {
  return (
    <div
      className={cn(
        'rounded-[10px] bg-gradient-to-br p-4 text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5',
        accent,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-medium tracking-wide text-white/85">{label}</p>
      <p className="mt-1.5 truncate text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  )
}

function CentreAnalyticsSummaryCards({ analytics }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CentreAnalyticsSummaryCard
        label="Total Revenue"
        value={formatINR(analytics.totalRevenue)}
        accent={ANALYTICS_CARD_ACCENTS.revenue}
        delay={0}
      />
      <CentreAnalyticsSummaryCard
        label="Total Collection"
        value={formatINR(analytics.totalCollection)}
        accent={ANALYTICS_CARD_ACCENTS.collection}
        delay={50}
      />
      <CentreAnalyticsSummaryCard
        label="Average Collection %"
        value={`${analytics.avgCollectionPct}%`}
        accent={ANALYTICS_CARD_ACCENTS.average}
        delay={100}
      />
      <CentreAnalyticsSummaryCard
        label="Top Performing Centre"
        value={analytics.topCentre.label}
        accent={ANALYTICS_CARD_ACCENTS.topCentre}
        delay={150}
      />
    </div>
  )
}

function CentreComparisonTable({ rows }) {
  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse overflow-hidden rounded-lg text-sm">
          <thead>
            <tr>
              <th
                colSpan={CARD_9_COLUMNS.length}
                className={cn(financeChartTableGroupHeadCell, 'border-[#D9E2EC] px-4 py-3')}
              >
                Revenue vs Collection by centre
              </th>
            </tr>
            <tr>
              {CARD_9_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    financeTableHeadCell,
                    'border-[#D9E2EC] bg-[#EAF4FD] px-3 py-3 text-xs font-semibold text-[#1F5E99]',
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`compare-${row.centerName}`}
                className={cn(
                  'group transition-colors hover:bg-[#EAF4FD]',
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFE]',
                )}
              >
                {CARD_9_COLUMNS.map((col) => (
                  <td
                    key={`${row.centerName}-${col.key}`}
                    className={cn(
                      comparisonTableBodyCell,
                      'group-hover:bg-[#EAF4FD]',
                      col.key === 'label' && 'text-left font-semibold text-[#1a3a5c]',
                      col.key === 'revenueAmount' && 'font-bold text-[#1a3a5c]',
                      col.key === 'collectionAmount' && 'font-bold text-[#2d9a4a]',
                      col.key === 'collectedPct' && 'font-semibold text-[#246392]',
                    )}
                  >
                    {col.format ? col.format(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CenterRevenueVsCollectionBarChart({ rows, allZero }) {
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...rows.flatMap((row) => [row.revenueAmount, row.collectionAmount]), 1)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 80)
    return () => window.clearTimeout(timer)
  }, [rows])

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">
        Bar graph — Revenue vs Collection by centre
      </p>
      <div className="relative mt-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between sm:h-52">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="border-t border-[#D9E2EC]/70" />
          ))}
        </div>
        {allZero && (
          <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-sm font-medium text-[#686868]">
            No collection recorded for selected date
          </p>
        )}
        <div className="flex h-44 items-end justify-between gap-3 sm:h-52 sm:gap-5">
          {rows.map((row) => {
            const revenuePct = allZero ? 0 : (row.revenueAmount / max) * 100
            const collectionPct = allZero ? 0 : (row.collectionAmount / max) * 100

            return (
              <div key={row.centerName} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end justify-center gap-1.5 sm:h-44 sm:gap-2">
                  <div className="flex flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-semibold text-[#246392] sm:text-xs">
                      {formatBarAmount(row.revenueAmount)}
                    </span>
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-[#1F5E99] to-[#4FA3D9] transition-all duration-700 ease-out sm:max-w-[3rem]"
                      style={{
                        height: animated ? `${revenuePct}%` : '0%',
                        minHeight: animated && revenuePct > 0 ? '4px' : '0',
                      }}
                      title={`Revenue: ${formatINR(row.revenueAmount)}`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-semibold text-[#2d9a4a] sm:text-xs">
                      {formatBarAmount(row.collectionAmount)}
                    </span>
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-[#2d9a4a] to-[#69df66] transition-all duration-700 ease-out sm:max-w-[3rem]"
                      style={{
                        height: animated ? `${collectionPct}%` : '0%',
                        minHeight: animated && collectionPct > 0 ? '4px' : '0',
                      }}
                      title={`Collection: ${formatINR(row.collectionAmount)}`}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#686868]">{row.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-[#686868]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4FA3D9]" aria-hidden="true" />
          Revenue Amount
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#69df66]" aria-hidden="true" />
          Collection Amount
        </span>
      </div>
    </div>
  )
}

function RevenueCollectionDonutChart({ analytics, allZero }) {
  const [animated, setAnimated] = useState(false)
  const total = analytics.totalRevenue + analytics.totalCollection
  const revenueShare = total > 0 ? (analytics.totalRevenue / total) * 100 : 0

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 120)
    return () => window.clearTimeout(timer)
  }, [analytics])

  const gradient = animated
    ? allZero || total === 0
      ? 'conic-gradient(#eef2fc 0% 100%)'
      : `conic-gradient(#4FA3D9 0% ${revenueShare}%, #69df66 ${revenueShare}% 100%)`
    : 'conic-gradient(#eef2fc 0% 100%)'

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">
        Revenue vs Collection
      </p>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div
          className="relative h-40 w-40 shrink-0 rounded-full shadow-[0_4px_16px_rgba(31,94,153,0.15)] transition-all duration-700 sm:h-44 sm:w-44"
          style={{ background: gradient }}
        >
          <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">
              Collection %
            </span>
            <span className="text-xl font-bold text-[#246392] sm:text-2xl">
              {allZero ? '0%' : `${analytics.overallCollectionPct}%`}
            </span>
          </div>
        </div>
        <ul className="flex w-full flex-col gap-3 sm:max-w-[220px]">
          <li className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-[#222]">
              <span className="h-3 w-3 shrink-0 rounded-full bg-[#4FA3D9]" />
              Revenue
            </span>
            <span className="font-semibold text-[#1a3a5c]">{formatINR(analytics.totalRevenue)}</span>
          </li>
          <li className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-[#222]">
              <span className="h-3 w-3 shrink-0 rounded-full bg-[#69df66]" />
              Collection
            </span>
            <span className="font-semibold text-[#2d9a4a]">{formatINR(analytics.totalCollection)}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function CentreCollectionProgressBars({ rows }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 160)
    return () => window.clearTimeout(timer)
  }, [rows])

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">
        Collection progress by centre
      </p>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.centerName}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#1a3a5c]">{row.label}</span>
              <span className="font-bold text-[#246392]">{row.collectedPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF4FD]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4FA3D9] to-[#1F5E99] transition-all duration-700 ease-out"
                style={{ width: animated ? `${row.collectedPct}%` : '0%' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CentreComparisonSection({ rows }) {
  const analytics = useMemo(() => computeCentreAnalytics(rows), [rows])
  const allZero = isAllCentreDataZero(rows)

  return (
    <div className="mt-4 space-y-6">
      <CentreAnalyticsSummaryCards analytics={analytics} />
      <CentreComparisonTable rows={rows} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CenterRevenueVsCollectionBarChart rows={rows} allZero={allZero} />
        <RevenueCollectionDonutChart analytics={analytics} allZero={allZero} />
      </div>
      <CentreCollectionProgressBars rows={rows} />
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
            <div
              className="h-24 animate-pulse rounded-[10px] bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            />
          ) : (
            <CentreWiseCollectionTable rows={rows} />
          )}
        </div>

        <section className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-bold text-[#1a3a5c]">Revenue vs Collection by centre</h4>
          <p className="mt-0.5 text-xs text-[#686868]">
            Bar graph presentation comparison of centre — Revenue v/s collection for {dateLabel}
          </p>

          {loading ? (
            <div className="mt-3 h-48 animate-pulse rounded-[10px] bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
          ) : (
            <CentreComparisonSection rows={rows} />
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
