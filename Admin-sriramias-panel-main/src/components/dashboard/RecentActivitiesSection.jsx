import { Bell } from 'lucide-react'
import DashboardSectionHeader from './DashboardSectionHeader'
import ActivityCard from './ActivityCard'

export default function RecentActivitiesSection({ activities }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <DashboardSectionHeader
        icon={Bell}
        title="Recent Activities & Alerts"
        action={
          <button type="button" className="text-xs font-bold text-[#2286c3] hover:underline">
            View All
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {activities.map((act) => (
          <ActivityCard key={act.text} {...act} />
        ))}
      </div>
    </section>
  )
}
