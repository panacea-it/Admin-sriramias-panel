import { cn } from '../../utils/cn'
import { formatINR } from '../../utils/financeFilters'

function CompareBarChart({ items, valueKey = 'value', labelKey = 'center' }) {
  const max = Math.max(...items.map((d) => d[valueKey] || 0), 1)
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item[labelKey]}>
          <div className="mb-1 flex justify-between text-xs font-medium">
            <span>{item[labelKey]}</span>
            <span>{typeof item[valueKey] === 'number' && item[valueKey] > 1000 ? formatINR(item[valueKey]) : `${item[valueKey]}%`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#246392] to-[#55ace7]"
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CenterComparisonPanel({ comparison, centers = [] }) {
  if (!comparison) return null

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-5">
      <h3 className="mb-4 text-sm font-bold text-[#246392]">Center comparison</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Revenue</p>
          <CompareBarChart items={comparison.revenue || []} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Conversion %</p>
          <CompareBarChart items={comparison.conversion || []} valueKey="value" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Pending payments</p>
          <CompareBarChart items={comparison.pending || []} valueKey="value" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Failed payments</p>
          <CompareBarChart items={comparison.failed || []} valueKey="value" />
        </div>
      </div>
      {centers.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {centers.map((c) => (
            <span
              key={c.centerId}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: c.color || '#246392' }}
            >
              {c.centerName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
