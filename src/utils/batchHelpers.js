import { INITIAL_BATCHES } from '../data/batchManagementData'
import { formatBatchSubjectDropdownLabel } from './facultySubjectBatch'
import { DEFAULT_BATCH_CAPACITY, normalizeBatchUiStatus } from './batchOperations'
import { resolveMentorDisplayName } from './mentorEmployees'
import { isMongoObjectId } from './facultySubjectHelpers'

/** Human-readable batch identifier for tables and search (batchId, then batchCode). */
export function resolveBatchDisplayId(row = {}) {
  const fd = row.formData || {}
  const id = String(row.batchId || fd.batchId || row.batchCode || fd.batchCode || '').trim()
  return id || '—'
}

/** Case-insensitive search across batch list fields. */
export function matchesBatchSearch(row = {}, query = '') {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  const mentorLabel = resolveMentorDisplayName(row)
  const courseName = row.linkedCourseName || row.courseName || ''
  const batchLabel = row.batchName || row.name || ''
  const displayName = courseName && batchLabel ? `${courseName} - ${batchLabel}` : batchLabel
  const haystack = [
    row.batchId,
    row.batchCode,
    row.batchName,
    row.name,
    row.courseName,
    row.linkedCourseName,
    displayName,
    row.mentorName,
    row.trainerName,
    mentorLabel,
  ]
    .map((v) => String(v || '').toLowerCase())
    .filter(Boolean)
  return haystack.some((value) => value.includes(q))
}

export function nextBatchId(rows = []) {
  const max = rows.reduce((m, row) => {
    const raw = row.batchId || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `BAT${String(max + 1).padStart(3, '0')}`
}

export function nextCourseId(rows = []) {
  const max = rows.reduce((m, row) => {
    const raw = row.courseId || row.formData?.courseId || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `CRS${String(max + 1).padStart(3, '0')}`
}

export function normalizeLinkedSubjects(form = {}) {
  let list = []
  if (Array.isArray(form.linkedSubjects) && form.linkedSubjects.length) {
    list = form.linkedSubjects.filter((s) => s?.subjectId)
  } else {
    const legacy = (form.subjects || []).filter(Boolean)
    list = legacy.map((s) => {
      if (typeof s === 'object' && s.subjectId) return s
      return { subjectId: String(s), subjectName: String(s) }
    })
  }
  const seen = new Set()
  return list
    .map((s) => ({
      subjectId: String(s.subjectId),
      subjectName: String(s.subjectName || '').trim(),
      facultyId: String(s.facultyId || '').trim(),
      facultyName: String(s.facultyName || '').trim(),
    }))
    .filter((s) => {
      if (seen.has(s.subjectId)) return false
      seen.add(s.subjectId)
      return true
    })
}

export function findBatchRow(rows, batchIdParam) {
  if (!batchIdParam) return null
  const decoded = decodeURIComponent(String(batchIdParam))
  return (
    rows.find((r) => {
      const id = String(r.id ?? '')
      const batchId = String(r.batchId ?? '')
      const batchCode = String(r.batchCode ?? r.formData?.batchCode ?? '')
      const courseId = String(r.courseId ?? '')
      return (
        id === decoded ||
        batchId === decoded ||
        batchCode === decoded ||
        courseId === decoded
      )
    }) ?? null
  )
}

/** Resolve Mongo _id for batch API calls from a route param or batch row. */
export function resolveBatchMongoId(batchOrRouteParam, rows = []) {
  if (batchOrRouteParam == null || batchOrRouteParam === '') return ''

  if (typeof batchOrRouteParam === 'object') {
    const mongoId = batchOrRouteParam.id ?? batchOrRouteParam._id
    if (isMongoObjectId(mongoId)) return String(mongoId).trim()
    const code = batchOrRouteParam.batchId || batchOrRouteParam.batchCode
    if (code) return resolveBatchMongoId(code, rows)
    return ''
  }

  const param = decodeURIComponent(String(batchOrRouteParam)).trim()
  if (!param) return ''
  if (isMongoObjectId(param)) return param

  const row = findBatchRow(rows, param)
  if (row?.id && isMongoObjectId(row.id)) return String(row.id).trim()

  return ''
}

export function enrichBatchRow(row, index = 0) {
  const fd = row.formData || {}
  return {
    ...row,
    batchId: row.batchId || fd.batchId || row.batchCode || fd.batchCode || `BAT${String(index + 1).padStart(3, '0')}`,
    batchCode: row.batchCode || fd.batchCode || row.batchId || fd.batchId || '',
    batchName: row.batchName || fd.batchName || row.name || '',
    courseId: row.courseId || fd.courseId || '—',
    courseName: row.courseName || row.linkedCourseName || fd.courseName,
    linkedCourseName: row.linkedCourseName || row.courseName || fd.courseName,
    commencement: row.commencement || fd.commencement || '',
    durationLabel: row.durationLabel || fd.durationLabel || fd.duration || '',
    batchStartFrom: row.batchStartFrom || fd.batchStartFrom || '',
    batchEndTo: row.batchEndTo || fd.batchEndTo || '',
    bannerPreview: row.bannerPreview || fd.bannerPreview || fd.bannerUrl || '',
    bannerFileName: row.bannerFileName || fd.bannerFileName || '',
    brochureUrl: row.brochureUrl || fd.brochureUrl || '',
    brochureFileName: row.brochureFileName || fd.brochureFileName || '',
    brochureFileSize: row.brochureFileSize ?? fd.brochureFileSize ?? null,
    createdAt: row.createdAt || fd.createdAt,
    modifiedAt: row.modifiedAt || fd.modifiedAt,
    capacity: row.capacity ?? fd.capacity ?? DEFAULT_BATCH_CAPACITY,
    center: row.center || fd.center || '',
    academicCourseId: row.academicCourseId || fd.academicCourseId || '',
    mergedInto: row.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: row.mergedIntoName ?? fd.mergedIntoName ?? null,
    totalStudents: row.totalStudents ?? row.studentCount ?? fd.totalStudents,
    mentorId: row.mentorId || fd.mentorId || '',
    mentorName: row.mentorName || fd.mentorName || '',
    status: normalizeBatchUiStatus(row.status || fd.status || 'Active'),
    students: row.students || [],
  }
}

/** Demo batches → enriched rows when API returns nothing (local dev / offline). */
export function mapInitialBatchesToRows() {
  return INITIAL_BATCHES.map((b, i) =>
    enrichBatchRow(
      {
        id: b.id,
        batchId: b.batchId,
        batchName: b.batchLabel,
        linkedCourseName: b.courseName,
        name: b.displayName,
        status: b.status,
        batchStartFrom: b.startDate,
        batchEndTo: b.endDate,
        formData: { trainerName: b.trainerName },
      },
      i,
    ),
  )
}

/** Maps API/enriched batch row + local students into the batch management table shape. */
export function mapBatchRowToTableFormat(row, students = [], totalStudentsOverride) {
  const fd = row.formData || {}
  const courseName = row.linkedCourseName || row.program || 'Course'
  const batchLabel = row.batchName || row.name || 'Batch'
  const totalStudents =
    totalStudentsOverride != null ? totalStudentsOverride : students.length
  const displayBatchId = resolveBatchDisplayId(row)
  return {
    id: row.id,
    batchId: displayBatchId,
    displayBatchId,
    batchName: batchLabel,
    courseName,
    batchLabel,
    displayName: `${courseName} - ${batchLabel}`,
    mentorName: resolveMentorDisplayName(row),
    trainerName: resolveMentorDisplayName(row),
    startDate: row.batchStartFrom || row.commencement || fd.batchStartFrom || '',
    endDate: row.batchEndTo || fd.batchEndTo || '',
    status: normalizeBatchUiStatus(row.status || fd.status || 'Active'),
    capacity: row.capacity ?? fd.capacity ?? DEFAULT_BATCH_CAPACITY,
    center: row.center || fd.center || '',
    academicCourseId: row.academicCourseId || fd.academicCourseId || row.courseId || fd.courseId || '',
    courseId: row.courseId || fd.courseId || '',
    mergedInto: row.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: row.mergedIntoName ?? fd.mergedIntoName ?? null,
    students,
    totalStudents,
    apiRow: row,
  }
}

export function formatLinkedSubjectDisplay(link) {
  if (!link) return ''
  return formatBatchSubjectDropdownLabel({
    subjectId: link.subjectId,
    subjectName: link.subjectName,
    facultyName: link.facultyName,
  })
}
