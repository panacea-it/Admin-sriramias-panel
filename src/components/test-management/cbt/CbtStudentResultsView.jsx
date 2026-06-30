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
import { AlertTriangle, Award, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import StatCard from '../../dashboard/StatCard'
import {
  CbtAdminTable,
  CbtAttemptStatusBadge,
  CbtChartCard,
  CbtExportToolbar,
  CbtRankListCard,
  CbtResultStatusBadge,
  CbtStatsGrid,
  CBT_TABLE_CONTAINER,
} from './ui'
import {
  exportCbtResultsCsv,
  exportCbtResultsPdf,
} from '../../../api/cbtManagementAPI'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

const RESULT_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Published', label: 'Published' },
  { value: 'Unpublished', label: 'Unpublished' },
]

function resultFilterToStatus(filter) {
  if (filter === 'Published') return 'PUBLISHED'
  return 'ALL'
}

export default function CbtStudentResultsView({
  testItem,
  testId,
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
        toast.success('PDF Exported')
      } else {
        await exportCbtResultsCsv({ testId, filters })
        toast.success('CSV Exported')
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
      label: 'Student Name',
      render: (row) => <span className="font-medium text-[#333]">{row.studentName}</span>,
    },
    { key: 'rollNumber', label: 'Roll Number' },
    {
      key: 'attemptStatus',
      label: 'Attempt Status',
      align: 'center',
      render: (row) => <CbtAttemptStatusBadge status={row.attemptStatus} />,
    },
    {
      key: 'score',
      label: 'Score',
      align: 'center',
      render: (row) => (
        <span className="tabular-nums">
          {row.score}/{row.maxMarks}
        </span>
      ),
    },
    {
      key: 'accuracyPct',
      label: 'Accuracy %',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.accuracyPct}%</span>,
    },
    {
      key: 'negativeMarks',
      label: 'Negative Marks',
      align: 'center',
      render: (row) => <span className="tabular-nums">{row.negativeMarks}</span>,
    },
    {
      key: 'rank',
      label: (
        <button type="button" onClick={() => toggleSort('rank')} className="font-semibold">
          Rank {sortKey === 'rank' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
      ),
      align: 'center',
    },
    { key: 'timeTaken', label: 'Time Taken' },
    { key: 'submissionDate', label: 'Submission Time' },
    {
      key: 'resultStatus',
      label: 'Result Status',
      align: 'center',
      render: (row) => <CbtResultStatusBadge status={row.resultStatus} />,
    },
  ]

  if (!testItem) return null

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <CbtStatsGrid columns={4}>
        <StatCard title="Total Students" value={summary.totalStudents} color="#55ace7" icon={Users} />
        <StatCard title="Attempted" value={summary.attempted} color="#10b981" icon={Target} />
        <StatCard title="Avg Score" value={summary.avgScore} color="#8b5cf6" icon={TrendingUp} />
        <StatCard title="Avg Accuracy" value={`${summary.avgAccuracy}%`} color="#f59e0b" icon={Award} />
      </CbtStatsGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <CbtChartCard title="Score Distribution" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="students" fill="#55ace7" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </CbtChartCard>

        <CbtChartCard title="Average Accuracy Trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="accuracy" stroke="#1a3a5c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CbtChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CbtRankListCard
          title="Top Scorers"
          icon={Trophy}
          iconClassName="text-amber-500"
          items={topScorers}
          emptyMessage="No completed attempts yet."
          itemClassName="border-0 bg-transparent px-0 py-1.5"
          renderItem={(student, index) => (
            <>
              <span className="min-w-0 truncate">
                <span className="mr-2 font-bold text-[#55ace7]">#{student.rank ?? index + 1}</span>
                {student.studentName}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{student.score} pts</span>
            </>
          )}
        />

        <CbtRankListCard
          title="Needs Improvement (<50% accuracy)"
          icon={AlertTriangle}
          iconClassName="text-red-500"
          items={failedStudents}
          emptyMessage="No students below threshold."
          itemClassName="border-0 bg-transparent px-0 py-1.5"
          renderItem={(student) => (
            <>
              <span className="min-w-0 truncate">{student.studentName}</span>
              <span className="shrink-0 font-semibold text-red-600 tabular-nums">
                {student.accuracyPct}%
              </span>
            </>
          )}
        />
      </div>

      <CbtExportToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search name or roll number…"
        filterValue={resultFilter}
        onFilterChange={(e) => setResultFilter(e.target.value)}
        filterOptions={RESULT_FILTER_OPTIONS}
        exporting={exporting}
        onExportCsv={() => runExport('csv')}
        onExportPdf={() => runExport('pdf')}
      />

      <div className={CBT_TABLE_CONTAINER}>
        <CbtAdminTable
          columns={columns}
          data={filtered}
          itemLabel="students"
          initialPageSize={10}
          resetDeps={[search, resultFilter, testItem.id]}
          tableMinWidth={1200}
          tableLayoutFixed
          emptyMessage="No students match your filters."
        />
      </div>
    </div>
  )
}
