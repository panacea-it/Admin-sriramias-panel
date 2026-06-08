import { Trophy } from 'lucide-react'
import DashboardSectionHeader from './DashboardSectionHeader'
import FacultyCard from './FacultyCard'

export default function TopFacultySection({ faculty }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <DashboardSectionHeader icon={Trophy} title="Top Faculty" />
      <div className="space-y-4">
        {faculty.map((f) => (
          <FacultyCard key={f.rank} faculty={f} />
        ))}
      </div>
    </section>
  )
}
