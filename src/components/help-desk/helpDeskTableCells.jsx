import { CornerUpRight } from 'lucide-react'
import { DateTimeInline } from '../website/websiteUi'

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

export function HelpDeskActionCell({ onReply }) {
  return (
    <div className="flex w-full items-center justify-center">
      <button
        type="button"
        onClick={onReply}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#55ace7] transition-colors duration-150 hover:text-[#246392]"
      >
        Reply
        <CornerUpRight
          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2.2}
        />
      </button>
    </div>
  )
}
