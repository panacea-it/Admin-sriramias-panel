import { useCallback, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen } from 'lucide-react'
import ModalCloseButton from './ModalCloseButton'
import { toast } from '@/utils/toast'
import SubjectModalShell from './SubjectModalShell'
import SubjectCourseDetailsSection from './SubjectCourseDetailsSection'
import SubjectContentFields from './SubjectContentFields'
import { FormFooter } from './subjectFormUi'
import { useAuth } from '../../contexts/AuthContext'
import { useLiveClassFormOptions } from '../../hooks/useLiveClassFormOptions'
import { resolveFacultySubjectApiId } from '../../utils/liveClassHelpers'
import { useFacultySubjectFormOptions } from '../../hooks/useFacultySubjectFormOptions'
import {
  facultySubjectFormSchema,
  EMPTY_FACULTY_SUBJECT_FORM,
} from '../../modules/academics/facultySubjects/validation/facultySubject.schema'
import { facultySubjectToForm } from '../../modules/academics/facultySubjects/utils/facultySubjectFormUtils'
import {
  CATEGORY_OPTIONS,
  SUBJECT_DROPDOWN_OPTIONS,
  TEACHER_DROPDOWN_OPTIONS,
  TOPIC_DROPDOWN_OPTIONS,
} from '../../data/academicsSubjectsSeed'
import {
  SUBJECT_FORM_TEACHER_OPTIONS,
  SUBJECT_FORM_TOPIC_OPTIONS,
} from '../../data/subjectFormOptions'
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

function toNameOptions(items = []) {
  return items.map((item) => ({ value: item, label: item }))
}

function topicsForSubject(subjectKey) {
  const key = String(subjectKey || '').trim()
  if (!key) return []
  const fromHub = SUBJECT_FORM_TOPIC_OPTIONS.filter((t) => t.subject === key)
  if (fromHub.length) return fromHub.map((t) => ({ value: t.name, label: t.name }))
  return toNameOptions(TOPIC_DROPDOWN_OPTIONS)
}

function teachersForSubject(subjectKey) {
  const key = String(subjectKey || '').trim()
  if (!key) return []
  const fromHub = SUBJECT_FORM_TEACHER_OPTIONS.filter((t) => t.subject === key)
  if (fromHub.length) return fromHub.map((t) => ({ value: t.name, label: t.name }))
  return toNameOptions(TEACHER_DROPDOWN_OPTIONS)
}

function mergeSelectOptions(current = [], incoming = []) {
  const map = new Map(current.map((o) => [o.value, o]))
  incoming.forEach((o) => {
    if (o?.value) map.set(o.value, o)
  })
  return [...map.values()]
}

export default function SubjectModal({
  open,
  onClose,
  mode = 'add',
  context = 'subject',
  subject,
  liveClass,
  subjects = [],
  onSubmit,
  detailLoading = false,
  apiIntegrated = false,
}) {
  const { user } = useAuth()
  const actorName = user?.name || user?.email || 'Admin'
  const isEdit = mode === 'edit'
  const liveClassOnly = context === 'liveClass'
  const subjectOnly = context === 'subject'
  const useApiForm = subjectOnly && apiIntegrated
  const facultySubjectMongoId = resolveFacultySubjectApiId(subject, subject?.id)
  const [saving, setSaving] = useState(false)
  const [recordingUploadError, setRecordingUploadError] = useState(null)
  const [testSeriesErrors, setTestSeriesErrors] = useState({})

  const subjectOptions = useMemo(
    () => SUBJECT_DROPDOWN_OPTIONS.map((name) => ({ value: name, label: name })),
    [],
  )
  const categoryOptions = CATEGORY_OPTIONS
  const [topicOptions, setTopicOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])

  const apiFormOptions = useFacultySubjectFormOptions({
    open: open && useApiForm,
    enabled: useApiForm,
  })

  const resolvedSubjectOptions = useApiForm
    ? apiFormOptions.subjectOptions
    : subjectOptions
  const resolvedCategoryOptions = useApiForm
    ? apiFormOptions.categoryOptions
    : categoryOptions
  const resolvedTopicOptions = useApiForm ? apiFormOptions.topicOptions : topicOptions
  const resolvedTeacherOptions = useApiForm ? apiFormOptions.teacherOptions : teacherOptions
  const loadingSubjects = useApiForm ? apiFormOptions.loadingSubjects : false
  const loadingCategories = useApiForm ? apiFormOptions.loadingCategories : false
  const loadingFormOptions = useApiForm ? apiFormOptions.loadingFormOptions : false

  const applySubjectFormOptions = useCallback((subjectKey, { merge = false } = {}) => {
    const topics = topicsForSubject(subjectKey)
    const teachers = teachersForSubject(subjectKey)
    setTopicOptions((prev) => (merge ? mergeSelectOptions(prev, topics) : topics))
    setTeacherOptions((prev) => (merge ? mergeSelectOptions(prev, teachers) : teachers))
  }, [])

  const seedFormOptions = useCallback(({ topics = [], teachers = [] } = {}) => {
    if (topics.length) {
      setTopicOptions((prev) => mergeSelectOptions(prev, topics))
    }
    if (teachers.length) {
      setTeacherOptions((prev) => mergeSelectOptions(prev, teachers))
    }
  }, [])

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
  } = useForm({
    defaultValues: useApiForm ? EMPTY_FACULTY_SUBJECT_FORM : EMPTY_SUBJECT_FORM,
    resolver: useApiForm ? zodResolver(facultySubjectFormSchema) : undefined,
  })

  const subjectRef = useRef(subject)
  subjectRef.current = subject
  const liveClassRef = useRef(liveClass)
  liveClassRef.current = liveClass
  const seedKey = `${mode}:${context}:${getModalEditKey(subject ?? liveClass)}`
  const lastSubjectRef = useRef('')

  const syncRecurrenceState = (formValues) => {
    setRecurring(Boolean(formValues.recurring))
    setRecurrence(formValues.recurrence)
    setRecurrenceEditScope(formValues.recurrenceEditScope || 'series')
    setTimezone(formValues.timezone || 'Asia/Kolkata')
  }

  useInitOnModalOpen(open, seedKey, () => {
    const raw = subjectRef.current
    const seeded = useApiForm
      ? facultySubjectToForm(raw)
      : subjectToForm(raw, liveClassRef.current)
    lastSubjectRef.current = seeded.subject ? String(seeded.subject) : ''
    reset(seeded)
    syncRecurrenceState(seeded)
    clearErrors()
    setTestSeriesErrors({})
    setRecordingUploadError(null)
    if (subjectOnly && useApiForm) {
      if (seeded.subject) {
        apiFormOptions.loadCreateFormOptions(seeded.subject, { merge: isEdit })
      }
      if (raw?.topicMeta?.length || raw?.teacherMeta?.length) {
        apiFormOptions.seedFormOptions({
          topics: raw.topicMeta || [],
          teachers: raw.teacherMeta || [],
        })
      }
    } else if (subjectOnly) {
      applySubjectFormOptions(seeded.subject, { merge: isEdit })
      const existingTopics = Array.isArray(raw?.topics)
        ? raw.topics.map((name) => ({ value: name, label: name }))
        : raw?.topic
          ? [{ value: raw.topic, label: raw.topic }]
          : []
      const existingTeacher = raw?.teacher
        ? [{ value: raw.teacher, label: raw.teacher }]
        : []
      seedFormOptions({ topics: existingTopics, teachers: existingTeacher })
      if (seeded.subject && !seeded.subjectName?.trim()) {
        setValue('subjectName', seeded.subject)
      }
    }
  })

  const watchedDate = watch('date')
  const watchedSubjectId = watch('subject')
  const watchedCenterId = watch('centerId')
  const isRecurringEdit = isEdit && Boolean(liveClass?.recurrenceSeriesId)

  const {
    batches,
    centers,
    classrooms,
    loadingBatches: batchesLoading,
    loadingCenters: centersLoading,
    loadingClassrooms: classroomsLoading,
    batchesError,
  } = useLiveClassFormOptions({
    centerId: watchedCenterId,
    facultySubjectId: facultySubjectMongoId,
    enabled: liveClassOnly && open && Boolean(facultySubjectMongoId),
  })

  const handleSubjectChange = (subjectId) => {
    const id = String(subjectId || '')
    if (id === lastSubjectRef.current) return
    lastSubjectRef.current = id
    setValue('teacher', '')
    setValue('topics', [])
    if (useApiForm) {
      apiFormOptions.loadCreateFormOptions(id)
    } else {
      applySubjectFormOptions(id)
    }
    if (id && !watch('subjectName')?.trim() && !useApiForm) {
      setValue('subjectName', id)
    }
  }

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
    if (useApiForm) {
      if (loadingFormOptions || loadingSubjects || loadingCategories) {
        toast.error('Please wait for form options to finish loading.')
        return
      }
      if (isEdit && detailLoading) {
        toast.error('Subject is still loading. Please wait.')
        return
      }
      setSaving(true)
      try {
        await onSubmit(values)
        onClose()
      } catch {
        /* parent shows toast */
      } finally {
        setSaving(false)
      }
      return
    }

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

    if (subjectOnly && isEdit && detailLoading) {
      toast.error('Subject is still saving. Please wait.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(payload)
      onClose()
    } catch {
      /* parent shows toast */
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
            <ModalCloseButton onClick={onClose} aria-label="Close modal" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            {subjectOnly && (
              <SubjectCourseDetailsSection
                register={register}
                control={control}
                errors={errors}
                subjectOptions={resolvedSubjectOptions}
                topicOptions={resolvedTopicOptions}
                teacherOptions={resolvedTeacherOptions}
                categoryOptions={resolvedCategoryOptions}
                loadingSubjects={loadingSubjects}
                loadingCategories={loadingCategories}
                loadingFormOptions={loadingFormOptions}
                onSubjectChange={handleSubjectChange}
                disabledTopicsTeachers={!watchedSubjectId}
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
                facultySubjectId={facultySubjectMongoId}
                batches={batches}
                batchesLoading={batchesLoading}
                batchesError={batchesError}
                centerOptions={centers}
                centersLoading={centersLoading}
                classroomOptions={classrooms}
                classroomsLoading={classroomsLoading}
                onCenterChange={() => {
                  setValue('batchId', '', { shouldValidate: true })
                  setValue('batchIds', [], { shouldValidate: true })
                  setValue('classroomId', '', { shouldValidate: true })
                  setValue('classRoom', '', { shouldValidate: true })
                }}
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
          saving={saving || detailLoading}
          onReset={() => {
            const raw = subject
            const seeded = useApiForm
              ? facultySubjectToForm(raw)
              : subjectToForm(raw, liveClass)
            lastSubjectRef.current = seeded.subject ? String(seeded.subject) : ''
            reset(seeded)
            syncRecurrenceState(seeded)
            if (subjectOnly && useApiForm && seeded.subject) {
              apiFormOptions.loadCreateFormOptions(seeded.subject, { merge: isEdit })
            } else if (subjectOnly) {
              applySubjectFormOptions(seeded.subject, { merge: isEdit })
            }
          }}
        />
      </form>
    </SubjectModalShell>
  )
}
