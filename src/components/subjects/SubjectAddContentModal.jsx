import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Layers, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useInitOnModalOpen } from '../../hooks/modalFormSync'
import { useAuth } from '../../contexts/AuthContext'
import { useBatchesData } from '../../hooks/useBatchesData'
import { toast } from '../../utils/toast'
import {
  createRecurrenceFromSubjectForm,
  flattenSubjectsLiveClassesForConflicts,
  formAnchorTime,
  getExcludeLessonIds,
} from '../../utils/academicsSubjectsRecurrence'
import {
  contentTypeLabel,
  getSubjectContentTypes,
} from '../../utils/subjectCategoryHelpers'
import SubjectModalShell from './SubjectModalShell'
import SubjectContentFields from './SubjectContentFields'
import { FormFooter } from './subjectFormUi'
import {
  EMPTY_SUBJECT_FORM,
  subjectToForm,
  validateContentForm,
} from './subjectFormUtils'
import { cn } from '../../utils/cn'

export default function SubjectAddContentModal({
  open,
  onClose,
  subject,
  subjects = [],
  onSubmit,
}) {
  const { user } = useAuth()
  const actorName = user?.name || user?.email || 'Admin'
  const { sourceRows: batches, loading: batchesLoading } = useBatchesData()
  const [saving, setSaving] = useState(false)
  const [recordingUploadError, setRecordingUploadError] = useState(null)
  const [testSeriesErrors, setTestSeriesErrors] = useState({})
  const [recurring, setRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState(null)
  const [recurrenceEditScope, setRecurrenceEditScope] = useState('series')
  const [timezone, setTimezone] = useState('Asia/Kolkata')

  const contentTypes = useMemo(
    () => getSubjectContentTypes(subject?.categories),
    [subject?.categories],
  )

  const [activeType, setActiveType] = useState(contentTypes[0] || 'live')

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

  useInitOnModalOpen(open, `add-content:${subject?.id}`, () => {
    const seeded = subjectToForm(subjectRef.current)
    reset({ ...seeded, contentType: contentTypes[0] || 'live' })
    setActiveType(contentTypes[0] || 'live')
    setRecurring(false)
    setRecurrence(null)
    setRecordingUploadError(null)
    setTestSeriesErrors({})
    clearErrors()
  })

  const watchedDate = watch('date')

  const handleRecurringToggle = (enabled) => {
    setRecurring(enabled)
    if (enabled) {
      setRecurrence((prev) =>
        prev?.enabled ? prev : createRecurrenceFromSubjectForm({ date: watchedDate, timezone }),
      )
    } else {
      setRecurrence(null)
    }
  }

  const onFormSubmit = async (values) => {
    const payload = {
      ...values,
      contentType: activeType,
      recurring,
      recurrence: recurring && recurrence?.enabled ? recurrence : null,
      recurrenceEditScope,
      timezone,
    }

    const validationErrors = validateContentForm(payload, activeType, {
      allSubjects: subjects,
      subjectId: subject?.id || '',
      excludeLessonIds: getExcludeLessonIds(subject, null, subjects),
    })

    if (Object.keys(validationErrors).length) {
      const tsErr = {}
      Object.entries(validationErrors).forEach(([key, message]) => {
        if (key.startsWith('testSeries_')) tsErr[key] = message
        else if (key === 'recurrence') toast.error(message)
        else setError(key, { type: 'manual', message })
      })
      setTestSeriesErrors(tsErr)
      if (Object.keys(tsErr).length) toast.error('Please complete the Prelims Test section')
      else toast.error('Please fix the highlighted fields')
      return
    }
    setTestSeriesErrors({})
    setSaving(true)
    try {
      await onSubmit(payload, activeType)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!subject) return null

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
                <Plus className="h-5 w-5 text-[#246392]" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Add Content</h2>
                <p className="text-xs text-white/85 sm:text-sm">{subject.subjectName}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-white underline-offset-2 hover:underline">
              Close
            </button>
          </div>
        </div>

        {contentTypes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Layers className="h-12 w-12 text-[#9ca0a8]" />
            <p className="text-sm text-[#686868]">
              No content categories were selected for this subject. Edit the subject to add categories first.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-slate-200/80 bg-white/60 px-4 pt-4 sm:px-6">
              <div className="flex flex-wrap gap-2" role="tablist">
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={activeType === type}
                    onClick={() => {
                      setActiveType(type)
                      setValue('contentType', type)
                      clearErrors()
                      setTestSeriesErrors({})
                    }}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold transition',
                      activeType === type
                        ? 'bg-gradient-to-r from-[#1a3a5c] to-[#03045e] text-white shadow-sm'
                        : 'bg-[#eef2fc] text-[#246392] hover:bg-[#e8f4fc]',
                    )}
                  >
                    {contentTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeType}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <SubjectContentFields
                    contentType={activeType}
                    register={register}
                    control={control}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    clearErrors={clearErrors}
                    subject={subject}
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
                    isRecurringEdit={false}
                    lessonsForConflicts={flattenSubjectsLiveClassesForConflicts(subjects)}
                    excludeLessonIds={getExcludeLessonIds(subject, null, subjects)}
                    actorName={actorName}
                    recordingUploadError={recordingUploadError}
                    onRecordingUploadError={setRecordingUploadError}
                    testSeriesErrors={testSeriesErrors}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <FormFooter
              saving={saving}
              onReset={() => {
                const seeded = subjectToForm(subject)
                reset({ ...seeded, contentType: activeType })
              }}
            />
          </>
        )}
      </form>
    </SubjectModalShell>
  )
}
