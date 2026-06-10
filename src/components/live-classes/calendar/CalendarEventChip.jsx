import { memo } from 'react'
import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'
import { cn } from '../../../utils/cn'

function CalendarEventChip({ event, compact, onClick, onDragStart }) {
  const {
    visual,
    className,
    subject,
    faculty,
    center,
    classroom,
    timing,
    sessionTypeLabel,
    status,
    isRecurring,
  } = event

  const tooltip = [
    className,
    subject && `Subject: ${subject}`,
    faculty && `Faculty: ${faculty}`,
    center && `Center: ${center}`,
    classroom && `Classroom: ${classroom}`,
    timing && `Time: ${timing}`,
    sessionTypeLabel,
    status,
    isRecurring ? 'Recurring session' : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <motion.button
      type="button"
      layout
      draggable
      title={tooltip}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(event)
      }}
      onDragStart={(e) => {
        e.dataTransfer.setData('lessonId', event.lesson.id)
        onDragStart?.(event.lesson)
      }}
      className={cn(
        'group w-full cursor-grab rounded-lg border-l-[3px] bg-gradient-to-r px-1.5 py-1 text-left text-white shadow-sm transition',
        'hover:shadow-md hover:brightness-105 active:cursor-grabbing',
        `bg-gradient-to-r ${visual.gradient}`,
        visual.border,
        visual.ring,
        'ring-1',
        compact ? 'mb-0.5' : 'mb-1',
      )}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-0.5">
        {isRecurring && (
          <Repeat className="mt-0.5 h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold leading-tight sm:text-[11px]">{className}</p>
          {!compact && (
            <p className="truncate text-[9px] opacity-90 sm:text-[10px]">
              {faculty} · {subject}
              {classroom ? ` · ${classroom}` : ''}
            </p>
          )}
        </div>
      </div>
      {!compact && (
        <p className="mt-0.5 truncate text-[9px] font-medium opacity-80">
          {classroom ? `${classroom} · ` : ''}
          {timing}
        </p>
      )}
    </motion.button>
  )
}

export default memo(CalendarEventChip)
