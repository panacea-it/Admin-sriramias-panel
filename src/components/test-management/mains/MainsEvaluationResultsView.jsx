import { useMemo, useState } from 'react'
import { Filter, Search, Trophy, TrendingDown, TrendingUp } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import StatCard from '../../dashboard/StatCard'
import { Users, Target } from 'lucide-react'
import { cn } from '../../../utils/cn'
import {
  generateMainsStudentResults,
  summarizeMainsResults,
} from '../../../data/mainsStudentResultsSeed'
import { deriveEvaluationStats } from '../../../utils/evaluationProgressMetrics'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All students' },
  { value: 'Evaluated', label: 'Evaluated' },
  { value: 'Pending', label: 'Pending' },
]

const UPLOAD_STATUS_STYLES = {
  Uploaded: 'bg-[#10b981]',
  'Not Uploaded': 'bg-[#efb36d]',
}

function UploadStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[110px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        UPLOAD_STATUS_STYLES[status] || 'bg-slate-400',
      )}
    >
      {status}
    </span>
  )
}

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

export default function MainsEvaluationResultsView({ test, facultyLabel }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const allRows = useMemo(
    () => generateMainsStudentResults(test?.id, test?.title),
    [test?.id, test?.title],
  )

  const summary = useMemo(() => {
    const fromRows = summarizeMainsResults(allRows)
    const derived = deriveEvaluationStats(test?.id)
    return {
      ...fromRows,
      studentsAssigned: derived.studentsAssigned,
      totalDownloads: derived.studentsDownloaded,
      totalUploaded: derived.studentsUploaded,
      totalEvaluated: derived.studentsEvaluated,
      pendingEvaluations: derived.pendingEvaluations,
      evaluationPct: derived.evaluationPct,
    }
  }, [allRows, test?.id])

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

  const columns = [
    {
      key: 'studentName',
      label: 'Student Name',
      render: (row) => <span className="font-medium text-[#333]">{row.studentName}</span>,
    },
    { key: 'registerNumber', label: 'Register Number' },
    {
      key: 'uploadedStatus',
      label: 'Uploaded Status',
      render: (row) => <UploadStatusBadge status={row.uploadedStatus} />,
    },
    {
      key: 'marks',
      label: 'Marks',
      render: (row) => (
        <span className="tabular-nums">
          {typeof row.marks === 'number' ? `${row.marks}/${row.maxMarks}` : row.marks}
        </span>
      ),
    },
    { key: 'rank', label: 'Rank' },
    { key: 'evaluatedBy', label: 'Evaluated By' },
    { key: 'evaluationDate', label: 'Evaluation Date' },
  ]

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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or register number…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none"
          />
        </div>
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        itemLabel="students"
        initialPageSize={10}
        resetDeps={[search, statusFilter, test.id]}
        stickyHeader
        emptyMessage={
          statusFilter === 'all' && !search.trim()
            ? 'No student results available.'
            : 'No students match your filters.'
        }
      />
    </div>
  )
}
