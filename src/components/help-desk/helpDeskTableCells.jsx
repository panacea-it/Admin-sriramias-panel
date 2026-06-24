import { CheckCircle2, CornerUpRight, MailX } from 'lucide-react'
import IconActionButton from '../common/IconActionButton'
import { DateTimeInline } from '../website/websiteUi'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { cn } from '../../utils/cn'

export { default as HelpDeskStatusCell } from './HelpDeskStatusCell'

export function HelpDeskContactCell({ email, mobile }) {
  return (
    <div className="flex min-w-[200px] flex-col gap-1 leading-snug">
      <span className="text-sm text-[#111]">{email}</span>
      <span className="text-sm text-[#686868]">{mobile}</span>
    </div>
  )
}

export function HelpDeskDateCell({ time, date }) {
  return (
    <div className="flex min-w-[168px] items-center">
      <DateTimeInline time={time} date={date} />
    </div>
  )
}

export function HelpDeskActionCell({ status, onReply, onToggleReplyStatus }) {
  const isReplied = status === 'Replied'
  const toggleLabel = isReplied ? 'Mark as Not Replied' : 'Mark as Replied'
  const ToggleIcon = isReplied ? MailX : CheckCircle2

  return (
    <div
      className={cn(TABLE_ACTIONS_WRAP, 'justify-center')}
      role="group"
      aria-label="Help desk ticket actions"
    >
      <IconActionButton
        label="Reply"
        onClick={onReply}
        className="text-[#55ace7] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#246392] hover:shadow-sm"
      >
        <CornerUpRight className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>

      <IconActionButton
        label={toggleLabel}
        onClick={onToggleReplyStatus}
        className={cn(
          isReplied
            ? 'text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392]'
            : 'text-emerald-700 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-800',
        )}
      >
        <ToggleIcon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>
    </div>
  )
}
