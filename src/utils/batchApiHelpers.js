import { normalizeLinkedSubjects } from './batchHelpers'
import { normalizeAcademicFeeDetails, serializeAcademicFeeDetails } from './feeDetailsForm'

const BATCH_STATUS_TO_API = {
  Active: 'ACTIVE',
  Upcoming: 'UPCOMING',
  'In Active': 'INACTIVE',
  Inactive: 'INACTIVE',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
  Cancelled: 'CANCELLED',
}

const BATCH_STATUS_FROM_API = {
  ACTIVE: 'Active',
  UPCOMING: 'Upcoming',
  INACTIVE: 'Inactive',
  IN_ACTIVE: 'Inactive',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
}

export function mapBatchStatusToApi(status) {
  const raw = String(status || 'Active').trim()
  if (BATCH_STATUS_TO_API[raw]) return BATCH_STATUS_TO_API[raw]
  const upper = raw.toUpperCase().replace(/\s+/g, '_')
  return upper || 'ACTIVE'
}

export function mapApiBatchStatusToUi(status) {
  const upper = String(status || 'ACTIVE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  return BATCH_STATUS_FROM_API[upper] || 'Active'
}

/** Parse labels like "6 Months", "1 Year", "12" into months for the API. */
export function parseDurationInMonths(durationLabel) {
  const text = String(durationLabel || '').trim().toLowerCase()
  if (!text) return 0

  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*years?/)
  if (yearMatch) return Math.max(1, Math.round(Number(yearMatch[1]) * 12))

  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*months?/)
  if (monthMatch) return Math.max(1, Math.round(Number(monthMatch[1])))

  const digits = parseInt(text.replace(/\D/g, ''), 10)
  return Number.isFinite(digits) && digits > 0 ? digits : 0
}

export function buildBatchFeesJson(form) {
  const serialized = serializeAcademicFeeDetails(form.feeDetails)
  return {
    currency: serialized.currency || 'INR',
    onlineAmount: serialized.onlinePaymentAmount || 0,
    offlineAmount: serialized.offlinePaymentAmount || 0,
    discountAmount: serialized.discountFee || 0,
    onlineBulletPoints: serialized.onlinePaymentBullets || [],
    offlineBulletPoints: serialized.offlinePaymentBullets || [],
  }
}

/** JSON body for PUT /api/batches/:id (matches Postman collection) */
export function buildUpdateBatchJsonPayload(form) {
  return {
    batchName: String(form.batchName || '').trim(),
    courseId: resolveCourseId(form),
    commencementDate: String(form.commencement || '').trim(),
    durationInMonths: parseDurationInMonths(form.durationLabel),
    batchStartDate: String(form.batchStartFrom || '').trim(),
    batchEndDate: String(form.batchEndTo || '').trim(),
    fees: buildBatchFeesJson(form),
    facultySubjects: resolveFacultySubjectIds(form),
    status: mapBatchStatusToApi(form.status || 'Active'),
  }
}

function mapFacultySubjectsToLinked(facultySubjects = []) {
  if (!Array.isArray(facultySubjects)) return []
  return facultySubjects
    .map((entry) => {
      if (typeof entry === 'string') {
        return { subjectId: entry, subjectName: '' }
      }
      if (entry && typeof entry === 'object') {
        const subjectId = entry.subjectId ?? entry._id ?? entry.id
        if (!subjectId) return null
        return {
          subjectId: String(subjectId),
          subjectName: String(entry.subjectName || entry.name || '').trim(),
          facultyId: String(entry.facultyId || '').trim(),
          facultyName: String(entry.facultyName || '').trim(),
        }
      }
      return null
    })
    .filter(Boolean)
}

function formatApiDate(value) {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) return str
  return parsed.toISOString().slice(0, 10)
}

function resolveMediaUrl(media) {
  if (!media) return ''
  if (typeof media === 'string') return media
  if (typeof media === 'object' && media.url) return String(media.url)
  return ''
}

function mapApiFeesToUi(fees = {}) {
  return normalizeAcademicFeeDetails({
    currency: fees.currency || 'INR',
    discountFee: fees.discountFee ?? fees.discountAmount ?? '',
    onlinePaymentAmount: fees.onlineAmount ?? fees.onlinePaymentAmount ?? '',
    offlinePaymentAmount: fees.offlineAmount ?? fees.offlinePaymentAmount ?? '',
    onlinePaymentBullets: fees.onlineBulletPoints ?? fees.onlinePaymentBullets ?? [],
    offlinePaymentBullets: fees.offlineBulletPoints ?? fees.offlinePaymentBullets ?? [],
  })
}

export function resolveBatchCourseId(form) {
  return String(form.academicCourseId || form.courseId || '').trim()
}

function resolveCourseId(form) {
  return resolveBatchCourseId(form)
}

function resolveFacultySubjectIds(form) {
  return normalizeLinkedSubjects(form).map((s) => String(s.subjectId))
}

export function mapBatchListStatusParam(status) {
  if (!status || status === 'all') return undefined
  return mapBatchStatusToApi(status)
}

async function resolveBannerFile(form) {
  if (form.bannerFile instanceof File) return form.bannerFile

  const preview = form.bannerPreview || form.bannerUrl
  if (typeof preview === 'string' && preview.startsWith('blob:')) {
    const response = await fetch(preview)
    const blob = await response.blob()
    const name = form.bannerFileName || 'banner.webp'
    return new File([blob], name, { type: blob.type || 'image/webp' })
  }

  return null
}

export async function buildCreateBatchFormData(form) {
  const formData = new FormData()

  formData.append('batchName', String(form.batchName || '').trim())
  formData.append('courseId', resolveCourseId(form))
  formData.append('durationInMonths', String(parseDurationInMonths(form.durationLabel)))
  formData.append('facultySubjects', JSON.stringify(resolveFacultySubjectIds(form)))
  formData.append('feesJson', JSON.stringify(buildBatchFeesJson(form)))
  formData.append('status', mapBatchStatusToApi(form.status || 'Active'))
  formData.append('commencementDate', String(form.commencement || '').trim())
  formData.append('batchStartDate', String(form.batchStartFrom || '').trim())
  formData.append('batchEndDate', String(form.batchEndTo || '').trim())

  const bannerFile = await resolveBannerFile(form)
  if (bannerFile) {
    formData.append('bannerImage', bannerFile)
  }

  return formData
}

/** Mongo batch document → row shape used by Batch Manager tables */
export function mapBatchFromApi(doc) {
  if (!doc) return null

  const id = doc._id ?? doc.id
  if (!id) return null

  const fees = doc.fees || doc.feesJson || doc.feeDetails || {}
  const linkedSubjects = mapFacultySubjectsToLinked(
    doc.facultySubjects || doc.linkedSubjects || [],
  )
  const batchName = doc.batchName || doc.name || ''
  const courseName =
    doc.courseName ||
    doc.linkedCourseName ||
    doc.course?.courseName ||
    doc.course?.name ||
    ''
  const courseMongoId = doc.course?._id || doc.academicCourseId || ''
  const courseCode = doc.course?.courseId || doc.courseId || ''
  const bannerUrl =
    resolveMediaUrl(doc.bannerImage) ||
    doc.bannerImageUrl ||
    doc.bannerUrl ||
    ''
  const brochureUrl =
    resolveMediaUrl(doc.brochure) ||
    doc.brochureUrl ||
    ''
  const commencement = formatApiDate(
    doc.commencementDate || doc.commencement || doc.formData?.commencement,
  )
  const batchStartFrom = formatApiDate(
    doc.batchStartDate || doc.batchStartFrom || doc.formData?.batchStartFrom,
  )
  const batchEndTo = formatApiDate(doc.batchEndDate || doc.batchEndTo || doc.formData?.batchEndTo)
  const durationLabel =
    doc.durationLabel ||
    doc.formData?.durationLabel ||
    (doc.durationInMonths ? `${doc.durationInMonths} Months` : '')
  const mentor = doc.mentor && typeof doc.mentor === 'object' ? doc.mentor : null

  const fd = doc.formData || {}

  return {
    id,
    name: batchName,
    batchId: doc.batchId || doc.batchCode || fd.batchId || '',
    batchName,
    courseId: courseCode || fd.courseId || '',
    academicCourseId: courseMongoId || fd.academicCourseId || '',
    courseName,
    linkedCourseName: courseName,
    commencement,
    durationLabel,
    batchStartFrom,
    batchEndTo,
    bannerPreview: bannerUrl || fd.bannerPreview || fd.bannerUrl || '',
    bannerUrl: bannerUrl || fd.bannerUrl || '',
    bannerFileName: doc.bannerFileName || fd.bannerFileName || '',
    brochureUrl: brochureUrl || fd.brochureUrl || '',
    brochureFileName: doc.brochureFileName || fd.brochureFileName || '',
    brochureFileSize: doc.brochureFileSize ?? fd.brochureFileSize ?? null,
    status: mapApiBatchStatusToUi(doc.status || fd.status),
    capacity: doc.capacity ?? fd.capacity,
    totalStudents: doc.totalStudents ?? fd.totalStudents,
    mergedInto: doc.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: doc.mergedIntoName ?? fd.mergedIntoName ?? null,
    feeDetails: mapApiFeesToUi(fees),
    linkedSubjects,
    mentorEmail: doc.mentorEmail || mentor?.email || fd.mentorEmail || '',
    mentorEmployeeId: doc.mentorEmployeeId || mentor?.employeeId || fd.mentorEmployeeId || '',
    mentorName: doc.mentorName || mentor?.name || fd.mentorName || '',
    mentorRoleId: doc.mentorRoleId || fd.mentorRoleId || '',
    mentorRoleLabel: doc.mentorRoleLabel || fd.mentorRoleLabel || '',
    trainerName: doc.trainerName || fd.trainerName || fd.mentorName || mentor?.name || '',
    formData: {
      ...fd,
      batchName,
      courseId: courseCode || fd.courseId,
      academicCourseId: courseMongoId || fd.academicCourseId,
      courseName,
      commencement,
      durationLabel,
      batchStartFrom,
      batchEndTo,
      bannerPreview: bannerUrl || fd.bannerPreview || fd.bannerUrl || '',
      bannerUrl: bannerUrl || fd.bannerUrl || '',
      brochureUrl: brochureUrl || fd.brochureUrl || '',
      feeDetails: mapApiFeesToUi(fees),
      linkedSubjects,
      status: mapApiBatchStatusToUi(doc.status || fd.status),
    },
    createdAt: doc.createdAt,
    modifiedAt: doc.updatedAt || doc.modifiedAt,
  }
}

export function unwrapBatchesListResponse(body) {
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.batches)) return body.data.batches
  if (Array.isArray(body?.batches)) return body.batches
  if (Array.isArray(body?.items)) return body.items
  return []
}

export function unwrapBatchesListMeta(body) {
  if (!body || Array.isArray(body)) {
    return { total: 0, page: 1, limit: 0, totalPages: 1, count: 0 }
  }
  return {
    total: Number(body.total ?? body.count ?? 0),
    page: Number(body.page ?? 1),
    limit: Number(body.limit ?? 0),
    totalPages: Number(body.totalPages ?? 1),
    count: Number(body.count ?? body.total ?? 0),
  }
}

export function logBatchApiDev(label, payload) {
  if (!import.meta.env.DEV) return
  console.log(`[batches API] ${label}`, payload)
}
