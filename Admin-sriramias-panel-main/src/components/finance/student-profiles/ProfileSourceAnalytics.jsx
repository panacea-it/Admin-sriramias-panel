import FinanceStatCard from '../FinanceStatCard'
import { formatINR } from '../../../utils/financeFilters'

export default function ProfileSourceAnalytics({ analytics = [] }) {
  if (!analytics.length) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#246392]">Revenue by enrollment source</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {analytics.map((row) => (
          <div key={row.sourceId} className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">
            <span className={cnBadge(row.color)}>{row.label}</span>
            <p className="mt-2 text-lg font-bold text-[#111]">{formatINR(row.revenue)}</p>
            <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div><dt className="text-[#686868]">Students</dt><dd className="font-semibold">{row.students}</dd></div>
              <div><dt className="text-[#686868]">Conversion</dt><dd className="font-semibold">{row.conversion}%</dd></div>
              <div className="col-span-2"><dt className="text-[#686868]">Collection efficiency</dt><dd className="font-semibold text-[#246392]">{row.collectionEfficiency}%</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}

function cnBadge(color) {
  return `inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${color || 'bg-[#eef6fc] text-[#246392]'}`
}
