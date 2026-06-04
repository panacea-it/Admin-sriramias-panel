import { useState } from 'react'
import { ClipboardCheck, Clock, CheckCircle, RotateCcw } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import StatCard from '../../components/dashboard/StatCard'
import {
  EVALUATIONS_COMPLETED,
  EVALUATIONS_PENDING,
  EVALUATION_TIMELINE,
  REEVALUATION_REQUESTS,
} from '../../data/evaluationsWorkflowSeed'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'

export default function EvaluationsWorkflowPage() {
  const [pending, setPending] = useState(EVALUATIONS_PENDING)
  const [reeval, setReeval] = useState(REEVALUATION_REQUESTS)

  const pendingCols = [
    { key: 'student', label: 'Student' },
    { key: 'test', label: 'Test' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'due', label: 'Due' },
    {
      key: 'priority',
      label: 'Priority',
      render: (r) => <StatusBadge status={r.priority} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <BannerButton
          type="button"
          variant="secondary"
          className="!px-2 !py-1 text-xs"
          onClick={() => {
            setPending((p) => p.filter((x) => x.id !== row.id))
            toast.success(`Evaluation started for ${row.student}`)
          }}
        >
          Start
        </BannerButton>
      ),
    },
  ]

  return (
    <TestManagementPageShell icon={ClipboardCheck} title="Evaluations">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Pending" value={pending.length} color="#f59e0b" icon={Clock} />
        <StatCard title="Completed" value={EVALUATIONS_COMPLETED.length} color="#10b981" icon={CheckCircle} />
        <StatCard title="Re-evaluation" value={reeval.length} color="#8b5cf6" icon={RotateCcw} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Pending Evaluations</h3>
          <PaginatedFigmaTable columns={pendingCols} data={pending} itemLabel="pending" initialPageSize={5} />
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Evaluation Timeline</h3>
          <ol className="space-y-3">
            {EVALUATION_TIMELINE.map((step) => (
              <li key={step.step} className="flex gap-3">
                <span
                  className={cn(
                    'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                    step.status === 'done' && 'bg-emerald-500',
                    step.status === 'active' && 'bg-[#55ace7] ring-4 ring-[#55ace7]/20',
                    step.status === 'pending' && 'bg-slate-300',
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-[#333]">{step.step}</p>
                  <p className="text-xs text-slate-500">{step.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
        <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Re-evaluation Requests</h3>
        <PaginatedFigmaTable
          columns={[
            { key: 'student', label: 'Student' },
            { key: 'test', label: 'Test' },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <BannerButton
                  type="button"
                  variant="secondary"
                  className="!px-2 !py-1 text-xs"
                  onClick={() => {
                    setReeval((list) =>
                      list.map((r) => (r.id === row.id ? { ...r, status: 'Approved' } : r)),
                    )
                    toast.success('Re-evaluation approved')
                  }}
                >
                  Approve
                </BannerButton>
              ),
            },
          ]}
          data={reeval}
          itemLabel="requests"
        />
      </article>
    </TestManagementPageShell>
  )
}
