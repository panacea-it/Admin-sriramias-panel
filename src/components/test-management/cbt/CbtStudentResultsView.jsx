import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, FileText, Search, Trophy, AlertTriangle } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import StatCard from '../../dashboard/StatCard'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import { Users, Target, TrendingUp, Award } from 'lucide-react'
import {
  exportCbtResultsCsv,
  exportCbtResultsPdf,
} from '../../../api/cbtManagementAPI'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

const RESULT_OPTIONS = ['all', 'Published', 'Unpublished']

function normalizeCbtResultStatus(status) {
  return status === 'Published' ? 'Published' : 'Unpublished'
}

function resultFilterToStatus(filter) {
  if (filter === 'Published') return 'PUBLISHED'
  return 'ALL'
}

export default function CbtStudentResultsView({
  testItem,
  testId,
  facultyLabel,
  rows = [],
  analytics,
  totalStudents = 0,
  attempted = 0,
}) {
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [sortKey, setSortKey] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [exporting, setExporting] = useState(false)

  const summary = useMemo(
    () => ({
      totalStudents,
      attempted,
      avgScore: analytics?.averageScore ?? 0,
      avgAccuracy: analytics?.averageAccuracy ?? 0,
    }),
    [analytics, totalStudents, attempted],
  )

  const topScorers = analytics?.topScorers ?? []
  const failedStudents = analytics?.needsImprovement ?? []
  const performanceChart = analytics?.scoreDistribution ?? []
  const accuracyTrend = analytics?.accuracyTrend ?? []

  const filtered = useMemo(() => {
    let list = [...rows]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.rollNumber.toLowerCase().includes(q),
      )
    }
    if (resultFilter === 'Published') {
      list = list.filter((r) => r.resultStatus === 'Published')
    } else if (resultFilter === 'Unpublished') {
      list = list.filter((r) => r.resultStatus !== 'Published')
    }

    list.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'rank') {
        av = av === '—' ? 9999 : Number(av)
        bv = bv === '—' ? 9999 : Number(bv)
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [rows, search, resultFilter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const runExport = async (type) => {
    if (!testId || exporting) return
    setExporting(true)
    const filters = {
      search: search.trim(),
      attemptStatus: 'ALL',
      resultStatus: resultFilterToStatus(resultFilter),
    }
    try {
      if (type === 'pdf') {
        await exportCbtResultsPdf({ testId, filters })
        toast.success('PDF exported')
      } else {
        await exportCbtResultsCsv({ testId, filters })
        toast.success('CSV exported')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to export ${type.toUpperCase()}`))
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    {
      key: 'studentName',
      label: (
        <button type="button" onClick={() => toggleSort('studentName')} className="font-semibold">
          Student Name {sortKey === 'studentName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
      ),
      render: (row) => <span className="font-medium text-[#333]">{row.studentName}</span>,
    },
    { key: 'rollNumber', label: 'Roll Number' },
    {
      key: 'attemptStatus',
      label: 'Attempt Status',
      render: (row) => <StatusBadge status={row.attemptStatus} />,
    },
    {
      key: 'score',
      label: (
        <button type="button" onClick={() => toggleSort('score')} className="font-semibold">
          Score {sortKey === 'score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
      ),
      render: (row) => (
        <span>
          {row.score}/{row.maxMarks}
        </span>
      ),
    },
    {
      key: 'accuracyPct',
      label: 'Accuracy %',
      render: (row) => `${row.accuracyPct}%`,
    },
    { key: 'negativeMarks', label: 'Negative Marks' },
    {
      key: 'rank',
      label: (
        <button type="button" onClick={() => toggleSort('rank')} className="font-semibold">
          Rank {sortKey === 'rank' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
      ),
    },
    { key: 'timeTaken', label: 'Time Taken' },
    { key: 'submissionDate', label: 'Submission Time' },
    {
      key: 'resultStatus',
      label: 'Result Status',
      render: (row) => <StatusBadge status={normalizeCbtResultStatus(row.resultStatus)} />,
    },
  ]

  if (!testItem) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={summary.totalStudents} color="#55ace7" icon={Users} />
        <StatCard title="Attempted" value={summary.attempted} color="#10b981" icon={Target} />
        <StatCard title="Avg Score" value={summary.avgScore} color="#8b5cf6" icon={TrendingUp} />
        <StatCard title="Avg Accuracy" value={`${summary.avgAccuracy}%`} color="#f59e0b" icon={Award} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] lg:col-span-2">
          <h3 className="mb-2 text-sm font-bold text-[#1a3a5c]">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="students" fill="#55ace7" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
            <TrendingUp className="h-4 w-4 text-[#55ace7]" />
            Average Accuracy Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="accuracy" stroke="#1a3a5c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top Scorers
          </h3>
          <ul className="space-y-2">
            {topScorers.length === 0 ? (
              <li className="text-sm text-slate-500">No completed attempts yet.</li>
            ) : (
              topScorers.map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="mr-2 font-bold text-[#55ace7]">#{s.rank ?? i + 1}</span>
                    {s.studentName}
                  </span>
                  <span className="font-semibold tabular-nums">{s.score} pts</span>
                </li>
              ))
            )}
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Needs Improvement (&lt;50% accuracy)
          </h3>
          <ul className="space-y-2">
            {failedStudents.length === 0 ? (
              <li className="text-sm text-slate-500">No students below threshold.</li>
            ) : (
              failedStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                >
                  <span>{s.studentName}</span>
                  <span className="font-semibold text-red-600 tabular-nums">{s.accuracyPct}%</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or roll number…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none"
          />
        </div>
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {RESULT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o === 'all' ? 'All' : o}
            </option>
          ))}
        </select>
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          disabled={exporting}
          onClick={() => runExport('csv')}
        >
          <Download className="h-4 w-4" />
          CSV
        </BannerButton>
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          disabled={exporting}
          onClick={() => runExport('pdf')}
        >
          <FileText className="h-4 w-4" />
          PDF
        </BannerButton>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        itemLabel="students"
        initialPageSize={10}
        resetDeps={[search, resultFilter, testItem.id]}
        stickyHeader
        emptyMessage="No students match your filters."
      />
    </div>
  )
}
