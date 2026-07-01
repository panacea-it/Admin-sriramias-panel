import { CheckCircle2, Mail, MessageCircle, MessageSquare, XCircle } from 'lucide-react'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-[#128C7E]' },
  { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-[#246392]' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-[#6366f1]' },
]

export default function CommunicationStatusChips({ communications = {}, compact = false }) {
  return (
    <div className={cn('flex flex-col gap-1', compact && 'gap-0.5')}>
      {CHANNELS.map(({ key, label, icon: Icon, color }) => {
        const entry = communications[key] || {}
        const disabled = entry.enabled === false
        const sent = entry.sent === true || entry.status === 'Delivered' || entry.status === 'Sent'
        const failed = entry.status === 'Failed'

        return (
          <div
            key={key}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px]',
              sent && 'bg-emerald-50',
              failed && 'bg-red-50',
              !sent && !failed && 'bg-slate-50',
            )}
            title={
              disabled
                ? entry.message || 'Coming Soon'
                : entry.sentAt
                  ? formatCategoryDateTime(entry.sentAt)
                  : 'Not sent'
            }
          >
            <Icon className={cn('h-3 w-3 shrink-0', color)} />
            <span className="font-medium text-[#333]">{label}</span>
            {sent ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : failed ? (
              <XCircle className="h-3 w-3 text-red-500" />
            ) : (
              <span className="text-[#9ca0a8]">—</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
