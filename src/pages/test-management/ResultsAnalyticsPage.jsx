import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Award, ClipboardList, Percent, TrendingUp } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import StatCard from '../../components/dashboard/StatCard'
import {
  PassFailSplit,
  PerformanceTrend,
  ScoreDistributionBars,
  SubjectWiseBars,
} from '../../components/test-management/ResultsAnalyticsCharts'
import { fetchResults } from '../../api/testManagementAPI'

function toPct(n) {
  const v = Number(n) || 0
  return Math.max(0, Math.min(100, v))
}

export default function ResultsAnalyticsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchResults({ search })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const kpis = useMemo(() => {
    const totalAttempts = rows.length
    const tests = new Set(rows.map((r) => r.testName).filter(Boolean))
    const scores = rows.map((r) => (Number(r.score) / Math.max(Number(r.total) || 1, 1)) * 100)
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const max = scores.length ? Math.max(...scores) : 0
    const min = scores.length ? Math.min(...scores) : 0
    const passCount = rows.filter((r) => String(r.status).toLowerCase() === 'pass').length
    const passPct = totalAttempts ? (passCount / totalAttempts) * 100 : 0

    return {
      totalTests: tests.size,
      totalAttempts,
      averageScore: toPct(avg),
      highestScore: toPct(max),
      lowestScore: toPct(min),
      passPct: toPct(passPct),
    }
  }, [rows])

  const distribution = useMemo(() => {
    const buckets = [
      { label: '0–20', min: 0, max: 20 },
      { label: '21–40', min: 21, max: 40 },
      { label: '41–60', min: 41, max: 60 },
      { label: '61–80', min: 61, max: 80 },
      { label: '81–100', min: 81, max: 100 },
    ].map((b) => ({ label: b.label, count: 0, ...b }))
    for (const r of rows) {
      const pct = (Number(r.score) / Math.max(Number(r.total) || 1, 1)) * 100
      const bucket = buckets.find((b) => pct >= b.min && pct <= b.max)
      if (bucket) bucket.count += 1
    }
    return buckets
  }, [rows])

  const subjectWise = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const subject = r.subject || 'General'
      const pct = (Number(r.score) / Math.max(Number(r.total) || 1, 1)) * 100
      const cur = map.get(subject) || { subject, sum: 0, count: 0 }
      cur.sum += pct
      cur.count += 1
      map.set(subject, cur)
    }
    return Array.from(map.values())
      .map((x) => ({ subject: x.subject, avg: Math.round((x.sum / Math.max(x.count, 1)) * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
  }, [rows])

  const trend = useMemo(() => {
    // Simple 5-point trend derived from latest rows
    const recent = [...rows].slice(0, 25)
    const parts = 5
    const size = Math.max(Math.floor(recent.length / parts), 1)
    const points = []
    for (let i = 0; i < parts; i += 1) {
      const chunk = recent.slice(i * size, (i + 1) * size)
      const avg =
        chunk.length === 0
          ? 0
          : chunk.reduce((s, r) => s + (Number(r.score) / Math.max(Number(r.total) || 1, 1)) * 100, 0) /
            chunk.length
      points.push({ label: `T${i + 1}`, value: Math.round(avg) })
    }
    return points
  }, [rows])

  const columns = [
    { key: 'testName', label: 'Test', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
    { key: 'student', label: 'Student' },
    {
      key: 'score',
      label: 'Score',
      render: (r) => (
        <span className="font-semibold text-[#1a3a5c]">
          {r.score}/{r.total}
        </span>
      ),
    },
    { key: 'rank', label: 'Rank' },
    {
      key: 'status',
      label: 'Pass/Fail',
      render: (r) => (
        <span
          className={
            String(r.status).toLowerCase() === 'pass'
              ? 'rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700'
              : 'rounded-md bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700'
          }
        >
          {r.status}
        </span>
      ),
    },
    { key: 'attemptedAt', label: 'Attempted Date' },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner icon={BarChart3} title="Results & Analytics" className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Tests" value={kpis.totalTests} color="#246392" graphColor="#55ace7" icon={ClipboardList} />
        <StatCard title="Total Attempts" value={kpis.totalAttempts} color="#55ace7" graphColor="#246392" icon={TrendingUp} />
        <StatCard title="Average Score" value={`${Math.round(kpis.averageScore)}%`} color="#655ed3" graphColor="#55ace7" icon={Percent} />
        <StatCard title="Highest Score" value={`${Math.round(kpis.highestScore)}%`} color="#39bf2e" graphColor="#55ace7" icon={Award} />
        <StatCard title="Lowest Score" value={`${Math.round(kpis.lowestScore)}%`} color="#c96565" graphColor="#ef8b8b" icon={Award} />
        <StatCard title="Pass Percentage" value={`${Math.round(kpis.passPct)}%`} color="#1a3a5c" graphColor="#55ace7" icon={Percent} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreDistributionBars buckets={distribution} />
        <PassFailSplit passPct={Math.round(kpis.passPct)} failPct={Math.round(100 - kpis.passPct)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubjectWiseBars rows={subjectWise} />
        <PerformanceTrend points={trend} />
      </div>

      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search results"
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
          />
        </div>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No results found."
        itemLabel="results"
        resetDeps={[search]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
      />
    </div>
  )
}

