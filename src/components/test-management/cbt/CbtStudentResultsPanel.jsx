import { useMemo, useState } from 'react'
import { Download, Filter, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import StatCard from '../../dashboard/StatCard'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import { Users, Target, TrendingUp, Award } from 'lucide-react'
import {
  generateCbtStudentResults,
  summarizeCbtResults,
} from '../../../data/cbtStudentResultsSeed'
import { exportToCsv } from '../../../utils/financeExport'
import { toast } from '../../../utils/toast'

const ATTEMPT_OPTIONS = ['all', 'Completed', 'In Progress', 'Not Started', 'Absent']
const RESULT_OPTIONS = ['all', 'Published', 'Pending', 'Under Review']

export default function CbtStudentResultsPanel({ testItem }) {
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

  const handleExport = () => {
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
    toast.success('Results exported')
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
      key: 'rank',
      label: (
        <button type="button" onClick={() => toggleSort('rank')} className="font-semibold">
          Rank {sortKey === 'rank' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
      ),
    },
    { key: 'accuracyPct', label: 'Accuracy %', render: (row) => `${row.accuracyPct}%` },
    { key: 'negativeMarks', label: 'Negative Marks' },
    { key: 'timeTaken', label: 'Time Taken' },
    { key: 'submissionDate', label: 'Submission Date' },
    {
      key: 'resultStatus',
      label: 'Result Status',
      render: (row) => <StatusBadge status={row.resultStatus} />,
    },
  ]

  if (!testItem) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">Select a test series folder to view student results</p>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          Expand Subject → Faculty → Folder → Test Series in the left explorer.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={summary.totalStudents} color="#55ace7" icon={Users} />
        <StatCard title="Attempted" value={summary.attempted} color="#10b981" icon={Target} />
        <StatCard title="Avg Score" value={summary.avgScore} color="#8b5cf6" icon={TrendingUp} />
        <StatCard title="Top Score" value={summary.topScore} color="#f59e0b" icon={Award} />
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
        <div className="flex items-center gap-1 text-slate-500">
          <Filter className="h-4 w-4" />
        </div>
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
        <BannerButton type="button" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export
        </BannerButton>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        itemLabel="students"
        initialPageSize={10}
        resetDeps={[search, attemptFilter, resultFilter, testItem.id]}
        emptyMessage="No students match your filters."
      />
    </div>
  )
}
