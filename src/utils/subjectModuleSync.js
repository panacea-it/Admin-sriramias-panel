import { lessonFormToRow } from './liveClassesMappers'
import { saveLiveClass } from '../api/liveClassesAPI'
import { minutesToTimeString, timePartsToMinutes } from './classroomTime'

function mapLiveClassRowToLessonForm(lc, subject) {
  const topics = subject.topics?.length
    ? subject.topics
    : subject.topic
      ? [subject.topic]
      : []
  return {
    lessonName: lc.classTitle || subject.subjectName,
    topic: topics.join(', '),
    teacher: subject.teacher || '',
    location: lc.center || 'Delhi',
    classroomId: lc.classroomId || '',
    classroomName: lc.classroom || lc.classRoom || '',
    lessonType: 'Live',
    subjectId: subject.id,
    subjectName: subject.subjectName,
    mainCategoryName: subject.categories?.[0] || '',
    scheduledDate: lc.date || '',
    scheduledTime: lc.startTime || lc.scheduledTime || '10:00',
    duration: lc.durationMinutes || 60,
    timezone: lc.recurrence?.timezone || 'Asia/Kolkata',
    recurring: Boolean(lc.recurring),
    recurrence: lc.recurrence || null,
    status: lc.status === 'In Active' ? 'Disabled' : 'Scheduled',
    meetingProvider: 'zoom',
    zoomLink: '',
    description: '',
    videoFileName: '',
    notesFileName: '',
  }
}

function mapRecordingRowToLessonForm(rec, subject) {
  const topics = subject.topics?.length
    ? subject.topics
    : subject.topic
      ? [subject.topic]
      : []
  return {
    lessonName: rec.lessonName || subject.subjectName,
    topic: rec.topic || topics.join(', '),
    teacher: rec.teacher || subject.teacher || '',
    location: rec.center || 'Delhi',
    lessonType: 'Recording',
    subjectId: subject.id,
    subjectName: subject.subjectName,
    mainCategoryName: subject.categories?.[0] || '',
    scheduledDate: rec.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    scheduledTime: '00:00',
    duration: 60,
    status: rec.status === 'Active' ? 'Scheduled' : rec.status || 'Draft',
    description: rec.description || '',
    videoFileName: rec.videoFileName || '',
    videoDuration: rec.videoDuration || '',
    visibility: rec.visibility || 'Published',
    downloadable: Boolean(rec.downloadable),
  }
}

/**
 * Persist faculty-subject live classes into the global Live Classes / Schedule store.
 */
export async function syncSubjectLiveClassesToModule(liveClasses, subject, { actor = 'Admin' } = {}) {
  const synced = []
  for (const lc of liveClasses || []) {
    const form = mapLiveClassRowToLessonForm(lc, subject)
    const row = lessonFormToRow(form, lc.linkedLessonId ? { id: lc.linkedLessonId } : null)
    const saved = await saveLiveClass(row, {
      isEdit: Boolean(lc.linkedLessonId),
      id: lc.linkedLessonId,
      actor,
    })
    synced.push({ ...lc, linkedLessonId: saved?.id || lc.linkedLessonId })
  }
  return synced
}

/**
 * Persist faculty-subject recordings into the Recordings (lessonType Recording) store.
 */
export async function syncSubjectRecordingsToModule(recordings, subject, { actor = 'Admin' } = {}) {
  const synced = []
  for (const rec of recordings || []) {
    const form = mapRecordingRowToLessonForm(rec, subject)
    const row = lessonFormToRow(form, rec.linkedLessonId ? { id: rec.linkedLessonId } : null)
    const saved = await saveLiveClass(row, {
      isEdit: Boolean(rec.linkedLessonId),
      id: rec.linkedLessonId,
      actor,
    })
    synced.push({ ...rec, linkedLessonId: saved?.id || rec.linkedLessonId })
  }
  return synced
}

export function mapSubjectFormToPendingLiveClasses(form, subject, existingLiveClasses = []) {
  const startTime = minutesToTimeString(
    timePartsToMinutes(form.timeHrs, form.timeMin, form.timeSec),
  )
  return {
    classTitle: form.classTitle,
    center: form.center,
    classroomId: form.classroomId,
    date: form.date,
    startTime,
    timeHrs: form.timeHrs,
    timeMin: form.timeMin,
    timeSec: form.timeSec,
    durationHrs: form.durationHrs,
    durationMin: form.durationMin,
    durationSec: form.durationSec,
    recurring: form.recurring,
    recurrence: form.recurrence,
    status: form.status,
    linkedLessonId: existingLiveClasses[0]?.linkedLessonId,
  }
}
