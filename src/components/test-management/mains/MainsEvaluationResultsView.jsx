import { useMemo, useState } from 'react'
import { Trophy, TrendingDown, TrendingUp } from 'lucide-react'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import StatCard from '../../dashboard/StatCard'
import { Users, Target } from 'lucide-react'
import MainsStudentResultsTable from './MainsStudentResultsTable'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Evaluated', label: 'Evaluated' },
  { value: 'Pending', label: 'Pending' },
]

function SummaryProgressBar({ label, value, max, color = '#55ace7' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {value} / {max} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function MainsEvaluationResultsView({
  test,
  facultyLabel,
  summary: summaryProp,
  rows: rowsProp,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const allRows = useMemo(() => rowsProp ?? [], [rowsProp])

  const summary = useMemo(() => {
    if (summaryProp) return summaryProp
    return {
      studentsAssigned: 0,
      totalDownloads: 0,
      totalUploaded: 0,
      totalEvaluated: 0,
      pendingEvaluations: 0,
      evaluationPct: 0,
      totalStudents: 0,
      highestMarks: 0,
      lowestMarks: 0,
      averageMarks: 0,
      topRanker: '—',
    }
  }, [summaryProp])

  const filtered = useMemo(() => {
    let rows = [...allRows]
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.registerNumber.toLowerCase().includes(q),
      )
    }
    if (statusFilter === 'Evaluated') rows = rows.filter((r) => r.filterEvaluated === 'Evaluated')
    else if (statusFilter === 'Pending') rows = rows.filter((r) => r.filterEvaluated === 'Pending')
    return rows
  }, [allRows, search, statusFilter])

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'all')

  const emptyMessage = hasActiveFilters
    ? 'No students match your filters.'
    : 'No student results available.'

  if (!test) return null

  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
        <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Evaluation Summary</h3>
        {facultyLabel && <p className="mb-3 text-xs text-slate-500">{facultyLabel}</p>}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-500">Assigned</p>
            <p className="text-lg font-bold text-[#1a3a5c] tabular-nums">{summary.studentsAssigned}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-500">Downloads</p>
            <p className="text-lg font-bold text-[#55ace7] tabular-nums">{summary.totalDownloads}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-500">Uploaded</p>
            <p className="text-lg font-bold text-[#1a3a5c] tabular-nums">{summary.totalUploaded}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-500">Evaluated</p>
            <p className="text-lg font-bold text-emerald-700 tabular-nums">{summary.totalEvaluated}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-lg font-bold text-amber-700 tabular-nums">{summary.pendingEvaluations}</p>
          </div>
        </div>
        <div className="space-y-3">
          <SummaryProgressBar
            label="Answer sheets uploaded"
            value={summary.totalUploaded}
            max={summary.studentsAssigned}
          />
          <SummaryProgressBar
            label="Evaluations completed"
            value={summary.totalEvaluated}
            max={summary.totalUploaded || 1}
            color="#10b981"
          />
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard title="Total Students" value={summary.totalStudents} color="#55ace7" icon={Users} />
        <StatCard title="Evaluated" value={summary.totalEvaluated} color="#10b981" icon={Target} />
      </div>

      <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
        <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Analytics</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500">Highest Marks</p>
              <p className="font-bold text-[#1a3a5c] tabular-nums">{summary.highestMarks}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-slate-500">Lowest Marks</p>
              <p className="font-bold text-[#1a3a5c] tabular-nums">{summary.lowestMarks}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <Target className="h-5 w-5 text-[#55ace7]" />
            <div>
              <p className="text-xs text-slate-500">Average Marks</p>
              <p className="font-bold text-[#1a3a5c] tabular-nums">{summary.averageMarks}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-slate-500">Top Ranker</p>
              <p className="truncate font-bold text-[#1a3a5c]">{summary.topRanker}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search name or register number…"
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={FILTER_OPTIONS}
          searchFullWidth
        />

        <div className="mt-5 w-full overflow-hidden rounded-xl border border-slate-100">
          <MainsStudentResultsTable
            rows={filtered}
            resetDeps={[search, statusFilter, test.id]}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </div>
  )
}
