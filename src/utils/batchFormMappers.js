/** Batch-only form — scheduling, fees, and linked faculty subjects */

import {
  DEFAULT_FEE_DETAILS,
  normalizeAcademicFeeDetails,
  serializeAcademicFeeDetails,
} from './feeDetailsForm'
import { normalizeLinkedSubjects } from './batchHelpers'
import { enrichLinkedSubjectsWithFaculty } from './facultySubjectBatch'
import { loadAcademicsSubjects } from './academicsSubjectsStorage'
function resolveBatchLinkedSubjects(row = {}, fd = {}) {
  const fromArray = normalizeLinkedSubjects({
    linkedSubjects: row.linkedSubjects || fd.linkedSubjects,
  })
  if (fromArray.length) return fromArray
  const legacyId = row.linkedSubjectId || fd.linkedSubjectId
  if (!legacyId) return []
  return [
    {
      subjectId: String(legacyId),
      subjectName: row.linkedSubjectName || fd.linkedSubjectName || '',
    },
  ]
}

export function serializeBatchContent(form) {
  return {
    feeDetails: serializeAcademicFeeDetails(form.feeDetails),
  }
}

export function validateBatchFee() {
  return {}
}

/** @deprecated Use validateBatchFee */
export const validateBatchSubjectAndFee = validateBatchFee

export function createEmptyBatchForm() {
  return {
    batchId: '',
    batchName: '',
    mentorEmail: '',
    mentorEmployeeId: '',
    mentorName: '',
    mentorRoleId: '',
    mentorRoleLabel: '',
    trainerName: '',
    academicCourseId: '',
    courseId: '',
    courseName: '',
    commencement: '',
    durationLabel: '',
    batchStartFrom: '',
    batchEndTo: '',
    bannerFileName: '',
    bannerPreview: '',
    bannerUrl: '',
    status: 'Active',
    linkedSubjects: [],
    feeDetails: { ...DEFAULT_FEE_DETAILS },
  }
}

/** Pre-fill Add Batch form when duplicating — new ID on save, name suffixed with (Copy). */
export function batchRowToDuplicateForm(row) {
  const base = batchRowToForm(row)
  const trimmed = (base.batchName || '').trim()
  const batchName =
    trimmed && !/\(copy\)$/i.test(trimmed) ? `${trimmed} (Copy)` : trimmed || 'Batch (Copy)'
  return {
    ...base,
    batchId: '',
    batchName,
  }
}

export function batchRowToForm(row) {
  if (!row) return createEmptyBatchForm()
  const fd = row.formData || {}
  return {
    ...createEmptyBatchForm(),
    batchId: row.batchId || fd.batchId || '',
    batchName: row.batchName || row.name || fd.batchName || '',
    mentorEmail: row.mentorEmail || fd.mentorEmail || '',
    mentorEmployeeId: row.mentorEmployeeId || fd.mentorEmployeeId || '',
    mentorName: row.mentorName || fd.mentorName || '',
    mentorRoleId: row.mentorRoleId || fd.mentorRoleId || '',
    mentorRoleLabel: row.mentorRoleLabel || fd.mentorRoleLabel || '',
    trainerName: row.trainerName || fd.trainerName || fd.mentorName || '',
    academicCourseId: row.academicCourseId || fd.academicCourseId || '',
    courseId: row.courseId || fd.courseId || '',
    courseName: row.courseName || fd.courseName || '',
    commencement: row.commencement || fd.commencement || '',
    durationLabel: row.durationLabel || fd.durationLabel || '',
    batchStartFrom: row.batchStartFrom || fd.batchStartFrom || '',
    batchEndTo: row.batchEndTo || fd.batchEndTo || '',
    bannerPreview: row.bannerPreview || fd.bannerPreview || fd.bannerUrl || '',
    bannerFileName: row.bannerFileName || fd.bannerFileName || '',
    bannerUrl: row.bannerUrl || fd.bannerUrl || '',
    status: row.status || fd.status || 'Active',
    linkedSubjects: enrichLinkedSubjectsWithFaculty(
      resolveBatchLinkedSubjects(row, fd),
      loadAcademicsSubjects(),
    ),
    feeDetails: normalizeAcademicFeeDetails(row.feeDetails || fd.feeDetails),
  }
}

export function batchFormToStorageRow(form, existing) {
  const displayName = form.batchName?.trim() || 'Untitled Batch'
  const content = serializeBatchContent(form)
  const { subjects: _legacySubjects, seo: _seo, ...formWithoutSubjects } = form
  void _legacySubjects
  void _seo
  return {
    id: existing?.id ?? `batch-${Date.now()}`,
    batchId: form.batchId || existing?.batchId,
    batchName: displayName,
    name: displayName,
    courseId: form.courseId || existing?.courseId,
    academicCourseId: form.academicCourseId || existing?.academicCourseId,
    courseName: form.courseName || existing?.courseName,
    commencement: form.commencement,
    durationLabel: form.durationLabel,
    batchStartFrom: form.batchStartFrom,
    batchEndTo: form.batchEndTo,
    bannerPreview: form.bannerPreview,
    bannerFileName: form.bannerFileName,
    status: form.status || 'Active',
    linkedSubjects: normalizeLinkedSubjects(form),
    feeDetails: content.feeDetails,
    formData: { ...formWithoutSubjects, ...content },
    createdAt: existing?.createdAt,
    modifiedAt: new Date().toISOString(),
  }
}
