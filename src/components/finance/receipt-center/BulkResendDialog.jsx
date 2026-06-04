import { useState } from 'react'
import { Mail, MessageCircle, MessageSquare, Send } from 'lucide-react'
import Modal from '../../ui/Modal'
import FinanceTableSkeleton from '../FinanceTableSkeleton'
import { RECEIPT_RESEND_CHANNELS } from '../../../constants/receiptConstants'
import { cn } from '../../../utils/cn'

const CHANNEL_ICONS = {
  WhatsApp: MessageCircle,
  SMS: MessageSquare,
  Email: Mail,
}

export default function BulkResendDialog({
  open,
  onClose,
  count = 0,
  onConfirm,
  loading = false,
  result = null,
}) {
  const [channel, setChannel] = useState('Email')

  const handleConfirm = () => onConfirm?.({ channel })

  return (
    <Modal open={open} onClose={onClose} size="md" title="Bulk resend receipts">
      <div className="space-y-4 p-1">
        {!result ? (
          <>
            <p className="text-sm text-[#686868]">
              Resend receipts to <strong>{count}</strong> selected student{count !== 1 ? 's' : ''} via your preferred channel.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RECEIPT_RESEND_CHANNELS.map(({ id, label }) => {
                const Icon = CHANNEL_ICONS[id]
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChannel(id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 text-xs font-semibold transition',
                      channel === id
                        ? 'border-[#246392] bg-[#eef6fc] text-[#246392]'
                        : 'border-slate-200 text-[#686868] hover:border-slate-300',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                )
              })}
            </div>
            {loading && (
              <div className="rounded-lg bg-[#eef6fc] px-3 py-2">
                <FinanceTableSkeleton rows={2} columns={1} />
                <p className="mt-2 text-center text-xs text-[#246392]">Sending receipts…</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#444]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || count === 0}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#246392] to-[#1a4d73] px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending…' : `Resend ${count} receipt${count !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-[#111]">Bulk resend complete</p>
              <p className="mt-2 text-[#686868]">
                <span className="font-semibold text-[#69df66]">{result.succeeded ?? 0} succeeded</span>
                {' · '}
                <span className="font-semibold text-[#df8284]">{result.failed ?? 0} failed</span>
                {' · '}
                {result.total ?? 0} total
              </p>
            </div>
            {(result.results || []).filter((r) => !r.success).length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg border border-[#df8284]/30 bg-[#fdf0f0] p-3 text-xs">
                <p className="mb-1 font-semibold text-[#c0392b]">Failed items</p>
                {result.results.filter((r) => !r.success).map((r) => (
                  <p key={r.id}>{r.id} — {r.status}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
