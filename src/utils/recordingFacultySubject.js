import { isMongoObjectId } from './facultySubjectHelpers'
import { resolveFacultySubjectApiId } from './liveClassHelpers'
import {
  getFacultySubjectId,
  saveFacultySubjectId,
  saveFacultySubjectName,
} from './sessionStorage'

export { getRecordingFacultySubjectId } from './sessionStorage'

/** Faculty Subject document Mongo _id — used as `facultySubjectId` in batch/recording APIs. */
export function extractFacultySubjectMongoId(source) {
  if (!source) return ''
  const candidates = [source._id, source.id, source.apiId]
  for (const value of candidates) {
    const id = String(value || '').trim()
    if (isMongoObjectId(id)) return id
  }
  return ''
}

export function syncRecordingFacultySubjectFromNavigation(routeState) {
  const mongoId = extractFacultySubjectMongoId(routeState) ||
    (isMongoObjectId(routeState?.facultySubjectId) ? String(routeState.facultySubjectId).trim() : '')
  if (!mongoId) return
  saveFacultySubjectId(mongoId)
  if (routeState?.facultySubjectName) {
    saveFacultySubjectName(routeState.facultySubjectName)
  }
}

export function resolveRecordingFacultySubjectId(subject, routeSubjectId) {
  const fromSubject = extractFacultySubjectMongoId(subject)
  if (fromSubject) return fromSubject

  const fromSession = String(getFacultySubjectId() || '').trim()
  if (isMongoObjectId(fromSession)) return fromSession

  return resolveFacultySubjectApiId(subject, routeSubjectId)
}
