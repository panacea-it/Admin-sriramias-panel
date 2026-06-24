import { Calendar, Clock, ExternalLink, MapPin, DoorOpen, Pencil, Repeat, User, BookOpen } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import LiveClassStatusBadge from '../LiveClassStatusBadge'
import { formatRecurrenceSummary } from '../../../utils/calendarEvents'
import { cn } from '../../../utils/cn'

function DetailRow({ icon: Icon, label, value, className }) {
  if (!value) return null
  return (
    <div className={cn('flex gap-3 rounded-xl border border-[#f0ebfa] bg-[#fafbff] px-4 py-3', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#55ace7]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9ca0a8]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#222] break-words">{value}</p>
      </div>
    </div>
  )
}

export default function CalendarEventDetailModal({
  event,
  open,
  onClose,
  onEdit,
  onDelete,
  onViewDetails,
}) {
  if (!event) return null
  const { lesson } = event
  const meetingLink = lesson.zoomLink || lesson.meetingLink

  return (
    <Modal open={open} onClose={onClose} size="lg" title={event.className}>
      <ModalPanelHeader
        title={event.className}
        subtitle={`${event.sessionTypeLabel} · ${event.subject}`}
        onClose={onClose}
      />
      <div className="space-y-4 px-6 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <LiveClassStatusBadge status={event.status} />
          {event.isRecurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              <Repeat className="h-3 w-3" />
              Recurring
            </span>
          )}
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold text-white bg-gradient-to-r',
              event.visual.gradient,
            )}
          >
            {event.sessionTypeLabel}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow icon={BookOpen} label="Subject" value={event.subject} />
          <DetailRow icon={User} label="Faculty" value={event.faculty} />
          <DetailRow icon={MapPin} label="Center" value={event.center} />
          <DetailRow icon={DoorOpen} label="Classroom" value={event.classroom} />
          <DetailRow icon={Calendar} label="Date" value={lesson.scheduledDate} />
          <DetailRow icon={Clock} label="Time & Duration" value={`${event.timing} (${lesson.duration || 60} min)`} />
          {event.isRecurring && (
            <DetailRow
              icon={Repeat}
              label="Recurrence"
              value={formatRecurrenceSummary(lesson.recurrence)}
              className="sm:col-span-2"
            />
          )}
        </div>

        {lesson.topic && (
          <DetailRow icon={BookOpen} label="Topic" value={lesson.topic} className="sm:col-span-2" />
        )}

        {lesson.description && (
          <p className="rounded-xl border border-[#f0ebfa] bg-white px-4 py-3 text-sm text-[#444]">
            {lesson.description}
          </p>
        )}

        {meetingLink && (
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#eef6fc] px-4 py-2.5 text-sm font-semibold text-[#246392] transition hover:bg-[#e8f4fc]"
          >
            <ExternalLink className="h-4 w-4" />
            Open meeting link
          </a>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[#f0ebfa] pt-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onViewDetails?.(event)}
              className="h-10 rounded-xl border border-[#55ace7]/30 px-5 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
            >
              View Full Details
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(event)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-md"
            >
              <Pencil className="h-4 w-4" />
              Edit Event
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
