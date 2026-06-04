import { Shield } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function OfflinePaymentAuditSection({ audit }) {
  if (!audit) return null

  return (
    <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#246392]">
          <Shield className="h-4 w-4" />
          <h3 className="text-sm font-bold">Compliance & audit</h3>
        </div>
        <FinanceStatusBadge status={audit.verificationStatus} />
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[#686868]">Created by</dt>
          <dd className="font-semibold text-[#111]">{audit.createdBy}</dd>
        </div>
        <div>
          <dt className="text-[#686868]">Approved by</dt>
          <dd className="font-semibold text-[#111]">{audit.approvedBy || '—'}</dd>
        </div>
        <div>
          <dt className="text-[#686868]">Approval timestamp</dt>
          <dd className="font-medium tabular-nums text-[#111]">
            {audit.approvedAt ? formatCategoryDateTime(audit.approvedAt) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[#686868]">Verification</dt>
          <dd className="font-medium text-[#111]">{audit.verificationStatus}</dd>
        </div>
      </dl>
      {audit.logs?.length > 0 && (
        <ul className="mt-3 max-h-28 space-y-1.5 overflow-y-auto border-t border-slate-200/80 pt-3">
          {audit.logs.map((log, i) => (
            <li key={i} className="flex flex-wrap gap-2 text-xs text-[#686868]">
              <span className="font-semibold text-[#246392]">{log.by}</span>
              <span>{log.action}</span>
              <span className="tabular-nums">{formatCategoryDateTime(log.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
