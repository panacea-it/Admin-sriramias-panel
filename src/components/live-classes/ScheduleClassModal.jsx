import { useCallback, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { toast } from '@/utils/toast'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import {
  CourseFormField,
  CourseInput,
  CoursePdfInput,
  CourseSelect,
  CourseTextarea,
} from '../courses/CourseFormField'
import {
  LIVE_CLASS_LOCATIONS,
  MEETING_PROVIDERS,
} from '../../data/liveClassesData'
import {
  createEmptyLessonForm,
  lessonRowToForm,
} from '../../utils/liveClassesMappers'
import {
  createDefaultRecurrenceRule,
  validateRecurrenceRule,
  generateOccurrenceDates,
} from '../../utils/recurrenceEngine'
import { RECURRENCE_EDIT_SCOPES } from '../../constants/recurrence'
import { useModalForm } from '../../hooks/useModalForm'
import { useAuth } from '../../contexts/AuthContext'
import SubjectSearchSelect from './SubjectSearchSelect'
import VideoUploadSection from './VideoUploadSection'
import RecurringScheduleSection from './RecurringScheduleSection'
import ClassroomSelectField from '../classrooms/ClassroomSelectField'
import { findClassroomConflict } from '../../utils/classroomBookings'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#55ace7]' : 'bg-[#d1d5db]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      <span className="text-sm font-medium text-[#222]">{label}</span>
    </label>
  )
}

export default function ScheduleClassModal({
  open,
  onClose,
  item,
  onSubmit,
  lessons = [],
  defaultLessonType = null,
  lockLessonType = false,
  labels = {},
  onAfterReset,
}) {
  const { user } = useAuth()
  const actorName = user?.name || user?.email || 'Admin'
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedDefaultType = defaultLessonType === 'Recording' ? 'Recording' : 'Live'

  const createEmpty = useCallback(
    () => createEmptyLessonForm(resolvedDefaultType),
    [resolvedDefaultType],
  )

  const copy = useMemo(
    () => ({
      modalTitle: labels.modalTitle ?? 'Schedule class',
      createHeader: labels.createHeader ?? 'Schedule class',
      editHeader: labels.editHeader ?? 'Edit lesson',
      createLabel: labels.createLabel ?? 'Schedule class',
      updateLabel: labels.updateLabel ?? 'Save changes',
      createSuccess: labels.createSuccess ?? 'Class scheduled',
      updateSuccess: labels.updateSuccess ?? 'Lesson updated',
    }),
    [labels],
  )

  const { form, setForm, isEditMode, reset, clear } = useModalForm(
    open,
    item,
    lessonRowToForm,
    createEmpty,
  )

  const update = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: val }))
  }

  const isRecording = form.lessonType === 'Recording'
  const isLive = form.lessonType === 'Live'
  const isRecurringEdit = isEditMode && Boolean(item?.recurrenceSeriesId)

  const handleSubject = ({ subjectId, subjectName, mainCategoryName }) => {
    setForm((f) => ({ ...f, subjectId, subjectName, mainCategoryName }))
  }

  const handleRecurringToggle = (enabled) => {
    setForm((f) => ({
      ...f,
      recurring: enabled,
      recurrence: enabled
        ? f.recurrence?.enabled
          ? { ...createDefaultRecurrenceRule(f), ...f.recurrence, enabled: true }
          : createDefaultRecurrenceRule(f)
        : null,
    }))
  }

  const handleRecurrenceChange = (nextRule) => {
    setForm((f) => ({
      ...f,
      recurrence: {
        ...createDefaultRecurrenceRule(f),
        ...f.recurrence,
        ...nextRule,
        enabled: true,
      },
    }))
  }

  const validate = () => {
    if (!form.lessonName?.trim()) {
      toast.error('Lesson name is required')
      return false
    }
    if (!form.subjectId) {
      toast.error('Select a subject — classes attach to subjects only')
      return false
    }
    if (!form.teacher?.trim()) {
      toast.error('Teacher is required')
      return false
    }
    if (isLive) {
      if (!form.scheduledDate || !form.scheduledTime) {
        toast.error('Schedule date and time are required for live classes')
        return false
      }
      if (!form.classroomId) {
        toast.error('Select a classroom for live classes')
        return false
      }
      const excludeIds = isEditMode && item?.recurrenceSeriesId
        ? lessons.filter((l) => l.recurrenceSeriesId === item.recurrenceSeriesId).map((l) => l.id)
        : [item?.id].filter(Boolean)
      const roomConflict = findClassroomConflict({
        classroomId: form.classroomId,
        date: form.scheduledDate,
        startTime: form.scheduledTime,
        durationMinutes: Number(form.duration) || 60,
        excludeSourceIds: excludeIds,
      })
      if (roomConflict) {
        toast.error('This classroom is already occupied during the selected time.')
        return false
      }
      if (form.recurring && form.recurrence?.enabled) {
        const recurrenceErrors = validateRecurrenceRule(form.recurrence, form)
        if (recurrenceErrors.length) {
          toast.error(recurrenceErrors[0])
          return false
        }
        const dates = generateOccurrenceDates(form.recurrence, form.scheduledDate)
        const excludeIds = isEditMode && item?.recurrenceSeriesId
          ? lessons.filter((l) => l.recurrenceSeriesId === item.recurrenceSeriesId).map((l) => l.id)
          : [item?.id].filter(Boolean)
        const conflict = lessons.some((l) =>
          dates.some(
            (d) =>
              !excludeIds.includes(l.id) &&
              l.lessonType === 'Live' &&
              l.teacher === form.teacher &&
              l.scheduledDate === d &&
              l.scheduledTime === form.scheduledTime &&
              l.status !== 'Disabled',
          ),
        )
        if (conflict) {
          toast.error('Schedule conflict: teacher already booked for one or more recurring dates')
          return false
        }
      } else {
        const conflict = lessons.some(
          (l) =>
            l.id !== item?.id &&
            l.lessonType === 'Live' &&
            l.teacher === form.teacher &&
            l.scheduledDate === form.scheduledDate &&
            l.scheduledTime === form.scheduledTime &&
            l.status !== 'Disabled',
        )
        if (conflict) {
          toast.error('Schedule conflict: this teacher already has a class at that time')
          return false
        }
      }
    }
    if (isRecording && !form.videoFileName && !isEditMode) {
      toast.error('Upload a video for recording lessons')
      return false
    }
    return true
  }

  const handleReset = () => {
    if (isEditMode) {
      reset()
    } else {
      clear()
    }
    onAfterReset?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = lockLessonType
      ? { ...form, lessonType: resolvedDefaultType }
      : form
    setIsSubmitting(true)
    try {
      await onSubmit?.(payload, {
        isEdit: isEditMode,
        id: item?.id,
        scope: payload.recurrenceEditScope || 'series',
        actor: actorName,
      })
      toast.success(isEditMode ? copy.updateSuccess : copy.createSuccess)
      onClose()
    } catch {
      // saveLesson surfaces toast; keep modal open for corrections
    } finally {
      setIsSubmitting(false)
    }
  }

  const excludeLessonIds = isEditMode && item?.recurrenceSeriesId
    ? lessons.filter((l) => l.recurrenceSeriesId === item.recurrenceSeriesId).map((l) => l.id)
    : [item?.id].filter(Boolean)

  return (
    <Modal open={open} onClose={onClose} size="full" title={copy.modalTitle} showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader
          title={isEditMode ? copy.editHeader : copy.createHeader}
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
          icon={Calendar}
        />

        <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
          <SectionBar title="Lesson details" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseFormField label="Lesson name" required className="sm:col-span-2">
              <CourseInput value={form.lessonName} onChange={update('lessonName')} />
            </CourseFormField>
            <CourseFormField label="Topic">
              <CourseInput value={form.topic} onChange={update('topic')} />
            </CourseFormField>
            <CourseFormField label="Teacher" required>
              <CourseInput value={form.teacher} onChange={update('teacher')} />
            </CourseFormField>
            <CourseFormField label="Subject" required className="sm:col-span-2">
              <SubjectSearchSelect
                value={form.subjectId}
                onChange={handleSubject}
                required
              />
            </CourseFormField>
            <CourseFormField label="Location" required>
              <CourseSelect value={form.location} onChange={update('location')}>
                {LIVE_CLASS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>
            {isLive && (
              <CourseFormField label="Select Classroom" required className="sm:col-span-2">
                <ClassroomSelectField
                  value={form.classroomId}
                  onChange={(id) => setForm((f) => ({ ...f, classroomId: id }))}
                  date={form.scheduledDate}
                  startTime={form.scheduledTime}
                  durationMinutes={form.duration}
                  excludeSourceIds={excludeLessonIds}
                  required
                  showLabel={false}
                />
              </CourseFormField>
            )}
            {!lockLessonType && (
              <CourseFormField label="Lesson type" required>
                <CourseSelect value={form.lessonType} onChange={update('lessonType')}>
                  <option value="Live">Live</option>
                  <option value="Recording">Recording</option>
                </CourseSelect>
              </CourseFormField>
            )}
            <CourseFormField label="Status">
              <CourseSelect value={form.status} onChange={update('status')}>
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
                <option value="Disabled">Disabled</option>
              </CourseSelect>
            </CourseFormField>
          </div>

          {isRecording && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-[#e8f4fc]">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#246392]">
                  Recording details
                </h3>
                <CourseFormField label="Description">
                  <CourseTextarea value={form.description} onChange={update('description')} rows={3} />
                </CourseFormField>
                <Toggle
                  checked={form.downloadable}
                  onChange={(v) => setForm((f) => ({ ...f, downloadable: v }))}
                  label="Downloadable"
                />
                <CourseFormField label="Notes / PDF">
                  <CoursePdfInput
                    fileName={form.notesFileName}
                    placeholder="Upload notes PDF"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notesFileName: e.target.files?.[0]?.name || '',
                      }))
                    }
                  />
                </CourseFormField>
                <CourseFormField label="Visibility">
                  <CourseSelect value={form.visibility} onChange={update('visibility')}>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Private">Private</option>
                  </CourseSelect>
                </CourseFormField>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#eef2fc] to-white p-5 shadow-[0_8px_30px_rgba(36,99,146,0.1)] ring-1 ring-[#e8f4fc]">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#246392]">
                  Video preview
                </h3>
                <VideoUploadSection form={form} setForm={setForm} />
              </div>
            </div>
          )}

          {isLive && (
            <div className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(36,99,146,0.08)] ring-1 ring-[#e8f4fc]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#246392]">
                Live scheduling
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CourseFormField label="Schedule date" required>
                  <CourseInput type="date" value={form.scheduledDate} onChange={update('scheduledDate')} />
                </CourseFormField>
                <CourseFormField label="Time" required>
                  <CourseInput type="time" value={form.scheduledTime} onChange={update('scheduledTime')} />
                </CourseFormField>
                <CourseFormField label="Duration (min)">
                  <CourseInput
                    type="number"
                    min={15}
                    value={form.duration}
                    onChange={update('duration')}
                  />
                </CourseFormField>
                <CourseFormField label="Timezone">
                  <CourseSelect
                    value={form.timezone}
                    onChange={(e) => {
                      const tz = e.target.value
                      setForm((f) => ({
                        ...f,
                        timezone: tz,
                        recurrence: f.recurrence ? { ...f.recurrence, timezone: tz } : f.recurrence,
                      }))
                    }}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </CourseSelect>
                </CourseFormField>
              </div>

              <Toggle
                checked={form.recurring}
                onChange={handleRecurringToggle}
                label="Recurring session"
              />

              {isRecurringEdit && (
                <div className="rounded-xl border border-[#cfe8f8] bg-[#f8fbff] px-4 py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#246392]">
                    Apply changes to
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RECURRENCE_EDIT_SCOPES.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                      >
                        <input
                          type="radio"
                          name="recurrenceEditScope"
                          value={opt.value}
                          checked={form.recurrenceEditScope === opt.value}
                          onChange={() =>
                            setForm((f) => ({ ...f, recurrenceEditScope: opt.value }))
                          }
                          className="accent-[#246392]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <RecurringScheduleSection
                enabled={form.recurring}
                recurrence={form.recurrence}
                onRecurrenceChange={handleRecurrenceChange}
                anchorDate={form.scheduledDate}
                anchorTime={form.scheduledTime}
                lessons={lessons}
                excludeLessonIds={excludeLessonIds}
                teacher={form.teacher}
                subjectId={form.subjectId}
                actorName={actorName}
              />

              <SectionBar title="Meeting details (integration-ready)" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CourseFormField label="Provider">
                  <CourseSelect value={form.meetingProvider} onChange={update('meetingProvider')}>
                    {MEETING_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </CourseSelect>
                </CourseFormField>
                <CourseFormField label="Meeting ID">
                  <CourseInput value={form.zoomMeetingId} onChange={update('zoomMeetingId')} />
                </CourseFormField>
                <CourseFormField label="Account email">
                  <CourseInput
                    type="email"
                    value={form.zoomAccountEmail}
                    onChange={update('zoomAccountEmail')}
                  />
                </CourseFormField>
                <CourseFormField label="Meeting link" className="sm:col-span-2">
                  <CourseInput value={form.zoomLink} onChange={update('zoomLink')} placeholder="https://" />
                </CourseFormField>
                <CourseFormField label="Passcode">
                  <CourseInput value={form.passcode} onChange={update('passcode')} />
                </CourseFormField>
                <CourseFormField label="Host name">
                  <CourseInput value={form.hostName} onChange={update('hostName')} />
                </CourseFormField>
              </div>
              <CourseFormField label="Description" className="sm:col-span-2">
                <CourseTextarea value={form.description} onChange={update('description')} rows={3} />
              </CourseFormField>
            </div>
          )}

          <FormModalSubmitBar
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            onReset={handleReset}
            createLabel={copy.createLabel}
            updateLabel={copy.updateLabel}
          />
        </div>
      </form>
    </Modal>
  )
}
