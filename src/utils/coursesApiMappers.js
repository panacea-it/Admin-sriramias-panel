import { serializeBatchContent } from './batchFormMappers'
import { normalizeLinkedSubjects } from './batchHelpers'

/** MongoDB document → table row shape used by BatchesPage */
export function mapCourseFromApi(doc) {
  if (!doc) return null
  const id = doc._id ?? doc.id
  const fd = doc.formData || {}
  const catalogName = doc.linkedCourseName || fd.courseName || doc.catalogCourseName
  const batchName = doc.batchName || fd.batchName || doc.courseName
  return {
    id,
    name: batchName,
    batchId: doc.batchId || fd.batchId,
    batchName,
    courseId: doc.courseId || fd.courseId,
    academicCourseId: doc.academicCourseId || fd.academicCourseId,
    courseName: catalogName,
    linkedCourseName: catalogName,
    commencement: doc.commencement || fd.commencement,
    durationLabel: doc.durationLabel || fd.durationLabel,
    batchStartFrom: doc.batchStartFrom || fd.batchStartFrom,
    batchEndTo: doc.batchEndTo || fd.batchEndTo,
    bannerPreview: doc.bannerUrl || doc.bannerPreview || fd.bannerPreview || fd.bannerUrl,
    bannerFileName: doc.bannerFileName || fd.bannerFileName,
    status: doc.status || fd.status || 'Active',
    capacity: doc.capacity ?? fd.capacity,
    mergedInto: doc.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: doc.mergedIntoName ?? fd.mergedIntoName ?? null,
    feeDetails: doc.feeDetails || fd.feeDetails,
    linkedSubjects: doc.linkedSubjects || fd.linkedSubjects || [],
    mentorEmail: doc.mentorEmail || fd.mentorEmail || '',
    mentorEmployeeId: doc.mentorEmployeeId || fd.mentorEmployeeId || '',
    mentorName: doc.mentorName || fd.mentorName || '',
    mentorRoleId: doc.mentorRoleId || fd.mentorRoleId || '',
    mentorRoleLabel: doc.mentorRoleLabel || fd.mentorRoleLabel || '',
    trainerName: doc.trainerName || fd.trainerName || fd.mentorName || '',
    formData: fd,
    createdAt: doc.createdAt,
    modifiedAt: doc.modifiedAt,
  }
}

/** Batch modal form → API request body */
export function mapCourseToApiPayload(form, existing) {
  const batchName = form.batchName?.trim() || existing?.batchName || existing?.name
  const content = serializeBatchContent(form)
  const { subjects: _legacy, seo: _seo, ...formWithoutSubjects } = form
  void _legacy
  void _seo
  return {
    courseName: batchName,
    batchId: form.batchId || existing?.batchId,
    batchName,
    courseId: form.courseId || existing?.courseId,
    academicCourseId: form.academicCourseId || existing?.academicCourseId,
    linkedCourseName: form.courseName || existing?.courseName || existing?.linkedCourseName,
    commencement: form.commencement,
    durationLabel: form.durationLabel,
    batchStartFrom: form.batchStartFrom,
    batchEndTo: form.batchEndTo,
    bannerUrl: form.bannerPreview || form.bannerUrl,
    bannerFileName: form.bannerFileName,
    status: form.status || 'Active',
    feeDetails: content.feeDetails,
    linkedSubjects: normalizeLinkedSubjects(form),
    mentorEmail: form.mentorEmail || '',
    mentorEmployeeId: form.mentorEmployeeId || '',
    mentorName: form.mentorName || '',
    mentorRoleId: form.mentorRoleId || '',
    mentorRoleLabel: form.mentorRoleLabel || '',
    trainerName: form.trainerName || form.mentorName || '',
    formData: {
      ...formWithoutSubjects,
      feeDetails: content.feeDetails,
      linkedSubjects: normalizeLinkedSubjects(form),
    },
  }
}
