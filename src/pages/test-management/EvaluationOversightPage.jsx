import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, FileText, Clock, CheckCircle2, Timer, Download, UserPlus } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import StatCard from '../../components/dashboard/StatCard'
import ErrorState from '../../components/feedback/ErrorState'
import EvaluationOversightFilters from '../../components/test-management/evaluation-oversight/EvaluationOversightFilters'
import EvaluationOversightStudentsTable from '../../components/test-management/evaluation-oversight/EvaluationOversightStudentsTable'
import EvaluationOversightBulkActionsBar from '../../components/test-management/evaluation-oversight/EvaluationOversightBulkActionsBar'
import AssignEvaluatorQuickModal from '../../components/test-management/evaluation-oversight/AssignEvaluatorQuickModal'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
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
  const [loadError, setLoadError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [assignPaper, setAssignPaper] = useState(null)

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const queryParams = useMemo(() => ({ ...filters }), [filters])

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [statsRes, tableRes] = await Promise.all([
        fetchEvaluationDashboardStats(),
        fetchEvaluationTableData(queryParams),
      ])
      setStats(statsRes)
      setRows(tableRes)
    } catch (err) {
      const message = err?.message || 'Failed to load evaluations'
      setLoadError(message)
      toast.error(message)
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

  useEffect(() => {
    clearSelection()
  }, [
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
    clearSelection,
  ])

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
    setExporting(true)
    try {
      const { count } = await exportEvaluationCsv(queryParams)
      toast.success(`Exported ${count ?? rows.length} records`)
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const openBulkAssign = () => {
    if (!selectedIds.length) {
      toast.error('Select at least one paper')
      return
    }
    navigate(TEST_MANAGEMENT_ROUTES.evaluationAssign, {
      state: {
        assignmentContext: {
          batchId: filters.batchId !== 'all' ? filters.batchId : '',
          subjectId: filters.subjectId !== 'all' ? filters.subjectId : '',
          subTopicId: filters.subTopicId !== 'all' ? filters.subTopicId : '',
          testId: filters.testId !== 'all' ? filters.testId : '',
          paperIds: selectedIds,
        },
      },
    })
  }

  const openAssignEvaluators = () => {
    navigate(TEST_MANAGEMENT_ROUTES.evaluationAssign, {
      state: {
        assignmentContext: {
          batchId: filters.batchId !== 'all' ? filters.batchId : '',
          subjectId: filters.subjectId !== 'all' ? filters.subjectId : '',
          subTopicId: filters.subTopicId !== 'all' ? filters.subTopicId : '',
          testId: filters.testId !== 'all' ? filters.testId : '',
          paperIds: selectedIds.length ? selectedIds : undefined,
        },
      },
    })
  }

  const tableResetDeps = useMemo(
    () => [
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
    ],
    [filters],
  )

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search.trim() ||
          filters.batchId !== 'all' ||
          filters.programId !== 'all' ||
          filters.mentorId !== 'all' ||
          filters.subjectId !== 'all' ||
          filters.subTopicId !== 'all' ||
          filters.testId !== 'all' ||
          filters.status !== 'all' ||
          filters.priority !== 'all' ||
          filters.examType !== 'all' ||
          filters.centerId !== 'all' ||
          filters.submittedFrom ||
          filters.submittedTo,
      ),
    [filters],
  )

  const emptyMessage = hasActiveFilters
    ? 'No papers match the selected filters.'
    : 'No evaluation papers to display.'

  const emptyState =
    loadError || hasActiveFilters
      ? undefined
      : (
          <div className="px-4 py-6 sm:px-6">
            <ErrorState
              title="No evaluation papers to display"
              message="If you expected data here, the server may be unavailable. Try loading again or adjust your filters."
              onRetry={loadData}
            />
          </div>
        )

  const recordSummary = loading
    ? 'Loading records…'
    : `Showing ${rows.length} record${rows.length === 1 ? '' : 's'} based on active filters`

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

      <div className="w-full max-w-full rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1a3a5c]">Student Paper Evaluation Status</h3>
            <p className="mt-0.5 text-xs font-medium text-[#686868]">{recordSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className={cn('h-4 w-4', exporting && 'animate-pulse')} />
              {exporting ? 'Downloading…' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={openAssignEvaluators}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#55ace7] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#4699d4]"
            >
              <UserPlus className="h-4 w-4" />
              Assign Evaluators
            </button>
          </div>
        </div>

        {loadError && !loading ? (
          <ErrorState
            title="Unable to load evaluation papers"
            message={loadError}
            onRetry={loadData}
          />
        ) : (
          <>
            {selectedIds.length > 0 && (
              <EvaluationOversightBulkActionsBar
                className="mb-4"
                count={selectedIds.length}
                onBulkAssign={openBulkAssign}
                onClearSelection={clearSelection}
              />
            )}

            <div className="w-full overflow-hidden rounded-xl border border-slate-100">
              <EvaluationOversightStudentsTable
                rows={rows}
                loading={loading}
                resetDeps={tableResetDeps}
                selection={selection}
                emptyMessage={emptyMessage}
                emptyState={emptyState}
                onViewPaper={(row) => openWorkspace(row, 'view')}
                onAssignEvaluator={setAssignPaper}
                onOpenEvaluation={(row) =>
                  openWorkspace(row, row.status === 'Evaluated' ? 'view' : 'evaluate')
                }
              />
            </div>
          </>
        )}
      </div>

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
