import { Clock, Filter } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import FinanceTimeline from '../FinanceTimeline'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { OFFLINE_AUDIT_ACTIONS } from '../../../constants/offlinePaymentApproval'

export default function OfflineAuditHistoryModal({
  open,
  row,
  allLogs = [],
  onClose,
  filterUser = '',
  filterAction = 'all',
  onFilterUserChange,
  onFilterActionChange,
}) {
  const logs = row ? row.auditTrail || [] : allLogs
  const filtered = logs.filter((l) => {
    if (filterUser && !`${l.by}`.toLowerCase().includes(filterUser.toLowerCase())) return false
    if (filterAction !== 'all' && l.action !== filterAction) return false
    return true
  })

  const events = filtered.map((l) => ({
    step: l.action,
    detail: [l.by, l.remark || l.note, l.branch ? `Branch ${l.branch}` : null, l.ip ? `IP ${l.ip}` : null]
      .filter(Boolean)
      .join(' · '),
    timestamp: l.at,
    status: /reject|unauthorized|mismatch/i.test(l.action) ? 'failed' : 'completed',
  }))

  return (
    <Modal open={open} onClose={onClose} size="md" title="Audit history">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Offline payment audit log"
          subtitle={row ? `${row.id} · ${row.studentName}` : 'All offline approval activity'}
          onClose={onClose}
          icon={Clock}
        />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#686868]">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => onFilterUserChange?.(e.target.value)}
              placeholder="Filter by user"
              className="h-9 flex-1 min-w-[120px] rounded-lg border border-slate-200 px-3 text-sm"
            />
            <select
              value={filterAction}
              onChange={(e) => onFilterActionChange?.(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="all">All actions</option>
              {OFFLINE_AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {events.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#686868]">No audit entries match filters.</p>
            ) : (
              <FinanceTimeline events={events} />
            )}
          </div>

          <p className="text-xs text-[#9ca0a8]">
            Audit logs are immutable. Last updated:{' '}
            {row?.updatedAt ? formatCategoryDateTime(row.updatedAt) : '—'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
