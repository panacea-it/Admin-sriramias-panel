import { CheckCircle2, CornerUpRight, MailX } from 'lucide-react'
import { DateTimeInline } from '../website/websiteUi'
import { cn } from '../../utils/cn'

export { default as HelpDeskStatusCell } from './HelpDeskStatusCell'

const actionClassName =
  'group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-150'

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
      className="flex flex-col items-center justify-center gap-2 py-0.5"
      role="group"
      aria-label="Help desk ticket actions"
    >
      <button
        type="button"
        onClick={onReply}
        className={cn(actionClassName, 'text-[#55ace7] hover:text-[#246392]')}
      >
        Reply
        <CornerUpRight
          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2.2}
        />
      </button>
      <button
        type="button"
        onClick={onToggleReplyStatus}
        aria-label={toggleLabel}
        className={cn(
          actionClassName,
          isReplied
            ? 'text-slate-500 hover:text-[#246392]'
            : 'text-emerald-700 hover:text-emerald-800',
        )}
      >
        <ToggleIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {toggleLabel}
      </button>
    </div>
  )
}
