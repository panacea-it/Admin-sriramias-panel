const FACULTY_SUBJECT_ID_KEY = 'facultySubjectId'
const LEGACY_RECORDING_FACULTY_SUBJECT_ID_KEY = 'recordingFacultySubjectId'
const FACULTY_SUBJECT_NAME_KEY = 'recordingFacultySubjectName'

function readStoredFacultySubjectId() {
  return (
    sessionStorage.getItem(FACULTY_SUBJECT_ID_KEY) ||
    sessionStorage.getItem(LEGACY_RECORDING_FACULTY_SUBJECT_ID_KEY)
  )
}

/** Persist Faculty Subject Mongo _id for recording/batch dropdown APIs. */
export function saveFacultySubjectId(id) {
  const value = String(id || '').trim()
  if (!value) return
  sessionStorage.setItem(FACULTY_SUBJECT_ID_KEY, value)
  sessionStorage.removeItem(LEGACY_RECORDING_FACULTY_SUBJECT_ID_KEY)
}

export function saveFacultySubjectName(name) {
  const value = String(name || '').trim()
  if (!value) return
  sessionStorage.setItem(FACULTY_SUBJECT_NAME_KEY, value)
}

export function getFacultySubjectId() {
  return readStoredFacultySubjectId()
}

/** Alias used by the Recording listing flow. */
export function getRecordingFacultySubjectId() {
  return getFacultySubjectId()
}

export function getFacultySubjectName() {
  return sessionStorage.getItem(FACULTY_SUBJECT_NAME_KEY)
}

export function clearFacultySubjectId() {
  sessionStorage.removeItem(FACULTY_SUBJECT_ID_KEY)
  sessionStorage.removeItem(LEGACY_RECORDING_FACULTY_SUBJECT_ID_KEY)
}

export function clearFacultySubjectName() {
  sessionStorage.removeItem(FACULTY_SUBJECT_NAME_KEY)
}
