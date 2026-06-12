import { useState } from 'react'
import { LayoutGrid, Table2 } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'

function ChartCard({ title, subtitle, children, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-white sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export function MonthlyRevenueBarChart({ data = [], className }) {
  const max = Math.max(...data.map((d) => d.amount || 0), 1)
  return (
    <ChartCard title="Monthly Revenue" subtitle="Collections by month" className={className}>
      <div className="flex h-48 items-end justify-between gap-2 sm:h-56 sm:gap-3">
        {data.map((item) => {
          const pct = ((item.amount || 0) / max) * 100
          return (
            <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-[#246392] sm:text-xs" title={formatINR(item.amount)}>
                {item.amount >= 1000000 ? `${(item.amount / 1000000).toFixed(1)}M` : `${Math.round(item.amount / 1000)}K`}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#246392] to-[#55ace7] transition-all"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                  title={formatINR(item.amount)}
                />
              </div>
              <span className="text-xs font-medium text-[#686868]">{item.month}</span>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

export function PaymentStatusPieChart({ data = [], className }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1
  let cumulative = 0
  const segments = data.map((d) => {
    const start = cumulative
    cumulative += (d.value / total) * 100
    return { ...d, start, end: cumulative }
  })

  const gradient = segments.length
    ? `conic-gradient(${segments
        .map((s) => `${s.color || '#55ace7'} ${s.start}% ${s.end}%`)
        .join(', ')})`
    : 'conic-gradient(#eef2fc 0% 100%)'

  return (
    <ChartCard title="Payment Status" subtitle="Share of payment states" className={className}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full shadow-inner sm:h-40 sm:w-40"
          style={{ background: gradient }}
        >
          <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-center">
            <span className="text-lg font-bold text-[#1a3a5c]">{total}%</span>
          </div>
        </div>
        <ul className="flex w-full flex-col gap-2 sm:max-w-[200px]">
          {data.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-[#222]">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="font-semibold text-[#246392]">{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  )
}

export function CourseRevenueChart({ data = [], className }) {
  const max = Math.max(...data.map((d) => d.amount || 0), 1)
  return (
    <ChartCard title="Course-wise Revenue" subtitle="Top courses by collection" className={className}>
      <ul className="space-y-3">
        {data.map((item) => {
          const pct = ((item.amount || 0) / max) * 100
          return (
            <li key={item.course}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium text-[#222]" title={item.course}>
                  {item.course}
                </span>
                <span className="shrink-0 font-semibold text-[#1a3a5c]">{formatINR(item.amount)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2fc]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}

export function EmiTrendChart({ data = [], className }) {
  const max = Math.max(...data.map((d) => d.collected || 0), 1)
  const w = 280
  const h = 120
  const pad = 8
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((d.collected || 0) / max) * (h - pad * 2)
    return { x, y, ...d }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? pad} ${h - pad} L ${points[0]?.x ?? pad} ${h - pad} Z`

  return (
    <ChartCard title="EMI Collections Trend" subtitle="Monthly EMI collected" className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto w-full max-w-md" aria-hidden>
        <defs>
          <linearGradient id="emiAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55ace7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#55ace7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#emiAreaGrad)" />
        <path d={linePath} fill="none" stroke="#246392" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.month} cx={p.x} cy={p.y} r="4" fill="#55ace7" stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs font-medium text-[#686868]">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </ChartCard>
  )
}

export function CollectionVsOutstandingChart({ data = [], loading, className }) {
  const max = Math.max(...data.map((d) => d.amount || 0), 1)
  if (!loading && !data.length) {
    return (
      <ChartCard title="Collection vs Outstanding" subtitle="Collected revenue vs pending" className={className}>
        <p className="py-8 text-center text-sm text-[#686868]">No collection data for selected filters.</p>
      </ChartCard>
    )
  }
  return (
    <ChartCard title="Collection vs Outstanding" subtitle="Collected revenue vs pending" className={className}>
      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <div className="flex h-48 flex-col justify-end gap-4 sm:h-52 sm:flex-row sm:items-end sm:gap-6">
          {data.map((item) => {
            const pct = ((item.amount || 0) / max) * 100
            return (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#1a3a5c]" title={formatINR(item.amount)}>
                  {formatINR(item.amount)}
                </span>
                <div
                  className="w-full max-w-[80px] rounded-t-md transition-all sm:max-w-none"
                  style={{
                    height: `${Math.max(pct, 8)}%`,
                    minHeight: '2rem',
                    background: `linear-gradient(to top, ${item.color || '#246392'}, #55ace7)`,
                  }}
                  title={`${item.label}: ${formatINR(item.amount)}`}
                />
                <span className="text-center text-xs font-medium text-[#686868]">{item.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}

export function CenterMonthlyComparisonChart({ data = [], loading, className }) {
  const [view, setView] = useState('chart')
  const centers = data.filter((c) => c.centerName !== 'All')
  const display = centers.length ? centers : data

  if (!loading && !display.length) {
    return (
      <ChartCard title="Center-wise Monthly Comparison" subtitle="Revenue by center and month" className={className}>
        <p className="py-8 text-center text-sm text-[#686868]">No center comparison data.</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Center-wise Monthly Comparison" subtitle="Revenue by center and month" className={className}>
      <div className="mb-3 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => setView('chart')}
          className={cn(
            'rounded-lg p-1.5 transition',
            view === 'chart' ? 'bg-[#246392] text-white' : 'bg-slate-100 text-slate-600',
          )}
          aria-label="Chart view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setView('table')}
          className={cn(
            'rounded-lg p-1.5 transition',
            view === 'table' ? 'bg-[#246392] text-white' : 'bg-slate-100 text-slate-600',
          )}
          aria-label="Table view"
        >
          <Table2 className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
      ) : view === 'table' ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b text-[#686868]">
                <th className="px-2 py-2 font-semibold">Center</th>
                {(display[0]?.months || []).map((m) => (
                  <th key={m.month} className="px-2 py-2 font-semibold">
                    {m.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {display.map((row) => (
                <tr key={row.centerName} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium text-[#222]">{row.centerName}</td>
                  {(row.months || []).map((m) => (
                    <td key={m.month} className="px-2 py-2 text-[#246392]">
                      {formatINR(m.amount)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          {display.slice(0, 5).map((row) => {
            const max = Math.max(...(row.months || []).map((m) => m.amount || 0), 1)
            return (
              <div key={row.centerName} className="min-w-[280px]">
                <p className="mb-2 truncate text-xs font-bold text-[#1a3a5c]">{row.centerName}</p>
                <div className="flex items-end gap-1">
                  {(row.months || []).map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-[#246392] to-[#55ace7]"
                        style={{ height: `${Math.max(((m.amount || 0) / max) * 48, 4)}px` }}
                        title={formatINR(m.amount)}
                      />
                      <span className="text-[10px] text-[#686868]">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}

export function PaymentSuccessRatioChart({ ratio = {}, loading, className }) {
  const items = [
    { label: 'Successful', value: ratio.successful ?? 0, color: '#69df66', tip: 'Paid / successful payments' },
    { label: 'Failed', value: ratio.failed ?? 0, color: '#df8284', tip: 'Failed payment attempts' },
    { label: 'Pending', value: ratio.pending ?? 0, color: '#55ace7', tip: 'Pending or partial payments' },
  ]
  return (
    <ChartCard title="Payment Success Ratio" subtitle="Outcome distribution" className={className}>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.label} title={item.tip}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-[#222]">{item.label}</span>
                <span className="font-bold text-[#246392]">{item.value}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#eef2fc]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}

export function FailedRecoveryChart({ recovery, loading, className }) {
  const trend = recovery?.trend || []
  const max = Math.max(...trend.flatMap((t) => [t.failed || 0, t.recovered || 0]), 1)

  return (
    <ChartCard title="Failed Payment Recovery" subtitle="Recovery tracking & trend" className={className}>
      {loading ? (
        <div className="h-36 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-lg bg-[#eef2fc] p-2 sm:p-3">
              <p className="text-[10px] font-semibold uppercase text-[#686868] sm:text-xs">Failed</p>
              <p className="text-lg font-bold text-[#df8284] sm:text-xl">{recovery?.failed ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#eef2fc] p-2 sm:p-3">
              <p className="text-[10px] font-semibold uppercase text-[#686868] sm:text-xs">Recovered</p>
              <p className="text-lg font-bold text-[#69df66] sm:text-xl">{recovery?.recovered ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#eef2fc] p-2 sm:p-3">
              <p className="text-[10px] font-semibold uppercase text-[#686868] sm:text-xs">Recovery</p>
              <p className="text-lg font-bold text-[#246392] sm:text-xl">{recovery?.recoveryPct ?? 0}%</p>
            </div>
          </div>
          <div className="flex h-28 items-end justify-between gap-1 sm:h-32">
            {trend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: '5rem' }}>
                  <div
                    className="w-[42%] rounded-t bg-[#df8284]/80"
                    style={{ height: `${Math.max(((t.failed || 0) / max) * 100, 6)}%` }}
                    title={`Failed: ${t.failed}`}
                  />
                  <div
                    className="w-[42%] rounded-t bg-[#69df66]"
                    style={{ height: `${Math.max(((t.recovered || 0) / max) * 100, 4)}%` }}
                    title={`Recovered: ${t.recovered}`}
                  />
                </div>
                <span className="text-[10px] text-[#686868]">{t.month}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  )
}

export function EmiAgingChart({ data = [], loading, className }) {
  const max = Math.max(...data.map((d) => d.count || 0), 1)
  return (
    <ChartCard title="Pending EMI Aging" subtitle="Overdue installment buckets" className={className}>
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
      ) : !data.length ? (
        <p className="py-8 text-center text-sm text-[#686868]">No pending EMI installments.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {data.map((bucket) => (
            <div
              key={bucket.key}
              className="rounded-lg border border-slate-100 p-3"
              style={{ borderLeftWidth: 4, borderLeftColor: bucket.color }}
            >
              <p className="text-xs font-semibold text-[#686868]">{bucket.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: bucket.color }}>
                {bucket.count}
              </p>
              <p className="text-xs text-[#686868]">{formatINR(bucket.amount)} due</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2fc]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(((bucket.count || 0) / max) * 100, 8)}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  )
}

export { default as DailyCollectionWidget } from './DailyCollectionWidget'
export { default as CentreWiseCollectionWidget } from './CentreWiseCollectionWidget'
export { default as PendingEmiWidget } from './PendingEmiWidget'

export default function FinanceCharts({ monthlyRevenue, paymentStatusBreakdown, courseWiseRevenue, emiTrend }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
      <MonthlyRevenueBarChart data={monthlyRevenue} />
      <PaymentStatusPieChart data={paymentStatusBreakdown} />
      <CourseRevenueChart data={courseWiseRevenue} className="sm:col-span-2 xl:col-span-1" />
      <EmiTrendChart data={emiTrend} className="sm:col-span-2 xl:col-span-1" />
    </div>
  )
}
