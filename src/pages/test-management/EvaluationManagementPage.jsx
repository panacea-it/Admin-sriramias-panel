import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Eye, Save, UploadCloud, History, RefreshCcw, Send, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import StatCard from '../../components/dashboard/StatCard'
import TableActionMenu, { tableActionsCellClass, tableActionsHeaderClass } from '../../components/common/TableActionMenu'
import EvaluationStatusBadge from '../../components/evaluation-management/EvaluationStatusBadge'
import EvaluationFilterToolbar from '../../components/evaluation-management/EvaluationFilterToolbar'
import AssignEvaluatorModal from '../../components/evaluation-management/AssignEvaluatorModal'
import EvaluationHistoryModal from '../../components/evaluation-management/EvaluationHistoryModal'
import {
  assignEvaluations,
  fetchEvaluationLookups,
  fetchEvaluations,
  publishEvaluation,
  requestRecheck,
  saveEvaluationDraft,
} from '../../api/evaluationManagementAPI'

function avgMarks(rows) {
  const nums = rows.map((r) => Number(r.marks)).filter((n) => Number.isFinite(n))
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

export default function EvaluationManagementPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({ students: [], tests: [], evaluators: [] })

  const [filters, setFilters] = useState({
    studentId: 'all',
    testId: 'all',
    evaluatorId: 'all',
    status: 'all',
    from: '',
    to: '',
    search: '',
  })

  const [assignOpen, setAssignOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyRow, setHistoryRow] = useState(null)

  const reload = async (params = filters) => {
    setLoading(true)
    try {
      const [lkp, list] = await Promise.all([fetchEvaluationLookups(), fetchEvaluations(params)])
      setLookups(lkp || { students: [], tests: [], evaluators: [] })
      setRows(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load evaluations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    reload(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.studentId, filters.testId, filters.evaluatorId, filters.status, filters.from, filters.to, filters.search])

  const kpis = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((r) => r.status === 'Pending').length
    const inReview = rows.filter((r) => r.status === 'In Review').length
    const draft = rows.filter((r) => r.status === 'Draft Saved').length
    const published = rows.filter((r) => r.status === 'Published').length
    const rechecking = rows.filter((r) => r.status === 'Rechecking').length
    const average = avgMarks(rows.filter((r) => r.status === 'Published' || r.status === 'Draft Saved'))
    return { total, pending, inReview, draft, published, average, rechecking }
  }, [rows])

  const resetFilters = () => {
    setFilters({
      studentId: 'all',
      testId: 'all',
      evaluatorId: 'all',
      status: 'all',
      from: '',
      to: '',
      search: '',
    })
    toast.message('Filters reset')
  }

  const openHistory = (row) => {
    setHistoryRow(row)
    setHistoryOpen(true)
  }

  const quickSaveDraft = async (row) => {
    const saved = await saveEvaluationDraft(row.id, { status: 'Draft Saved' }, { actor: 'Mentor' })
    setRows((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...saved } : r)))
    toast.success('Draft saved')
  }

  const quickPublish = async (row) => {
    const saved = await publishEvaluation(row.id, { actor: 'Mentor' })
    setRows((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...saved } : r)))
    toast.success('Published')
  }

  const quickRecheck = async (row) => {
    const saved = await requestRecheck(row.id, { remarks: 'Recheck requested from dashboard.' }, { actor: 'Admin' })
    setRows((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...saved } : r)))
    toast.success('Recheck requested')
  }

  const columns = [
    { key: 'id', label: 'Evaluation ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10 font-semibold text-[#1a3a5c]' },
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'testName', label: 'Test Name', render: (r) => <span className="max-w-[420px] truncate font-medium text-slate-800">{r.testName}</span> },
    { key: 'evaluatorName', label: 'Evaluator', render: (r) => <span className="font-semibold text-slate-700">{r.evaluatorName}</span> },
    { key: 'marks', label: 'Marks', align: 'center', render: (r) => <span className="font-bold text-[#1a3a5c]">{r.marks == null ? '—' : r.marks}</span> },
    { key: 'status', label: 'Status', align: 'center', render: (r) => <EvaluationStatusBadge status={r.status} /> },
    { key: 'updatedAt', label: 'Last Updated', render: (r) => <span className="text-sm font-semibold text-slate-600">{r.updatedAt || '—'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: tableActionsHeaderClass,
      cellClassName: tableActionsCellClass,
      render: (row) => (
        <TableActionMenu
          triggerLabel="Evaluation actions"
          items={[
            { label: 'Open Evaluation', icon: Eye, onClick: () => navigate(`/test-management/evaluation-management/${encodeURIComponent(String(row.id))}`) },
            { label: 'Save Draft', icon: Save, onClick: () => quickSaveDraft(row), disabled: row.locked },
            { label: 'Publish', icon: Send, onClick: () => quickPublish(row), disabled: row.locked },
            { label: 'Request Recheck', icon: RefreshCcw, onClick: () => quickRecheck(row) },
            { label: 'View History', icon: History, onClick: () => openHistory(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={ClipboardCheck}
        title="Evaluation Management"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition hover:bg-white sm:text-base"
          >
            <Users className="h-4 w-4" strokeWidth={2.2} />
            Assign Evaluator
          </button>
          <button
            type="button"
            onClick={() => reload(filters)}
            className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition hover:bg-white sm:text-base"
          >
            <UploadCloud className="h-4 w-4" strokeWidth={2.2} />
            Refresh
          </button>
        </div>
      </PageBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Evaluations" value={kpis.total} color="#246392" graphColor="#55ace7" icon={ClipboardCheck} />
        <StatCard title="Pending Evaluations" value={kpis.pending} color="#f59e0b" graphColor="#f59e0b" icon={ClipboardCheck} />
        <StatCard title="Draft Evaluations" value={kpis.draft} color="#2563eb" graphColor="#55ace7" icon={ClipboardCheck} />
        <StatCard title="Published Results" value={kpis.published} color="#16a34a" graphColor="#16a34a" icon={ClipboardCheck} />
        <StatCard title="Average Marks" value={kpis.average} color="#1a3a5c" graphColor="#55ace7" icon={ClipboardCheck} />
        <StatCard title="Rechecking Requests" value={kpis.rechecking} color="#dc2626" graphColor="#dc2626" icon={ClipboardCheck} />
      </div>

      <EvaluationFilterToolbar
        students={lookups.students}
        tests={lookups.tests}
        evaluators={lookups.evaluators}
        values={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No evaluations found."
        itemLabel="evaluations"
        resetDeps={[filters.studentId, filters.testId, filters.evaluatorId, filters.status, filters.from, filters.to, filters.search]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
        stickyLastColumn
        zebraStriping
        density="comfortable"
      />

      <AssignEvaluatorModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        lookups={lookups}
        onAssign={async (payload) => {
          await assignEvaluations(payload)
          await reload(filters)
        }}
      />

      <EvaluationHistoryModal
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false)
          setHistoryRow(null)
        }}
        evaluation={historyRow}
      />
    </div>
  )
}

