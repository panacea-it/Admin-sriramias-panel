import { Building2 } from 'lucide-react'
import DashboardSectionHeader from './DashboardSectionHeader'
import CenterPerformanceCard from './CenterPerformanceCard'

export default function CenterPerformanceSection({ centers }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <DashboardSectionHeader icon={Building2} title="Center Performance Dashboard" />
      <div className="space-y-4">
        {centers.map((center) => (
          <CenterPerformanceCard key={center.name} center={center} />
        ))}
      </div>
    </section>
  )
}
