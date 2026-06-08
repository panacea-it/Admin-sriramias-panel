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
import { Download, FileText, Filter, Search, Trophy, AlertTriangle } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import StatCard from '../../dashboard/StatCard'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import { Users, Target, TrendingUp, Award } from 'lucide-react'
import {
  generateCbtStudentResults,
  summarizeCbtResults,
} from '../../../data/cbtStudentResultsSeed'
import { exportToCsv } from '../../../utils/financeExport'
import { openPrintablePdfLikeReport } from '../../../utils/testManagement/reportExport'
import { toast } from '../../../utils/toast'

const ATTEMPT_OPTIONS = ['all', 'Completed', 'In Progress', 'Not Started', 'Absent']
const RESULT_OPTIONS = ['all', 'Published', 'Pending', 'Under Review']

export default function CbtStudentResultsView({ testItem, facultyLabel }) {
  const [search, setSearch] = useState('')
  const [attemptFilter, setAttemptFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')
  const [sortKey, setSortKey] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')

  const allRows = useMemo(
    () => generateCbtStudentResults(testItem?.id, testItem?.title),
    [testItem?.id, testItem?.title],
  )

  const summary = useMemo(() => summarizeCbtResults(allRows), [allRows])

  const topScorers = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.attemptStatus === 'Completed')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [allRows],
  )

  const failedStudents = useMemo(
    () =>
      allRows.filter(
        (r) =>
          r.attemptStatus === 'Completed' &&
          r.accuracyPct < 50,
      ).slice(0, 5),
    [allRows],
  )

  const performanceChart = useMemo(() => {
    const buckets = ['0-40', '41-55', '56-70', '71-85', '86-100']
    const counts = [0, 0, 0, 0, 0]
    allRows
      .filter((r) => r.attemptStatus === 'Completed')
      .forEach((r) => {
        const pct = (r.score / (r.maxMarks || 50)) * 100
        if (pct <= 40) counts[0] += 1
        else if (pct <= 55) counts[1] += 1
        else if (pct <= 70) counts[2] += 1
        else if (pct <= 85) counts[3] += 1
        else counts[4] += 1
      })
    return buckets.map((range, i) => ({ range, students: counts[i] }))
  }, [allRows])

  const accuracyTrend = useMemo(() => {
    const completed = allRows.filter((r) => r.attemptStatus === 'Completed').slice(0, 12)
    return completed.map((r, i) => ({
      label: `S${i + 1}`,
      accuracy: r.accuracyPct,
    }))
  }, [allRows])

  const filtered = useMemo(() => {
    let rows = [...allRows]
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.rollNumber.toLowerCase().includes(q),
      )
    }
    if (attemptFilter !== 'all') rows = rows.filter((r) => r.attemptStatus === attemptFilter)
    if (resultFilter !== 'all') rows = rows.filter((r) => r.resultStatus === resultFilter)

    rows.sort((a, b) => {
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
    return rows
  }, [allRows, search, attemptFilter, resultFilter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const exportCsv = () => {
    exportToCsv(
      filtered.map((r) => ({
        Student: r.studentName,
        Roll: r.rollNumber,
        Attempt: r.attemptStatus,
        Score: r.score,
        Rank: r.rank,
        Accuracy: r.accuracyPct,
        Negative: r.negativeMarks,
        Time: r.timeTaken,
        Submitted: r.submissionDate,
        Result: r.resultStatus,
      })),
      `cbt-results-${testItem?.id || 'export'}.csv`,
    )
    toast.success('CSV exported')
  }

  const exportPdf = () => {
    const rows = filtered
      .slice(0, 40)
      .map(
        (r) =>
          `<tr><td>${r.studentName}</td><td>${r.rollNumber}</td><td>${r.score}</td><td>${r.rank}</td><td>${r.accuracyPct}%</td></tr>`,
      )
      .join('')
    const html = `
      <h1>${testItem?.title || 'Test Results'}</h1>
      <p>${facultyLabel || ''}</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
        <thead><tr><th>Student</th><th>Roll</th><th>Score</th><th>Rank</th><th>Accuracy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    openPrintablePdfLikeReport({ title: testItem?.title || 'Results', html })
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
      render: (row) => <StatusBadge status={row.resultStatus} />,
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
            {topScorers.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <span>
                  <span className="mr-2 font-bold text-[#55ace7]">#{i + 1}</span>
                  {s.studentName}
                </span>
                <span className="font-semibold tabular-nums">{s.score} pts</span>
              </li>
            ))}
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
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={attemptFilter}
          onChange={(e) => setAttemptFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {ATTEMPT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o === 'all' ? 'All attempts' : o}
            </option>
          ))}
        </select>
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {RESULT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o === 'all' ? 'All results' : o}
            </option>
          ))}
        </select>
        <BannerButton type="button" variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          CSV
        </BannerButton>
        <BannerButton type="button" variant="secondary" onClick={exportPdf}>
          <FileText className="h-4 w-4" />
          PDF
        </BannerButton>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        itemLabel="students"
        initialPageSize={10}
        resetDeps={[search, attemptFilter, resultFilter, testItem.id]}
        stickyHeader
        emptyMessage="No students match your filters."
      />
    </div>
  )
}
