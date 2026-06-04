import { useRef, useState } from 'react'
import { useInitOnModalOpen } from '../../hooks/modalFormSync'
import { useForm } from 'react-hook-form'
import { BookOpen } from 'lucide-react'
import { toast } from '@/utils/toast'
import SubjectModalShell from './SubjectModalShell'
import SubjectCourseDetailsSection from './SubjectCourseDetailsSection'
import SubjectContentFields from './SubjectContentFields'
import { FormFooter } from './subjectFormUi'
import { useAuth } from '../../contexts/AuthContext'
import { useBatchesData } from '../../hooks/useBatchesData'
import {
  createRecurrenceFromSubjectForm,
  flattenSubjectsLiveClassesForConflicts,
  getExcludeLessonIds,
} from '../../utils/academicsSubjectsRecurrence'
import {
  EMPTY_SUBJECT_FORM,
  subjectToForm,
  validateSubjectForm,
} from './subjectFormUtils'

export default function SubjectModal({
  open,
  onClose,
  mode = 'add',
  context = 'subject',
  subject,
  liveClass,
  subjects = [],
  onSubmit,
}) {
  const { user } = useAuth()
  const actorName = user?.name || user?.email || 'Admin'
  const { sourceRows: batches, loading: batchesLoading } = useBatchesData()
  const [saving, setSaving] = useState(false)
  const [recordingUploadError, setRecordingUploadError] = useState(null)
  const [testSeriesErrors, setTestSeriesErrors] = useState({})
  const isEdit = mode === 'edit'
  const liveClassOnly = context === 'liveClass'
  const subjectOnly = context === 'subject'

  const [recurring, setRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState(null)
  const [recurrenceEditScope, setRecurrenceEditScope] = useState('series')
  const [timezone, setTimezone] = useState('Asia/Kolkata')

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_SUBJECT_FORM })

  const subjectRef = useRef(subject)
  subjectRef.current = subject
  const liveClassRef = useRef(liveClass)
  liveClassRef.current = liveClass
  const seedKey = `${mode}:${context}:${subject?.id ?? liveClass?.id ?? 'new'}`

  const syncRecurrenceState = (formValues) => {
    setRecurring(Boolean(formValues.recurring))
    setRecurrence(formValues.recurrence)
    setRecurrenceEditScope(formValues.recurrenceEditScope || 'series')
    setTimezone(formValues.timezone || 'Asia/Kolkata')
  }

  useInitOnModalOpen(open, seedKey, () => {
    const seeded = subjectToForm(subjectRef.current, liveClassRef.current)
    reset(seeded)
    syncRecurrenceState(seeded)
    clearErrors()
    setTestSeriesErrors({})
    setRecordingUploadError(null)
  })

  const watchedDate = watch('date')
  const isRecurringEdit = isEdit && Boolean(liveClass?.recurrenceSeriesId)

  const handleRecurringToggle = (enabled) => {
    setRecurring(enabled)
    if (enabled) {
      setRecurrence((prev) =>
        prev?.enabled
          ? prev
          : createRecurrenceFromSubjectForm({ date: watchedDate, timezone }),
      )
    } else {
      setRecurrence(null)
    }
  }

  const onFormSubmit = async (values) => {
    const payload = {
      ...values,
      recurring,
      recurrence: recurring && recurrence?.enabled ? recurrence : null,
      recurrenceEditScope,
      timezone,
      _excludeSourceIds: liveClass?.id ? [liveClass.id] : [],
    }

    const validationErrors = validateSubjectForm(payload, {
      liveClassOnly,
      subjectOnly,
      requireLiveClass: liveClassOnly,
      allSubjects: subjects,
      subjectId: subject?.id || '',
      excludeLessonIds: getExcludeLessonIds(subject, liveClass, subjects),
    })

    if (Object.keys(validationErrors).length) {
      const tsErr = {}
      Object.entries(validationErrors).forEach(([key, message]) => {
        if (key.startsWith('testSeries_')) tsErr[key] = message
        else if (key === 'recurrence') toast.error(message)
        else setError(key, { type: 'manual', message })
      })
      setTestSeriesErrors(tsErr)
      if (Object.keys(tsErr).length) toast.error('Please complete the Test Series section')
      return
    }
    setTestSeriesErrors({})

    setSaving(true)
    try {
      await onSubmit(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = liveClassOnly
    ? isEdit
      ? 'Edit Live Class'
      : 'Add Live Class'
    : isEdit
      ? 'Edit Subject'
      : 'Create Subject'

  return (
    <SubjectModalShell open={open} onClose={onClose}>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex max-h-[min(90vh,880px)] flex-col overflow-hidden rounded-2xl bg-[#f4f6f8] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <div className="shrink-0 rounded-t-2xl bg-gradient-to-r from-[#55ace7] via-[#3d7eb5] to-[#246392] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <BookOpen className="h-5 w-5 text-[#246392]" strokeWidth={2.2} />
              </div>
              <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-white underline-offset-2 transition hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            {subjectOnly && (
              <SubjectCourseDetailsSection
                register={register}
                control={control}
                errors={errors}
              />
            )}

            {liveClassOnly && (
              <SubjectContentFields
                contentType="live"
                register={register}
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                clearErrors={clearErrors}
                subject={subject}
                liveClass={liveClass}
                subjects={subjects}
                batches={batches}
                batchesLoading={batchesLoading}
                recurring={recurring}
                onRecurringToggle={handleRecurringToggle}
                recurrence={recurrence}
                onRecurrenceChange={setRecurrence}
                recurrenceEditScope={recurrenceEditScope}
                onRecurrenceEditScopeChange={setRecurrenceEditScope}
                timezone={timezone}
                onTimezoneChange={(tz) => {
                  setTimezone(tz)
                  if (recurrence) setRecurrence({ ...recurrence, timezone: tz })
                }}
                isRecurringEdit={isRecurringEdit}
                lessonsForConflicts={flattenSubjectsLiveClassesForConflicts(subjects)}
                excludeLessonIds={getExcludeLessonIds(subject, liveClass, subjects)}
                actorName={actorName}
                recordingUploadError={recordingUploadError}
                onRecordingUploadError={setRecordingUploadError}
                testSeriesErrors={testSeriesErrors}
              />
            )}
          </div>
        </div>

        <FormFooter
          saving={saving}
          onReset={() => {
            const seeded = subjectToForm(subject, liveClass)
            reset(seeded)
            syncRecurrenceState(seeded)
          }}
        />
      </form>
    </SubjectModalShell>
  )
}
