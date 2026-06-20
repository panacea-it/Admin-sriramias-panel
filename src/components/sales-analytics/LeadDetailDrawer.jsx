import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import AppModalWrapper from '../ui/AppModalWrapper'
import SalesStatusBadge from './SalesStatusBadge'
import SalesTimeline from './SalesTimeline'
import { LEAD_STATUSES } from '../../data/salesAnalyticsMockData'
import { updateSalesLead } from '../../api/salesAnalyticsAPI'
import { toast } from '../../utils/toast'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'

export default function LeadDetailDrawer({ open, onClose, lead, journeyEvents = [], onUpdated }) {
  const { canEditLead } = useSalesPermissions()
  const [status, setStatus] = useState(lead?.status || '')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(lead?.status || '')
    setRemark('')
  }, [lead?.id, lead?.status])

  if (!lead) return null

  const handleSave = async () => {
    if (!canEditLead) {
      toast.error('You do not have permission to edit this lead')
      return
    }
    setSaving(true)
    try {
      await updateSalesLead(lead.id, { status, remark })
      toast.success('Lead updated')
      onUpdated?.()
      onClose()
    } catch {
      toast.error('Failed to update lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModalWrapper
      open={open}
      onClose={onClose}
      size="lg"
      title={lead.studentName}
      showCloseButton={false}
      zIndex={110}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <ModalPanelHeader
          icon={Users}
          iconClassName="text-[#246392]"
          title={lead.studentName}
          subtitle={`${lead.id} · ${lead.interestedCourse}`}
          onClose={onClose}
          closeVariant="icon"
        />

        <div className="max-h-[min(60vh,520px)] overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#9ca0a8]">Mobile</p>
                <p className="font-medium">{lead.mobile}</p>
              </div>
              <div>
                <p className="text-[#9ca0a8]">Email</p>
                <p className="font-medium">{lead.email}</p>
              </div>
              <div>
                <p className="text-[#9ca0a8]">Source</p>
                <p className="font-medium">{lead.source}</p>
              </div>
              <div>
                <p className="text-[#9ca0a8]">Counselor</p>
                <p className="font-medium">{lead.counselorName}</p>
              </div>
              <div>
                <p className="text-[#9ca0a8]">Status</p>
                <SalesStatusBadge status={lead.status} />
              </div>
              <div>
                <p className="text-[#9ca0a8]">Payment</p>
                <SalesStatusBadge status={lead.paymentStatus} />
              </div>
            </div>

            {lead.locked && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Lead locked to assigned counselor. Reassignment requires Team Lead or above.
              </p>
            )}

            <div>
              <h4 className="mb-2 text-sm font-bold text-[#111]">Status workflow</h4>
              <div className="flex flex-wrap gap-1">
                {LEAD_STATUSES.slice(0, 7).map((s) => (
                  <span
                    key={s}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      lead.status === s ? 'bg-[#246392] text-white' : 'bg-[#f3f4f6] text-[#686868]'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {canEditLead && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#111]">Update status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <label className="block text-sm font-semibold text-[#111]">Remarks</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm"
                  placeholder="Add counselor notes..."
                />
              </div>
            )}

            <div>
              <h4 className="mb-3 text-sm font-bold text-[#111]">Activity timeline</h4>
              <SalesTimeline events={journeyEvents} />
            </div>
          </div>
        </div>

        {canEditLead ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/80 p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold text-[#111] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl bg-[#246392] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4d6e] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : null}
      </div>
    </AppModalWrapper>
  )
}
