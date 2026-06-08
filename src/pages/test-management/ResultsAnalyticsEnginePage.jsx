import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Award, ClipboardCheck, Percent, Users, Clock, Download } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import StatCard from '../../components/dashboard/StatCard'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import ResultStatusBadge from '../../components/test-management/ResultStatusBadge'
import ResultActionMenu from '../../components/test-management/ResultActionMenu'
import StudentResultViewModal from '../../components/test-management/StudentResultViewModal'
import ResultAnalyticsModal from '../../components/test-management/ResultAnalyticsModal'
import ComparePerformanceModal from '../../components/test-management/ComparePerformanceModal'
import PublishResultConfirmModal from '../../components/test-management/PublishResultConfirmModal'
import { toast } from '@/utils/toast'
import {
  fetchResultsEngine,
  fetchResultsEngineMeta,
  publishResultEngine,
} from '../../api/testManagementAPI'
import { buildExportFileName, buildStudentReportHtml, downloadResultsExcel, openPrintablePdfLikeReport } from '../../utils/testManagement/reportExport'
import { getWeakSubjects } from '../../utils/testManagement/analyticsEngine'

function asNum(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'h-10 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-extrabold text-white'
          : 'h-10 rounded-lg bg-[#eef2fc] px-4 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff]'
      }
    >
      {children}
    </button>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg bg-[#eef2fc] px-3 text-sm font-semibold text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]"
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}

export default function ResultsAnalyticsEnginePage() {
  const [meta, setMeta] = useState({ batches: [], students: [], tests: [], subjects: [], statuses: [] })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeView, setActiveView] = useState('admin') // admin | faculty | student | batch | subject

  const [draftFilters, setDraftFilters] = useState({
    batchId: 'all',
    studentId: 'all',
    testId: 'all',
    subjectId: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)

  const [selectedRow, setSelectedRow] = useState(null)
  const [openResult, setOpenResult] = useState(false)
  const [openAnalytics, setOpenAnalytics] = useState(false)
  const [openCompare, setOpenCompare] = useState(false)
  const [openPublish, setOpenPublish] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const m = await fetchResultsEngineMeta()
        if (!alive) return
        setMeta(m)
      } catch (e) {
        toast.error(e?.message || 'Failed to load filters')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchResultsEngine(appliedFilters)
        if (!alive) return
        setRows(list || [])
      } catch (e) {
        toast.error(e?.message || 'Failed to load results')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [appliedFilters])

  const kpis = useMemo(() => {
    const totalStudents = new Set(rows.map((r) => r.studentId)).size
    const totalTestsEvaluated = rows.filter((r) => r.status === 'Evaluated' || r.status === 'Published').length
    const scores = rows
      .filter((r) => r.status !== 'Processing')
      .map((r) => asNum(r.percentage))
    const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const highestScore = scores.length ? Math.max(...scores) : 0
    const airPublished = rows.filter((r) => r.status === 'Published' && r.airRank != null).length
    const pendingResults = rows.filter((r) => r.status === 'Processing').length
    return {
      totalStudents,
      totalTestsEvaluated,
      averageScore: Math.round(averageScore),
      highestScore: Math.round(highestScore),
      airPublished,
      pendingResults,
    }
  }, [rows])

  const weakForFaculty = useMemo(() => {
    const evaluated = rows.filter((r) => r.status === 'Evaluated' || r.status === 'Published')
    return getWeakSubjects(evaluated, { top: 4 })
  }, [rows])

  const columns = useMemo(() => {
    return [
      { key: 'resultId', label: 'Result ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'testName', label: 'Test Name' },
      { key: 'subject', label: 'Subject' },
      {
        key: 'score',
        label: 'Score',
        render: (r) => <span className="font-extrabold text-[#1a3a5c]">{r.score}/{r.total}</span>,
      },
      {
        key: 'percentage',
        label: 'Percentage',
        render: (r) => <span className="font-bold text-slate-700">{r.percentage}%</span>,
      },
      {
        key: 'airRank',
        label: 'AIR Rank',
        render: (r) => <span className="font-extrabold text-[#246392]">{r.airRank ?? '—'}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => <ResultStatusBadge status={r.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <ResultActionMenu
            row={r}
            onViewResult={(x) => {
              setSelectedRow(x)
              setOpenResult(true)
            }}
            onViewAnalytics={(x) => {
              setSelectedRow(x)
              setOpenAnalytics(true)
            }}
            onCompare={(x) => {
              setSelectedRow(x)
              setOpenCompare(true)
            }}
            onPublish={(x) => {
              setSelectedRow(x)
              setOpenPublish(true)
            }}
            onDownloadReport={(x) => {
              setSelectedRow(x)
              // default: Excel download for the single row
              const filename = buildExportFileName(`${x.studentName}_${x.testName}_report`, 'xlsx')
              downloadResultsExcel([x], { filename, sheetName: 'Student Report' })
              toast.success('Report downloaded (Excel)')
            }}
          />
        ),
      },
    ]
  }, [])

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters })
    toast.success('Filters applied')
  }

  const resetFilters = () => {
    const next = {
      batchId: 'all',
      studentId: 'all',
      testId: 'all',
      subjectId: 'all',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      search: '',
    }
    setDraftFilters(next)
    setAppliedFilters(next)
    toast.message('Filters reset')
  }

  const exportAllExcel = () => {
    const filename = buildExportFileName('results_analytics_engine', 'xlsx')
    downloadResultsExcel(rows, { filename, sheetName: 'Results' })
    toast.success('Exported results (Excel)')
  }

  const downloadPdfLike = () => {
    if (!selectedRow) return
    const html = buildStudentReportHtml({
      student: {
        name: selectedRow.studentName,
        rollNumber: selectedRow.rollNumber,
        batchName: selectedRow.batchName,
      },
      test: {
        testName: selectedRow.testName,
        subject: selectedRow.subject,
        testDate: selectedRow.testDate,
      },
      result: selectedRow,
      insights: { weakSubjects: getWeakSubjects(rows.filter((r) => r.studentId === selectedRow.studentId), { top: 3 }) },
    })
    const ok = openPrintablePdfLikeReport({ title: 'Student Report', html })
    if (!ok) toast.warning('Popup blocked. Please allow popups to download PDF.')
  }

  const onConfirmPublish = async () => {
    if (!selectedRow) return
    const id = selectedRow.resultId || selectedRow.id
    const t = toast.loading('Publishing result…')
    try {
      await publishResultEngine(id)
      toast.dismiss(t)
      toast.success('Result published')
      setOpenPublish(false)
      setAppliedFilters((s) => ({ ...s }))
    } catch (e) {
      toast.dismiss(t)
      toast.error(e?.message || 'Failed to publish result')
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={BarChart3}
        title="Result & Analytics Engine"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      />

      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:p-4">
        <SegmentButton active={activeView === 'admin'} onClick={() => setActiveView('admin')}>Admin Dashboard</SegmentButton>
        <SegmentButton active={activeView === 'faculty'} onClick={() => setActiveView('faculty')}>Faculty Dashboard</SegmentButton>
        <SegmentButton active={activeView === 'student'} onClick={() => setActiveView('student')}>Student Dashboard</SegmentButton>
        <SegmentButton active={activeView === 'batch'} onClick={() => setActiveView('batch')}>Batch Analytics</SegmentButton>
        <SegmentButton active={activeView === 'subject'} onClick={() => setActiveView('subject')}>Subject Analytics</SegmentButton>
      </div>

      {/* Top analytics cards (common) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Students" value={kpis.totalStudents} color="#246392" graphColor="#55ace7" icon={Users} />
        <StatCard title="Total Tests Evaluated" value={kpis.totalTestsEvaluated} color="#55ace7" graphColor="#246392" icon={ClipboardCheck} />
        <StatCard title="Average Score" value={`${kpis.averageScore}%`} color="#655ed3" graphColor="#55ace7" icon={Percent} />
        <StatCard title="Highest Score" value={`${kpis.highestScore}%`} color="#39bf2e" graphColor="#55ace7" icon={Award} />
        <StatCard title="AIR Published" value={kpis.airPublished} color="#1a3a5c" graphColor="#55ace7" icon={Award} />
        <StatCard title="Pending Results" value={kpis.pendingResults} color="#f59e0b" graphColor="#f59e0b" icon={Clock} />
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-base font-extrabold text-[#1a3a5c]">Filters</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAllExcel}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#eef2fc] px-4 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff]"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <Select
            value={draftFilters.batchId}
            onChange={(v) => setDraftFilters((s) => ({ ...s, batchId: v }))}
            options={meta.batches}
            placeholder="Batch"
          />
          <Select
            value={draftFilters.studentId}
            onChange={(v) => setDraftFilters((s) => ({ ...s, studentId: v }))}
            options={meta.students.map((s) => ({ id: s.id, name: `${s.name} (${s.rollNumber})` }))}
            placeholder="Student"
          />
          <Select
            value={draftFilters.testId}
            onChange={(v) => setDraftFilters((s) => ({ ...s, testId: v }))}
            options={meta.tests}
            placeholder="Test"
          />
          <Select
            value={draftFilters.subjectId}
            onChange={(v) => setDraftFilters((s) => ({ ...s, subjectId: v }))}
            options={meta.subjects}
            placeholder="Subject"
          />
          <input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(e) => setDraftFilters((s) => ({ ...s, dateFrom: e.target.value }))}
            className="h-10 w-full rounded-lg bg-[#eef2fc] px-3 text-sm font-semibold text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]"
            aria-label="Date from"
          />
          <input
            type="date"
            value={draftFilters.dateTo}
            onChange={(e) => setDraftFilters((s) => ({ ...s, dateTo: e.target.value }))}
            className="h-10 w-full rounded-lg bg-[#eef2fc] px-3 text-sm font-semibold text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]"
            aria-label="Date to"
          />
          <select
            value={draftFilters.status}
            onChange={(e) => setDraftFilters((s) => ({ ...s, status: e.target.value }))}
            className="h-10 w-full rounded-lg bg-[#eef2fc] px-3 text-sm font-semibold text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]"
          >
            <option value="all">Result Status</option>
            {meta.statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
            <input
              type="search"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((s) => ({ ...s, search: e.target.value }))}
              placeholder="Search by student, roll, test, subject, batch, result ID"
              className="h-10 w-full rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]"
            />
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="h-10 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-extrabold text-white hover:opacity-95"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-lg bg-[#eef2fc] px-4 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* View-specific panels */}
      {activeView !== 'admin' && (
        <div className="rounded-xl bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:p-5">
          {activeView === 'faculty' && (
            <div className="space-y-3">
              <div className="text-base font-extrabold text-[#1a3a5c]">Faculty Dashboard (Batch / Subject Weak Areas)</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {weakForFaculty.map((w) => (
                  <div key={w.subject} className="rounded-xl bg-[#fff7ed] p-4 ring-1 ring-orange-200">
                    <div className="text-sm font-extrabold text-orange-800">{w.subject}</div>
                    <div className="mt-1 text-sm font-semibold text-orange-900/90">Avg: {w.avg}%</div>
                    <div className="mt-2 text-xs font-semibold text-orange-900/70">Auto-identified weak area from evaluated results.</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeView === 'student' && (
            <div className="space-y-2">
              <div className="text-base font-extrabold text-[#1a3a5c]">Student Dashboard</div>
              <div className="text-sm font-semibold text-slate-700">
                Use filters to pick a student, then “View Result / View Analytics” from the table to see AIR, strengths, weaknesses, progress charts, and recommendations.
              </div>
            </div>
          )}
          {activeView === 'batch' && (
            <div className="space-y-2">
              <div className="text-base font-extrabold text-[#1a3a5c]">Batch Analytics</div>
              <div className="text-sm font-semibold text-slate-700">
                Filter by Batch to see batch average, topper distribution (via Compare), and rank spread (AIR is computed per test with tie support).
              </div>
            </div>
          )}
          {activeView === 'subject' && (
            <div className="space-y-2">
              <div className="text-base font-extrabold text-[#1a3a5c]">Subject Analytics</div>
              <div className="text-sm font-semibold text-slate-700">
                Filter by Subject to review highest/lowest/average performance patterns and drill down via Analytics view.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Results Table */}
      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No results found."
        itemLabel="results"
        resetDeps={[appliedFilters.batchId, appliedFilters.studentId, appliedFilters.testId, appliedFilters.subjectId, appliedFilters.dateFrom, appliedFilters.dateTo, appliedFilters.status, appliedFilters.search]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
      />

      <StudentResultViewModal
        open={openResult}
        onClose={() => setOpenResult(false)}
        row={selectedRow}
        allRows={rows}
      />
      <ResultAnalyticsModal
        open={openAnalytics}
        onClose={() => setOpenAnalytics(false)}
        row={selectedRow}
        cohortRows={rows}
      />
      <ComparePerformanceModal
        open={openCompare}
        onClose={() => setOpenCompare(false)}
        row={selectedRow}
        cohortRows={rows}
      />
      <PublishResultConfirmModal
        open={openPublish}
        onClose={() => setOpenPublish(false)}
        row={selectedRow}
        onConfirm={onConfirmPublish}
      />

      {/* Extra: quick PDF-like download for selected row */}
      {selectedRow && (
        <div className="rounded-xl bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-[#1a3a5c]">Downloadable Reports</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">
                Selected: <span className="font-extrabold text-[#246392]">{selectedRow.studentName}</span> • {selectedRow.testName}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const filename = buildExportFileName(`${selectedRow.studentName}_${selectedRow.testName}_report`, 'xlsx')
                  downloadResultsExcel([selectedRow], { filename, sheetName: 'Student Report' })
                  toast.success('Report downloaded (Excel)')
                }}
                className="h-10 rounded-lg bg-[#eef2fc] px-4 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff]"
              >
                Download Excel
              </button>
              <button
                type="button"
                onClick={downloadPdfLike}
                className="h-10 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-extrabold text-white hover:opacity-95"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

