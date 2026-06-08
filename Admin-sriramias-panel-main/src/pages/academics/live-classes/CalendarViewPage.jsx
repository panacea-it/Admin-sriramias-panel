import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../../components/figma/PageBanner'
import LiveClassesPageShell from '../../../components/live-classes/LiveClassesPageShell'
import LiveClassesCalendar from '../../../components/live-classes/LiveClassesCalendar'
import CalendarEventDetailModal from '../../../components/live-classes/calendar/CalendarEventDetailModal'
import ScheduleClassModal from '../../../components/live-classes/ScheduleClassModal'
import RecurrenceScopeDialog from '../../../components/live-classes/RecurrenceScopeDialog'
import { useLiveClasses } from '../../../contexts/LiveClassesContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useCenters } from '../../../contexts/CentersContext'
import { useEditModal } from '../../../hooks/useEditModal'
import { LIVE_CLASSES_BASE } from '../../../constants/liveClassesNav'
import {
  RECURRENCE_DELETE_SCOPES,
  RECURRENCE_EDIT_SCOPES,
} from '../../../constants/recurrence'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Live Classes' },
  { label: 'Calendar View' },
]

const CALENDAR_CENTER_PILLS = [
  'Delhi',
  'Hyderabad',
  'Bangalore',
  'Chennai',
  'Vijayawada',
]

export default function CalendarViewPage() {
  const navigate = useNavigate()
  const { selectedCenter } = useAuth()
  const { activeCenterNames } = useCenters()
  const { lessons, loading, rescheduleLesson, saveLesson, removeLesson } = useLiveClasses()
  const editModal = useEditModal()

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [recurrenceDialog, setRecurrenceDialog] = useState(null)

  const centerOptions = useMemo(() => {
    const fromCenters = activeCenterNames
      .map((n) => n.replace(/\s+Center$/i, '').trim())
      .filter(Boolean)
    const merged = [...new Set([...CALENDAR_CENTER_PILLS, ...fromCenters])]
    return merged.sort((a, b) => a.localeCompare(b))
  }, [activeCenterNames])

  const openDetail = useCallback((event) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setSelectedEvent(null)
  }, [])

  const handleEdit = useCallback(
    (event) => {
      const lesson = event.lesson
      if (lesson.recurrenceSeriesId) {
        setRecurrenceDialog({ mode: 'edit', event })
        return
      }
      editModal.openEdit(lesson)
      closeDetail()
    },
    [editModal, closeDetail],
  )

  const openEditWithScope = useCallback(
    (event, scope) => {
      editModal.openEdit({ ...event.lesson, recurrenceEditScope: scope })
    },
    [editModal],
  )

  const handleDeleteRequest = useCallback((event) => {
    if (event.lesson.recurrenceSeriesId) {
      setRecurrenceDialog({ mode: 'delete', event })
      return
    }
    setDeleteTarget(event.lesson)
    closeDetail()
  }, [closeDetail])

  const confirmDelete = useCallback(
    async (scope) => {
      if (!deleteTarget && !recurrenceDialog) return
      const lesson = deleteTarget || recurrenceDialog?.event?.lesson
      setDeleteLoading(true)
      try {
        await removeLesson(lesson.id, { scope })
        toast.success('Event removed from calendar')
        setDeleteTarget(null)
        setRecurrenceDialog(null)
        closeDetail()
      } catch {
        toast.error('Could not delete event')
      } finally {
        setDeleteLoading(false)
      }
    },
    [deleteTarget, recurrenceDialog, removeLesson, closeDetail],
  )

  const handleRecurrenceConfirm = useCallback(
    async (scope) => {
      if (!recurrenceDialog) return
      const { mode, event } = recurrenceDialog
      if (mode === 'delete') {
        setDeleteLoading(true)
        try {
          await removeLesson(event.lesson.id, { scope })
          toast.success('Event removed from calendar')
          setRecurrenceDialog(null)
          closeDetail()
        } catch {
          toast.error('Could not delete event')
        } finally {
          setDeleteLoading(false)
        }
        return
      }
      openEditWithScope(event, scope)
      setRecurrenceDialog(null)
      closeDetail()
    },
    [recurrenceDialog, removeLesson, openEditWithScope, closeDetail],
  )

  const handleSave = useCallback(
    async (form, meta) => {
      try {
        await saveLesson(form, meta)
        toast.success(meta?.isEdit ? 'Event updated' : 'Event created')
        editModal.close()
      } catch {
        toast.error('Could not save event')
      }
    },
    [saveLesson, editModal],
  )

  return (
    <LiveClassesPageShell
      breadcrumb={BREADCRUMB}
      banner={
        <PageBanner
          icon={CalendarDays}
          title="Calendar View"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
          iconClassName="text-[#246392]"
        />
      }
    >
      {loading ? (
        <div className="animate-pulse rounded-2xl bg-white p-12 shadow">
          <div className="h-64 rounded-xl bg-[#f0ebfa]" />
        </div>
      ) : (
        <LiveClassesCalendar
          lessons={lessons}
          headerCenter={selectedCenter}
          centerOptions={centerOptions}
          onReschedule={(id, patch) => {
            rescheduleLesson(id, patch)
            toast.success('Session rescheduled')
          }}
          onEventClick={openDetail}
        />
      )}

      <CalendarEventDetailModal
        event={selectedEvent}
        open={detailOpen}
        onClose={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onViewDetails={(ev) => navigate(`${LIVE_CLASSES_BASE}/${ev.lesson.id}`)}
      />

      <ScheduleClassModal
        open={editModal.isOpen}
        onClose={editModal.close}
        item={editModal.selectedItem}
        onSubmit={handleSave}
        lessons={lessons}
      />

      <RecurrenceScopeDialog
        open={Boolean(recurrenceDialog)}
        mode={recurrenceDialog?.mode === 'delete' ? 'delete' : 'edit'}
        title={
          recurrenceDialog?.mode === 'delete'
            ? 'Delete recurring event'
            : 'Edit recurring event'
        }
        lessonName={recurrenceDialog?.event?.className ?? ''}
        scopes={
          recurrenceDialog?.mode === 'delete'
            ? RECURRENCE_DELETE_SCOPES
            : RECURRENCE_EDIT_SCOPES
        }
        onConfirm={handleRecurrenceConfirm}
        onCancel={() => setRecurrenceDialog(null)}
        loading={deleteLoading}
      />

      {deleteTarget && !recurrenceDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#111]">Delete event?</h3>
            <p className="mt-2 text-sm text-[#686868]">
              Remove <strong>{deleteTarget.lessonName}</strong> from the calendar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => confirmDelete('this')}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LiveClassesPageShell>
  )
}
