import { cn } from '../../../utils/cn'
import { CALENDAR_EVENT_LEGEND } from '../../../utils/calendarEvents'

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0ebfa] px-4 py-3 text-xs text-[#686868] sm:px-6">
      <span className="font-bold text-[#246392]">Legend</span>
      {CALENDAR_EVENT_LEGEND.map((item) => (
        <span key={item.key} className="flex items-center gap-2">
          <span className={cn('h-3 w-6 rounded-md shadow-sm', item.swatch)} />
          {item.label}
        </span>
      ))}
      <span className="text-[#9ca0a8]">· Drag events to reschedule</span>
    </div>
  )
}
