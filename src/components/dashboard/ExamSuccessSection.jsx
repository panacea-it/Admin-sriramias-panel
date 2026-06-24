import { Star } from 'lucide-react'
import DashboardSectionHeader from './DashboardSectionHeader'
import ExamSuccessCard from './ExamSuccessCard'

export default function ExamSuccessSection({ exams, embedded = false }) {
  const content = (
    <div className="space-y-4">
      {exams.map((e) => (
        <ExamSuccessCard key={e.name} exam={e} />
      ))}
    </div>
  )

  if (embedded) return content

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <DashboardSectionHeader icon={Star} title="Exam Success Rate" />
      {content}
    </section>
  )
}
