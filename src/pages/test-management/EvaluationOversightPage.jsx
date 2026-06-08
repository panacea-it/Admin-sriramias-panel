import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  FileText,
  Clock,
  CheckCircle2,
  Timer,
  Download,
  UserPlus,
} from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import StatCard from '../../components/dashboard/StatCard'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import TableActionMenu, {
  tableActionsCellClass,
  tableActionsHeaderClass,
} from '../../components/common/TableActionMenu'
import EvaluationOversightFilters from '../../components/test-management/evaluation-oversight/EvaluationOversightFilters'
import PaperEvaluationStatusBadge from '../../components/test-management/evaluation-oversight/PaperEvaluationStatusBadge'
import AssignEvaluatorQuickModal from '../../components/test-management/evaluation-oversight/AssignEvaluatorQuickModal'
import {
  exportEvaluationCsv,
  fetchEvaluationDashboardStats,
  fetchEvaluationFilterOptions,
  fetchEvaluationTableData,
} from '../../api/evaluationOversightAPI'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const DEFAULT_FILTERS = {
  batchId: 'all',
  programId: 'all',
  mentorId: 'all',
  subjectId: 'all',
  subTopicId: 'all',
  testId: 'all',
  status: 'all',
  priority: 'all',
  examType: 'all',
  centerId: 'all',
  submittedFrom: '',
  submittedTo: '',
  search: '',
}

function MentorCell({ row }) {
  if (!row.mentorName) {
    return (
      <span className="inline-flex items-center gap-2 italic text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px]">
          —
        </span>
        Unassigned
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: '#55ace7' }}
      >
        {row.mentorInitials || row.mentorName.slice(0, 2)}
      </span>
      <span className="font-medium text-[#333]">{row.mentorName}</span>
    </span>
  )
}

export default function EvaluationOversightPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [filterOptions, setFilterOptions] = useState({
    batches: [],
    subjects: [],
    subTopics: [],
    tests: [],
    mentors: [],
    statuses: [],
    priorities: [],
    examTypes: [],
    centers: [],
    programs: [],
  })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignPaper, setAssignPaper] = useState(null)

  const queryParams = useMemo(() => ({ ...filters }), [filters])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, tableRes] = await Promise.all([
        fetchEvaluationDashboardStats(queryParams),
        fetchEvaluationTableData(queryParams),
      ])
      setStats(statsRes)
      setRows(tableRes)
    } catch (err) {
      toast.error(err?.message || 'Failed to load evaluations')
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  useEffect(() => {
    fetchEvaluationFilterOptions({
      batchId: filters.batchId,
      subjectId: filters.subjectId,
      programId: filters.programId,
    })
      .then(setFilterOptions)
      .catch(() => {})
  }, [filters.batchId, filters.subjectId, filters.programId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFilterChange = (updater) => {
    setFilters((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next.batchId !== prev.batchId) {
        return { ...next, subjectId: 'all', subTopicId: 'all', testId: 'all' }
      }
      if (next.programId !== prev.programId) {
        return { ...next, subjectId: 'all', subTopicId: 'all', testId: 'all' }
      }
      if (next.subjectId !== prev.subjectId) {
        return { ...next, subTopicId: 'all', testId: 'all' }
      }
      return next
    })
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const openWorkspace = (row, mode = 'view') => {
    navigate(TEST_MANAGEMENT_ROUTES.evaluationWorkspace(row.id), {
      state: { mode },
    })
  }

  const handleExport = async () => {
    try {
      const { count } = await exportEvaluationCsv(queryParams)
      toast.success(`Exported ${count} records`)
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        render: (r) => <span className="font-semibold text-[#1a3a5c]">{r.studentName}</span>,
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
        render: (r) => <span className="text-slate-500">{r.rollNumber}</span>,
      },
      { key: 'testName', label: 'Test Name' },
      { key: 'subjectName', label: 'Subject' },
      {
        key: 'examType',
        label: 'Type',
        render: (r) => (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {r.examType || '—'}
          </span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        render: (r) => (
          <span
            className={cn(
              'text-xs font-bold',
              r.priority === 'High' && 'text-red-600',
              r.priority === 'Normal' && 'text-slate-600',
              r.priority === 'Low' && 'text-slate-400',
            )}
          >
            {r.priority || 'Normal'}
          </span>
        ),
      },
      { key: 'centerName', label: 'Center', render: (r) => <span className="text-xs text-slate-600">{r.centerName}</span> },
      {
        key: 'mentorName',
        label: 'Mentor Assigned',
        render: (r) => <MentorCell row={r} />,
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => <PaperEvaluationStatusBadge status={r.status} />,
      },
      {
        key: 'scoreDisplay',
        label: 'Score',
        align: 'center',
        render: (r) => (
          <span
            className={cn(
              'font-bold',
              r.status === 'Evaluated' ? 'text-[#1a3a5c]' : 'text-slate-500',
            )}
          >
            {r.scoreDisplay}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: tableActionsHeaderClass,
        cellClassName: tableActionsCellClass,
        render: (row) => (
          <TableActionMenu
            triggerLabel="Paper actions"
            items={[
              {
                label: 'View Paper',
                onClick: () => openWorkspace(row, 'view'),
              },
              {
                label: 'Assign Evaluator',
                onClick: () => setAssignPaper(row),
              },
              {
                label: row.status === 'Evaluated' ? 'View Evaluation' : 'Start Evaluation',
                onClick: () =>
                  openWorkspace(row, row.status === 'Evaluated' ? 'view' : 'evaluate'),
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  )

  return (
    <TestManagementPageShell icon={ClipboardCheck} title="Evaluation Oversight">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Papers"
          value={stats?.totalPapers?.toLocaleString?.() ?? '—'}
          color="#246392"
          graphColor="#55ace7"
          icon={FileText}
          badge="+12%"
          badgeLabel="from last batch"
        />
        <StatCard
          title="Pending Evaluation"
          value={stats?.pendingEvaluation?.toLocaleString?.() ?? '—'}
          color="#ef4444"
          graphColor="#ef4444"
          icon={Clock}
          badgeLabel={stats?.pendingLabel || 'High Priority'}
        />
        <StatCard
          title="Evaluated Today"
          value={stats?.evaluatedToday?.toLocaleString?.() ?? '—'}
          color="#10b981"
          graphColor="#10b981"
          icon={CheckCircle2}
          badgeLabel={stats?.evaluatedTodayLabel || 'Last updated 2m ago'}
        />
        <StatCard
          title="Avg. Evaluation Time"
          value={stats?.avgEvaluationTime ?? '14.2m'}
          color="#1a3a5c"
          graphColor="#55ace7"
          icon={Timer}
          badge="-2.4m"
          badgeDown
          badgeLabel="improvement"
        />
      </div>

      <EvaluationOversightFilters
        options={filterOptions}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        loading={loading}
      />

      <article className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <h3 className="text-sm font-bold text-[#1a3a5c]">Student Paper Evaluation Status</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Showing {rows.length} records based on active filters
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(TEST_MANAGEMENT_ROUTES.evaluationAssign, {
                  state: {
                    assignmentContext: {
                      batchId: filters.batchId !== 'all' ? filters.batchId : 'BATCH-2024-A',
                      subjectId: filters.subjectId !== 'all' ? filters.subjectId : 'SUB-MATH',
                      testId: filters.testId !== 'all' ? filters.testId : 'TST-MID-MATH',
                    },
                  },
                })
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#55ace7] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#4699d4]"
            >
              <UserPlus className="h-4 w-4" />
              Assign Evaluators
            </button>
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <PaginatedFigmaTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyMessage="No papers match the selected filters."
            itemLabel="records"
            initialPageSize={10}
            density="compact"
            stickyHeader
            stickyLastColumn
            resetDeps={[
              filters.batchId,
              filters.programId,
              filters.mentorId,
              filters.subjectId,
              filters.subTopicId,
              filters.testId,
              filters.status,
              filters.priority,
              filters.examType,
              filters.centerId,
              filters.submittedFrom,
              filters.submittedTo,
              filters.search,
            ]}
          />
        </div>
      </article>

      <AssignEvaluatorQuickModal
        open={!!assignPaper}
        paper={assignPaper}
        onClose={() => setAssignPaper(null)}
        onAssigned={(updated) => {
          setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
          setAssignPaper(null)
        }}
      />
    </TestManagementPageShell>
  )
}
