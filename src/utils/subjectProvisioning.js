import { INITIAL_LIVE_CLASSES } from '../data/liveClassesData'
import {
  SUBJECT_BOOKS,
  SUBJECT_FACULTY_EXTRA,
  SUBJECT_LESSON_MODULES,
  SUBJECT_MATERIALS,
  SUBJECT_TESTS,
} from '../data/subjectProvisioningSeed'
import { parseDateForDisplay } from './academicsSubjectsStorage'
import {
  formatBatchSubjectDropdownLabel,
  mapFacultySubjectToBatchOption,
} from './facultySubjectBatch'

function todayIso() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function sessionTiming(row) {
  const time = row.scheduledTime || row.startTime || '—'
  const duration = row.durationMinutes
    ? `${row.durationMinutes} min`
    : row.duration || '—'
  return `${time} · ${duration}`
}

function classifySession(row, today = todayIso()) {
  const status = String(row.status || '').toLowerCase()
  if (status === 'completed') return 'completed'
  if (status === 'in active' || status === 'disabled') return 'completed'
  if (status === 'live' || status === 'ongoing') return 'ongoing'
  const date = row.scheduledDate || row.date || ''
  if (!date) return 'upcoming'
  if (date < today) return 'completed'
  if (date === today && (status === 'live' || status === 'scheduled')) return 'ongoing'
  return 'upcoming'
}

function mapFacultyLiveClass(lc, source) {
  return {
    id: lc.id,
    classTitle: lc.classTitle || lc.lessonName,
    facultyName: lc.teacher || source?.teacher || '—',
    date: parseDateForDisplay(lc.date || lc.scheduledDate),
    timing: sessionTiming(lc),
    center: lc.center || lc.location || '—',
    status: classifySession({ ...lc, date: lc.date || lc.scheduledDate }),
    source,
  }
}

/** Aggregate all provisioning preview data for a faculty subject. */
export function getSubjectProvisioning(subject, { liveLessons = INITIAL_LIVE_CLASSES } = {}) {
  if (!subject?.id) return null

  const subjectId = String(subject.id)
  const facultyLive = (subject.liveClasses || []).map((lc) =>
    mapFacultyLiveClass(lc, 'faculty'),
  )
  const moduleLive = liveLessons
    .filter((l) => String(l.subjectId) === subjectId)
    .map((l) => mapFacultyLiveClass(l, 'live-classes'))

  const seen = new Set()
  const liveClasses = [...facultyLive, ...moduleLive].filter((row) => {
    const key = `${row.classTitle}-${row.date}-${row.timing}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const buckets = {
    upcoming: liveClasses.filter((r) => r.status === 'upcoming'),
    ongoing: liveClasses.filter((r) => r.status === 'ongoing'),
    completed: liveClasses.filter((r) => r.status === 'completed'),
  }

  const lessonModules = SUBJECT_LESSON_MODULES[subjectId] || []
  const tests = SUBJECT_TESTS[subjectId] || []
  const materials = SUBJECT_MATERIALS[subjectId] || []
  const books = SUBJECT_BOOKS[subjectId] || []

  const facultyFromSubject = subject.teacher
    ? [
        {
          name: subject.teacher,
          role: 'Primary Faculty',
          experience: 'Assigned to this subject',
          classesAssigned: facultyLive.length,
        },
      ]
    : []

  const extraFaculty = SUBJECT_FACULTY_EXTRA[subjectId] || []
  const facultyNames = new Set(facultyFromSubject.map((f) => f.name))
  const faculty = [
    ...facultyFromSubject,
    ...extraFaculty.filter((f) => !facultyNames.has(f.name)),
  ]

  return {
    subjectId,
    subjectName: subject.subjectName || subject.subject || '—',
    topic: subject.topic || '—',
    teacher: subject.teacher || '—',
    liveClasses: buckets,
    lessonModules,
    tests,
    materials,
    books,
    faculty,
    counts: {
      liveClasses: liveClasses.length,
      lessons: lessonModules.reduce((n, m) => n + (m.lessons?.length || 0), 0),
      tests: tests.length,
      materials: materials.length,
      books: books.length,
      faculty: faculty.length,
    },
  }
}

export function formatFacultySubjectOption(subject) {
  const opt = mapFacultySubjectToBatchOption(subject)
  if (opt) return formatBatchSubjectDropdownLabel(opt)
  const id = subject?.id ? String(subject.id).padStart(3, '0') : ''
  const name = subject?.subjectName || subject?.subject || ''
  return `${id} · ${name}`
}
