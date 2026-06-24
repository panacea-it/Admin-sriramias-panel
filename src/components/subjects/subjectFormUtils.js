import {
  formatDurationFromForm,
  nextLiveClassId,
  nextPdfId,
  nextRecordingId,
  nextSubjectRowId,
} from '../../utils/academicsSubjectsStorage'
import { findClassroomById } from '../../utils/classroomsStorage'
import { durationFromHms, minutesToTimeString, timePartsToMinutes } from '../../utils/classroomTime'
import { findClassroomConflict } from '../../utils/classroomBookings'
import {
  createRecurrenceFromSubjectForm,
  validateSubjectRecurrence,
} from '../../utils/academicsSubjectsRecurrence'
import { createDefaultRecurrenceRule } from '../../utils/recurrenceEngine'
import {
  createEmptyTestSeriesBlock,
  normalizeTestSeriesBlock,
  resolveTestSeriesDurationMinutes,
  validateTestSeriesForm,
} from '../../utils/batchTestSeriesForm'
import { validatePrelimsTestSeriesExtras } from '../../utils/prelimsTestSeriesValidation'
import {
  isLiveClassCategory,
  isPdfCategory,
  isRecordedClassCategory,
  isTestSeriesCategory,
  normalizeCategories,
  normalizeTopics,
  shouldShowTestSeriesSection,
} from '../../utils/subjectCategoryHelpers'

export { shouldShowTestSeriesSection }

function normalizeBatchIds(values = {}) {
  if (Array.isArray(values.batchIds) && values.batchIds.length) {
    return [...new Set(values.batchIds.map(String).filter(Boolean))]
  }
  if (values.batchId?.trim()) return [String(values.batchId).trim()]
  return []
}

export const EMPTY_SUBJECT_FORM = {
  subjectName: '',
  subjectCode: '',
  description: '',
  subject: '',
  semester: '',
  academicYear: '',
  thumbnailFileName: '',
  topics: [],
  categories: [],
  teacher: '',
  batchId: '',
  batchIds: [],
  batch: '',
  classTitle: '',
  center: '',
  centerId: '',
  classroomId: '',
  classRoom: '',
  date: '',
  timeHrs: '00',
  timeMin: '00',
  timeSec: '00',
  durationHrs: '00',
  durationMin: '00',
  durationSec: '00',
  status: 'Active',
  recurring: false,
  recurrence: null,
  recurrenceEditScope: 'series',
  timezone: 'Asia/Kolkata',
  recordingLessonName: '',
  recordingCenter: '',
  recordingTopic: '',
  recordingTeacher: '',
  recordingVideoFileName: '',
  recordingVideoDuration: '',
  recordingDescription: '',
  recordingVisibility: 'Published',
  recordingDownloadable: false,
  recordingTags: '',
  recordingFile: null,
  pdfTitle: '',
  pdfFileName: '',
  pdfDescription: '',
  pdfTags: '',
  pdfVisibility: 'Published',
  testSeries: createEmptyTestSeriesBlock(),
  contentType: 'live',
}

function parseTimeToFormParts(timeStr) {
  if (!timeStr) return { hrs: '00', min: '00', sec: '00' }
  const parts = String(timeStr).split(':').map((x) => parseInt(x, 10) || 0)
  return {
    hrs: String(parts[0] ?? 0).padStart(2, '0'),
    min: String(parts[1] ?? 0).padStart(2, '0'),
    sec: String(parts[2] ?? 0).padStart(2, '0'),
  }
}

function categoriesFromSubject(subject, liveClass) {
  const fromSubject = normalizeCategories(subject?.categories ?? subject?.category)
  if (fromSubject.length) return fromSubject
  if (liveClass) return ['Live Class']
  return []
}

export function subjectToForm(subject, liveClass = null) {
  if (!subject && !liveClass) return { ...EMPTY_SUBJECT_FORM }
  const time = parseTimeToFormParts(liveClass?.startTime || liveClass?.scheduledTime)
  const recording = subject?.recordings?.[0]
  const topics = Array.isArray(subject?.topicIds) && subject.topicIds.length
    ? normalizeTopics(subject.topicIds)
    : normalizeTopics(subject?.topics ?? subject?.topic)
  const rawCategories = subject?.categories ?? subject?.category
  const categories = Array.isArray(rawCategories) && rawCategories.length
    ? rawCategories.map(String).filter(Boolean)
    : categoriesFromSubject(subject, liveClass)

  const pdf = subject?.pdfs?.[0]

  return {
    subjectName: subject?.subjectName || '',
    subjectCode: subject?.subjectCode || '',
    description: subject?.description || '',
    subject: subject?.subject ? String(subject.subject) : '',
    academicYear: subject?.academicYear || '',
    thumbnailFileName: subject?.thumbnailFileName || '',
    topics,
    categories: categories.length ? categories : [],
    teacher: subject?.teacherId
      ? String(subject.teacherId)
      : subject?.teacher
        ? String(subject.teacher)
        : '',
    batchId: subject?.batchId || subject?.batchIds?.[0] || '',
    batchIds: Array.isArray(subject?.batchIds)
      ? subject.batchIds.map(String).filter(Boolean)
      : subject?.batchId
        ? [String(subject.batchId)]
        : [],
    batch: subject?.batch || '',
    classTitle: liveClass?.classTitle || '',
    center: liveClass?.center || '',
    centerId: liveClass?.centerId || '',
    classroomId: liveClass?.classroomId || '',
    classRoom: liveClass?.classroom || liveClass?.classRoom || '',
    date: liveClass?.date || '',
    timeHrs: liveClass?.timeHrs || time.hrs,
    timeMin: liveClass?.timeMin || time.min,
    timeSec: liveClass?.timeSec || time.sec,
    durationHrs: liveClass?.durationHrs || '00',
    durationMin: liveClass?.durationMin || '00',
    durationSec: liveClass?.durationSec || '00',
    status: liveClass?.status || subject?.status || 'Active',
    recurring: Boolean(liveClass?.recurring),
    recurrence: liveClass?.recurrence
      ? { ...liveClass.recurrence }
      : liveClass?.recurring
        ? createDefaultRecurrenceRule({
            scheduledDate: liveClass?.date || '',
            timezone: liveClass?.recurrence?.timezone || 'Asia/Kolkata',
          })
        : null,
    recurrenceEditScope: 'series',
    timezone: liveClass?.recurrence?.timezone || 'Asia/Kolkata',
    recordingLessonName: recording?.lessonName || '',
    recordingCenter: recording?.center || '',
    recordingTopic: recording?.topic || topics[0] || '',
    recordingTeacher: recording?.teacher || subject?.teacher || '',
    recordingVideoFileName: recording?.videoFileName || '',
    recordingVideoDuration: recording?.videoDuration || '',
    recordingDescription: recording?.description || '',
    recordingVisibility: recording?.visibility || 'Published',
    recordingDownloadable: Boolean(recording?.downloadable),
    recordingTags: recording?.tags || '',
    pdfTitle: pdf?.title || '',
    pdfFileName: pdf?.fileName || '',
    pdfDescription: pdf?.description || '',
    pdfTags: pdf?.tags || '',
    pdfVisibility: pdf?.visibility || 'Published',
    testSeries: subject?.testSeries
      ? normalizeTestSeriesBlock(subject.testSeries)
      : createEmptyTestSeriesBlock(),
    contentType: 'live',
  }
}

export function buildSubjectFromForm(form, existing, subjectsList) {
  const id = existing?.id || nextSubjectRowId(subjectsList)
  const now = new Date().toISOString()
  const topics = normalizeTopics(form.topics)
  const categories = normalizeCategories(form.categories)

  return {
    id,
    subjectName: form.subjectName?.trim() || form.subject?.trim() || 'Untitled',
    topic: topics[0] || '',
    topics,
    categories,
    category: categories[0] || '',
    teacher: form.teacher?.trim() || '',
    subject: form.subject?.trim() || '',
    batchId: form.batchId?.trim() || form.batchIds?.[0] || '',
    batchIds: normalizeBatchIds(form),
    batch: form.batch?.trim() || '',
    status: form.status || 'Active',
    createdAt: existing?.createdAt || now,
    modifiedAt: now,
    liveClasses: existing?.liveClasses || [],
    recordings: existing?.recordings || [],
    pdfs: existing?.pdfs || [],
    enableTestSeries: Boolean(existing?.enableTestSeries || existing?.testSeries),
    testSeries: existing?.testSeries ?? null,
  }
}

export function buildLiveClassFromForm(form, existingLiveClass, subject) {
  const list = subject?.liveClasses || []
  const id = existingLiveClass?.id || nextLiveClassId(list)
  const classroom = findClassroomById(form.classroomId)
  const startTime = minutesToTimeString(
    timePartsToMinutes(form.timeHrs, form.timeMin, form.timeSec),
  )
  const durationMinutes = durationFromHms(
    form.durationHrs,
    form.durationMin,
    form.durationSec,
  )
  return {
    id,
    classTitle: form.classTitle?.trim() || 'Untitled Class',
    center: form.center?.trim() || '',
    centerId: form.centerId?.trim() || '',
    classroomId: form.classroomId || '',
    classroom: classroom?.name || form.classRoom?.trim() || '',
    classRoom: classroom?.name || form.classRoom?.trim() || '',
    date: form.date || '',
    startTime,
    scheduledTime: startTime,
    durationMinutes,
    timeHrs: form.timeHrs,
    timeMin: form.timeMin,
    timeSec: form.timeSec,
    durationHrs: form.durationHrs,
    durationMin: form.durationMin,
    durationSec: form.durationSec,
    duration: formatDurationFromForm(
      form.durationHrs,
      form.durationMin,
      form.durationSec,
    ),
    status: form.status || 'Active',
    recurring: Boolean(form.recurring),
    recurrence: form.recurring && form.recurrence?.enabled ? form.recurrence : null,
    recurrenceSeriesId: existingLiveClass?.recurrenceSeriesId ?? null,
    recurrenceParentId: existingLiveClass?.recurrenceParentId ?? null,
    isRecurrenceParent: false,
    isRecurrenceOccurrence: Boolean(form.recurring),
    occurrenceIndex: existingLiveClass?.occurrenceIndex ?? null,
    occurrenceCount: existingLiveClass?.occurrenceCount ?? null,
    batchId: form.batchId?.trim() || '',
    linkedLessonId: existingLiveClass?.linkedLessonId ?? null,
    calendarPayload: null,
  }
}

export function buildRecordingFromForm(form, existingRecording, subject) {
  const list = subject?.recordings || []
  const id = existingRecording?.id || nextRecordingId(list)
  const topics = normalizeTopics(form.topics)
  return {
    id,
    lessonName: form.recordingLessonName?.trim() || form.subjectName?.trim() || 'Untitled Recording',
    center: form.recordingCenter?.trim() || '',
    topic: form.recordingTopic?.trim() || topics[0] || '',
    teacher: form.recordingTeacher?.trim() || form.teacher?.trim() || '',
    videoFileName: form.recordingVideoFileName || '',
    videoDuration: form.recordingVideoDuration || '',
    description: form.recordingDescription?.trim() || '',
    visibility: form.recordingVisibility || 'Published',
    downloadable: Boolean(form.recordingDownloadable),
    status: form.recordingVisibility === 'Draft' ? 'Draft' : 'Active',
    tags: form.recordingTags?.trim() || '',
    batchId: form.batchId?.trim() || '',
    linkedLessonId: existingRecording?.linkedLessonId ?? null,
    createdAt: existingRecording?.createdAt || new Date().toISOString(),
  }
}

export function buildPdfFromForm(form, existingPdf, subject) {
  const list = subject?.pdfs || []
  const id = existingPdf?.id || nextPdfId(list)
  return {
    id,
    title: form.pdfTitle?.trim() || form.subjectName?.trim() || 'Untitled PDF',
    fileName: form.pdfFileName || '',
    description: form.pdfDescription?.trim() || '',
    tags: form.pdfTags?.trim() || '',
    visibility: form.pdfVisibility || 'Published',
    batchId: form.batchId?.trim() || '',
    status: form.pdfVisibility === 'Draft' ? 'Draft' : 'Active',
    createdAt: existingPdf?.createdAt || new Date().toISOString(),
  }
}

/** Allow 1–2 digit entry while typing; does not force padding until complete. */
export function clampTimeField(value, max = 59) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 2)
  if (digits === '') return ''
  const n = parseInt(digits, 10)
  if (Number.isNaN(n)) return ''
  const clamped = Math.min(max, n)
  if (digits.length < 2) return digits
  return String(clamped).padStart(2, '0')
}

/** Normalize a time segment on blur. */
export function finalizeTimeField(value, max = 59) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 2)
  if (digits === '') return '00'
  const n = Math.min(max, parseInt(digits, 10) || 0)
  return String(n).padStart(2, '0')
}

export function shouldShowLiveClassSection(
  values,
  { liveClassOnly = false, subjectOnly = false, contentType } = {},
) {
  if (subjectOnly) return false
  if (liveClassOnly) return true
  if (contentType) return contentType === 'live'
  return isLiveClassCategory(values.categories ?? values.category)
}

export function shouldShowRecordingSection(
  values,
  { liveClassOnly = false, subjectOnly = false, contentType } = {},
) {
  if (subjectOnly || liveClassOnly) return false
  if (contentType) return contentType === 'recording'
  return isRecordedClassCategory(values.categories ?? values.category)
}

export function shouldShowPdfSection(
  values,
  { subjectOnly = false, contentType } = {},
) {
  if (subjectOnly) return false
  if (contentType) return contentType === 'pdf'
  return isPdfCategory(values.categories ?? values.category)
}

export function validateSubjectForm(
  values,
  {
    liveClassOnly = false,
    subjectOnly = false,
    contentType = null,
    requireLiveClass = false,
    allSubjects = [],
    subjectId = '',
    excludeLessonIds = [],
    hasExistingRecordingFile = false,
  } = {},
) {
  const errors = {}
  const categories = normalizeCategories(values.categories ?? values.category)
  const activeContent = contentType || values.contentType

  if (!liveClassOnly && !activeContent) {
    if (!values.subjectName?.trim()) errors.subjectName = 'Subject name is required'
    if (!values.subject?.trim()) errors.subject = 'Subject is required'
    if (!values.teacher?.trim()) errors.teacher = 'Faculty is required'
    const selectedCategories = Array.isArray(values.categories)
      ? values.categories.map(String).filter(Boolean)
      : []
    if (!selectedCategories.length) errors.categories = 'Select at least one category'
  }

  if (subjectOnly && !liveClassOnly && !activeContent) {
    if (!normalizeTopics(values.topics).length) {
      errors.topics = 'Select at least one topic'
    }
    return errors
  }

  const needsLiveClass =
    !subjectOnly &&
    (requireLiveClass ||
      liveClassOnly ||
      activeContent === 'live' ||
      (isLiveClassCategory(categories) &&
        !subjectOnly &&
        Boolean(values.classTitle?.trim() || values.center?.trim() || values.date?.trim())))

  if (needsLiveClass) {
    if (!normalizeBatchIds(values).length) {
      errors.batchIds = 'Select at least one batch'
    }
    if (!values.classTitle?.trim()) errors.classTitle = 'Class title is required'
    if (!values.centerId?.trim() && !values.center?.trim()) {
      errors.center = 'Center is required'
    }
    if (!values.classroomId?.trim()) errors.classRoom = 'Classroom is required'
    if (!values.date?.trim()) errors.date = 'Date is required'
    const startTime = minutesToTimeString(
      timePartsToMinutes(values.timeHrs, values.timeMin, values.timeSec),
    )
    const durationMinutes = durationFromHms(
      values.durationHrs,
      values.durationMin,
      values.durationSec,
    )
    if (values.classroomId && values.date && startTime) {
      const conflict = findClassroomConflict({
        classroomId: values.classroomId,
        date: values.date,
        startTime,
        durationMinutes,
        excludeSourceIds: values._excludeSourceIds || [],
      })
      if (conflict) {
        errors.classRoom =
          'This classroom is already occupied during the selected time.'
      }
    }
    Object.assign(
      errors,
      validateSubjectRecurrence({ ...values, categories }, {
        allSubjects,
        subjectId,
        excludeIds: excludeLessonIds,
      }),
    )
  }

  const needsRecording =
    !subjectOnly &&
    (activeContent === 'recording' ||
      (isRecordedClassCategory(categories) &&
        Boolean(
          values.recordingLessonName?.trim() ||
            values.recordingCenter?.trim() ||
            values.recordingVideoFileName,
        )))

  if (needsRecording && !liveClassOnly) {
    if (!values.batchId?.trim()) errors.batchId = 'Batch is required'
    if (!values.recordingLessonName?.trim()) {
      errors.recordingLessonName = 'Lesson name is required'
    }
    if (!values.recordingCenter?.trim()) {
      errors.recordingCenter = 'Center is required'
    }
    if (!values.recordingTopic?.trim()) {
      errors.recordingTopic = 'Topic is required'
    }
    if (!values.recordingTeacher?.trim()) {
      errors.recordingTeacher = 'Faculty is required'
    }
    const hasRecordingFile = values.recordingFile instanceof File
    if (!hasRecordingFile && !hasExistingRecordingFile) {
      errors.recordingVideoFileName = 'Upload a recording video'
    }
  }

  const needsTest = !subjectOnly && activeContent === 'test'
  const needsMainsAnswerWriting =
    !subjectOnly && activeContent === 'mainsAnswerWriting'

  if (needsTest && !liveClassOnly) {
    const batchIds = normalizeBatchIds(values)
    if (!batchIds.length) errors.batchIds = 'Select at least one batch'
    const ts = normalizeTestSeriesBlock(values.testSeries || {})
    Object.assign(
      errors,
      validateTestSeriesForm(ts, {
        errorPrefix: 'testSeries_',
        requireTestType: false,
        requireScheduleTime: true,
        requireMarksPerCorrectAnswer: true,
      }),
    )
    Object.assign(errors, validatePrelimsTestSeriesExtras(ts))
  }

  if (needsMainsAnswerWriting && !liveClassOnly) {
    const batchIds = normalizeBatchIds(values)
    if (!batchIds.length) errors.batchId = 'Batch is required'

    const ts = normalizeTestSeriesBlock(values.testSeries || {})
    const d = ts.details
    const s = ts.schedule
    const r = ts.resultSettings

    if (!d.testName) errors.testSeries_testName = 'Test name is required'

    const duration = resolveTestSeriesDurationMinutes(ts)
    if (!duration) errors.testSeries_duration = 'Duration is required'

    const marks = parseFloat(String(d.totalMarks))
    if (!Number.isFinite(marks) || marks <= 0) {
      errors.testSeries_totalMarks = 'Enter valid total marks'
    }

    if (!s.date) errors.testSeries_scheduleDate = 'Schedule date is required'

    if (!r.resultDate) errors.testSeries_resultDate = 'Result date is required'
    else if (s.date && r.resultDate < s.date) {
      errors.testSeries_resultDate = 'Result date cannot be before schedule date'
    }

    if (!String(d.manualQuestions || '').trim()) {
      errors.testSeries_manualQuestions = 'Please write at least one question'
    }

    if (!String(d.pdfFileName || '').trim()) {
      errors.testSeries_pdfFileName = 'Upload a PDF file'
    }
  }

  const needsPdf =
    !subjectOnly &&
    (activeContent === 'pdf' ||
      (isPdfCategory(categories) &&
        Boolean(values.pdfTitle?.trim() || values.pdfFileName)))

  if (needsPdf && !liveClassOnly) {
    if (!values.batchId?.trim()) errors.batchId = 'Batch is required'
    if (!values.pdfTitle?.trim()) errors.pdfTitle = 'PDF title is required'
    if (!values.pdfFileName?.trim()) errors.pdfFileName = 'Upload a PDF file'
  }

  return errors
}

/** Validate only the active Add Option content tab. */
export function validateContentForm(values, contentType, options = {}) {
  return validateSubjectForm(
    { ...values, contentType },
    { ...options, contentType, subjectOnly: false },
  )
}
