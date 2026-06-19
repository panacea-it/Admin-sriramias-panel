import { Users } from 'lucide-react'
import DashboardSectionHeader from './DashboardSectionHeader'
import DashboardProgressBar from './DashboardProgressBar'
import DashboardNavLink from './DashboardNavLink'
import { DASHBOARD_ROUTES } from '../../constants/dashboardNavigation'

export default function DemographicsSection({ demographics, embedded = false }) {
  const content = (
    <DashboardNavLink
      to={DASHBOARD_ROUTES.analytics}
      ariaLabel="Open Student Demographics in Analytics"
      className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4"
    >
      <div className="space-y-4">
        {demographics.map((d) => (
          <div key={d.range}>
            <div className="mb-1.5 flex flex-wrap justify-between gap-2 text-xs font-semibold">
              <span className="text-gray-700">{d.range}</span>
              <div className="flex gap-3 text-gray-500">
                <span>{d.students} Students</span>
                <span className="font-bold text-gray-800">{d.pct}%</span>
              </div>
            </div>
            <DashboardProgressBar value={d.pct} color={d.color} className="h-2.5" />
          </div>
        ))}
      </div>
    </DashboardNavLink>
  )

  if (embedded) return content

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <DashboardSectionHeader icon={Users} title="Student Demographics" />
      {content}
    </section>
  )
}
