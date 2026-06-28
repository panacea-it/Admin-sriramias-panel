import { FileQuestion } from 'lucide-react'
import StatCard from '../dashboard/StatCard'

export default function QuestionBankStatsCards({ analytics, loading }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        title="Total Questions"
        value={loading ? '—' : analytics?.totalQuestions ?? 0}
        color="#246392"
        graphColor="#55ace7"
        icon={FileQuestion}
      />
      <StatCard
        title="Easy"
        value={loading ? '—' : analytics?.easyCount ?? 0}
        color="#16a34a"
        graphColor="#16a34a"
        icon={FileQuestion}
      />
      <StatCard
        title="Medium/Hard"
        value={loading ? '—' : analytics?.mediumHardCount ?? 0}
        color="#f59e0b"
        graphColor="#f59e0b"
        icon={FileQuestion}
      />
    </div>
  )
}
