/** Batch-only form — scheduling, fees, and linked faculty subjects */

import {
  DEFAULT_FEE_DETAILS,
  normalizeAcademicFeeDetails,
  parsePaymentBullets,
  serializeAcademicFeeDetails,
} from './feeDetailsForm'
import { normalizeLinkedSubjects } from './batchHelpers'
import { enrichLinkedSubjectsWithFaculty } from './facultySubjectBatch'
import { loadAcademicsSubjects } from './academicsSubjectsStorage'
import { fileNameFromMediaUrl } from './courseMediaPrefill'
import { isMongoObjectId } from './facultySubjectHelpers'

function deriveMediaFileName(explicitName, url, fallback) {
  const name = String(explicitName || '').trim()
  if (name) return name
  const fromUrl = fileNameFromMediaUrl(url)
  if (fromUrl) return fromUrl
  return url ? fallback : ''
}

function resolveRowAcademicCourseId(row = {}, fd = {}) {
  const candidates = [row.academicCourseId, fd.academicCourseId, row.courseId, fd.courseId]
  for (const raw of candidates) {
    const id = String(raw || '').trim()
    if (isMongoObjectId(id)) return id
  }
  return String(row.academicCourseId || fd.academicCourseId || '').trim()
}

function resolveRowCourseCode(row = {}, fd = {}) {
  const candidates = [row.courseId, fd.courseId]
  for (const raw of candidates) {
    const id = String(raw || '').trim()
    if (id && !isMongoObjectId(id)) return id
  }
  return ''
}
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

export function validateBatchFee(form = {}) {
  const errors = {}
  const fee = form.feeDetails || {}

  if (!String(fee.onlinePaymentAmount ?? '').trim()) {
    errors.onlinePaymentAmount = 'Online payment amount is required'
  }
  if (!String(fee.offlinePaymentAmount ?? '').trim()) {
    errors.offlinePaymentAmount = 'Offline payment amount is required'
  }

  const onlineBullets =
    fee.onlinePaymentBullets ?? parsePaymentBullets(fee.onlinePaymentBulletsText)
  if (!onlineBullets.length) {
    errors.onlinePaymentBullets = 'Online payment bullet points are required'
  }

  const offlineBullets =
    fee.offlinePaymentBullets ?? parsePaymentBullets(fee.offlinePaymentBulletsText)
  if (!offlineBullets.length) {
    errors.offlinePaymentBullets = 'Offline payment bullet points are required'
  }

  return errors
}

/** @deprecated Use validateBatchFee */
export const validateBatchSubjectAndFee = validateBatchFee

export function createEmptyBatchForm() {
  return {
    batchId: '',
    batchCode: '',
    batchName: '',
    mentorId: '',
    mentorEmail: '',
    mentorEmployeeId: '',
    mentorName: '',
    mentorRoleId: '',
    mentorRoleLabel: '',
    trainerName: '',
    bannerFile: null,
    brochureFile: null,
    demoVideoFile: null,
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
    brochureFileName: '',
    brochureUrl: '',
    brochureFileSize: null,
    demoVideoFileName: '',
    demoVideoUrl: '',
    demoVideoFileSize: null,
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
    batchCode: '',
    batchName,
  }
}

export function batchRowToForm(row) {
  if (!row) return createEmptyBatchForm()
  const fd = row.formData || {}
  const bannerPreview =
    row.bannerPreview || fd.bannerPreview || row.bannerUrl || fd.bannerUrl || ''
  const bannerUrl = row.bannerUrl || fd.bannerUrl || bannerPreview
  const brochureUrl = row.brochureUrl || fd.brochureUrl || ''
  return {
    ...createEmptyBatchForm(),
    batchId: row.batchId || fd.batchId || '',
    batchCode: row.batchCode || fd.batchCode || row.batchId || fd.batchId || '',
    batchName: row.batchName || row.name || fd.batchName || '',
    mentorId: row.mentorId || fd.mentorId || '',
    mentorEmail: row.mentorEmail || fd.mentorEmail || '',
    mentorEmployeeId: row.mentorEmployeeId || fd.mentorEmployeeId || '',
    mentorName: row.mentorName || fd.mentorName || '',
    mentorRoleId: row.mentorRoleId || fd.mentorRoleId || '',
    mentorRoleLabel: row.mentorRoleLabel || fd.mentorRoleLabel || '',
    trainerName: row.trainerName || fd.trainerName || fd.mentorName || '',
    academicCourseId: resolveRowAcademicCourseId(row, fd),
    courseId: resolveRowCourseCode(row, fd),
    courseName: row.courseName || row.linkedCourseName || fd.courseName || '',
    commencement: row.commencement || fd.commencement || '',
    durationLabel: row.durationLabel || fd.durationLabel || '',
    batchStartFrom: row.batchStartFrom || fd.batchStartFrom || '',
    batchEndTo: row.batchEndTo || fd.batchEndTo || '',
    bannerPreview,
    bannerFileName: deriveMediaFileName(
      row.bannerFileName || fd.bannerFileName,
      bannerPreview,
      'banner-image',
    ),
    bannerUrl,
    brochureUrl,
    brochureFileName: deriveMediaFileName(
      row.brochureFileName || fd.brochureFileName,
      brochureUrl,
      'batch-brochure.pdf',
    ),
    brochureFileSize: row.brochureFileSize ?? fd.brochureFileSize ?? null,
    demoVideoUrl: row.demoVideoUrl || fd.demoVideoUrl || '',
    demoVideoFileName: row.demoVideoFileName || fd.demoVideoFileName || '',
    demoVideoFileSize: row.demoVideoFileSize ?? fd.demoVideoFileSize ?? null,
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
    brochureUrl: form.brochureUrl,
    brochureFileName: form.brochureFileName,
    brochureFileSize: form.brochureFileSize,
    demoVideoUrl: form.demoVideoUrl,
    demoVideoFileName: form.demoVideoFileName,
    demoVideoFileSize: form.demoVideoFileSize,
    status: form.status || 'Active',
    linkedSubjects: normalizeLinkedSubjects(form),
    feeDetails: content.feeDetails,
    formData: { ...formWithoutSubjects, ...content },
    createdAt: existing?.createdAt,
    modifiedAt: new Date().toISOString(),
  }
}
