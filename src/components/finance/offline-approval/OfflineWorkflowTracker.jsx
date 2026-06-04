import FinanceTimeline from '../FinanceTimeline'
import { OFFLINE_WORKFLOW_STATUSES } from '../../../constants/offlinePaymentApproval'
import { buildOfflineWorkflowTimeline } from '../../../utils/offlinePaymentApproval'
import { cn } from '../../../utils/cn'

const STEPS = [
  { key: 'Pending', label: 'Submitted' },
  { key: 'Under Verification', label: 'Branch verification' },
  { key: 'Reconciliation Pending', label: 'Reconciliation' },
  { key: 'Approved', label: 'Finance approval' },
]

function stepIndex(status) {
  if (status === 'Rejected') return -1
  const idx = STEPS.findIndex((s) => s.key === status)
  if (idx >= 0) return idx
  if (status === 'Approved') return STEPS.length - 1
  return 0
}

export default function OfflineWorkflowTracker({ row, compact = false }) {
  if (!row) return null
  const status = row.workflowStatus || row.status
  const current = stepIndex(status)
  const rejected = status === 'Rejected' || row.status === 'Rejected'

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1',
          rejected
            ? 'bg-[#df8284]/15 text-[#b94b4b] ring-[#df8284]/30'
            : 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
        )}
      >
        {rejected ? 'Rejected' : status}
      </span>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((step, i) => {
          const done = !rejected && current >= i
          const active = !rejected && current === i
          return (
            <div key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  done ? 'bg-[#69df66] text-white' : active ? 'bg-[#55ace7] text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {i + 1}
              </span>
              <span className={cn('text-xs font-medium', active ? 'text-[#246392]' : 'text-[#686868]')}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-slate-200 sm:block" aria-hidden />}
            </div>
          )
        })}
        {rejected && (
          <span className="rounded-md bg-[#df8284]/15 px-2 py-1 text-xs font-semibold text-[#b94b4b]">Rejected</span>
        )}
      </div>
      <details className="rounded-xl border border-slate-100 bg-slate-50/50">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#246392]">View timeline</summary>
        <div className="border-t border-slate-100 p-4">
          <FinanceTimeline events={buildOfflineWorkflowTimeline(row)} />
        </div>
      </details>
    </div>
  )
}

export function OfflineWorkflowChip({ status }) {
  const label = OFFLINE_WORKFLOW_STATUSES.includes(status) ? status : status
  const rejected = status === 'Rejected'
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1',
        rejected
          ? 'bg-[#df8284]/15 text-[#b94b4b] ring-[#df8284]/30'
          : status === 'Approved'
            ? 'bg-[#69df66]/15 text-[#1a3a5c] ring-[#69df66]/30'
            : 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/30',
      )}
    >
      {label}
    </span>
  )
}
