import { normalizeLinkedSubjects } from './batchHelpers'
import { normalizeAcademicFeeDetails, serializeAcademicFeeDetails } from './feeDetailsForm'
import { isMongoObjectId } from './facultySubjectHelpers'
import { normalizeBatchUiStatus } from './batchOperations'
import { fileNameFromMediaUrl } from './courseMediaPrefill'

/** Extract a 24-char Mongo ObjectId from an API document field. */
export function parseMongoIdFromField(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'object' && raw.$oid) {
    const oid = String(raw.$oid).trim()
    return isMongoObjectId(oid) ? oid : ''
  }
  const str = String(raw).trim()
  return isMongoObjectId(str) ? str : ''
}

/** Prefer `_id`; only treat `id` as Mongo when it is a valid ObjectId (not BAT021). */
export function resolveBatchDocumentId(doc = {}) {
  if (!doc || typeof doc !== 'object') return ''
  const candidates = [doc._id, doc.mongoId, doc.batchMongoId]
  for (const raw of candidates) {
    const parsed = parseMongoIdFromField(raw)
    if (parsed) return parsed
  }
  return parseMongoIdFromField(doc.id)
}

export function unwrapCreateBatchDoc(body) {
  if (!body || typeof body !== 'object') return null
  const nested = body.data ?? body.batch ?? body.result ?? body.record
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    if (resolveBatchDocumentId(nested) || nested.batchId || nested.batchCode) return nested
  }
  if (resolveBatchDocumentId(body) || body.batchId || body.batchCode) return body
  return null
}

export function mapBatchStatusToApi(status) {
  const normalized = normalizeBatchUiStatus(status)
  return normalized === 'Deactivated' ? 'INACTIVE' : 'ACTIVE'
}

export function mapApiBatchStatusToUi(status) {
  return normalizeBatchUiStatus(status)
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

export function formatFormDateForApi(value) {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) return str
  return parsed.toISOString().slice(0, 10)
}

function resolveMentorId(form) {
  return String(form.mentorId || '').trim()
}

async function resolveBrochureFile(form) {
  if (form.brochureFile instanceof File) return form.brochureFile
  return null
}

async function appendBatchFormFields(formData, form) {
  formData.append('batchName', String(form.batchName || '').trim())
  const batchCode = String(form.batchCode || '').trim()
  if (batchCode) formData.append('batchCode', batchCode)
  const mentorId = resolveMentorId(form)
  if (mentorId) formData.append('mentorId', mentorId)
  formData.append('courseId', resolveCourseId(form))
  formData.append('durationInMonths', String(parseDurationInMonths(form.durationLabel)))
  formData.append('facultySubjects', JSON.stringify(resolveFacultySubjectIds(form)))
  formData.append('feesJson', JSON.stringify(buildBatchFeesJson(form)))
  formData.append('status', mapBatchStatusToApi(form.status || 'Active'))
  formData.append('commencementDate', formatFormDateForApi(form.commencement))
  formData.append('batchStartDate', formatFormDateForApi(form.batchStartFrom))
  formData.append('batchEndDate', formatFormDateForApi(form.batchEndTo))

  const bannerFile = await resolveBannerFile(form)
  if (bannerFile) {
    formData.append('bannerImage', bannerFile)
  }

  const brochureFile = await resolveBrochureFile(form)
  if (brochureFile) {
    formData.append('brochure', brochureFile)
  }

  return formData
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
  const candidates = [form?.academicCourseId, form?.courseId]
  for (const raw of candidates) {
    const id = String(raw || '').trim()
    if (isMongoObjectId(id)) return id
  }
  return ''
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
  return appendBatchFormFields(new FormData(), form)
}

export async function buildUpdateBatchFormData(form) {
  return appendBatchFormFields(new FormData(), form)
}

const PAYMENT_STATUS_TO_UI = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
  FAILED: 'Failed',
}

const PAYMENT_STATUS_TO_API = {
  Paid: 'PAID',
  Pending: 'PENDING',
  Partial: 'PARTIAL',
  Overdue: 'OVERDUE',
  Failed: 'FAILED',
}

export function mapPaymentStatusToUi(status) {
  const upper = String(status || 'PENDING')
    .trim()
    .toUpperCase()
  return PAYMENT_STATUS_TO_UI[upper] || status || 'Pending'
}

export function mapPaymentStatusToApi(status) {
  const raw = String(status || '').trim()
  if (PAYMENT_STATUS_TO_API[raw]) return PAYMENT_STATUS_TO_API[raw]
  const upper = raw.toUpperCase()
  return upper || 'PENDING'
}

export function mapPaymentFilterToApi(filter) {
  if (!filter || filter === 'all') return undefined
  return mapPaymentStatusToApi(filter)
}

export function mapAccountFilterToApi(filter) {
  if (!filter || filter === 'all') return undefined
  if (filter === 'Active') return 'ACTIVE'
  if (filter === 'In Active') return 'INACTIVE'
  return String(filter).trim().toUpperCase().replace(/\s+/g, '_')
}

export function mapAccountStatusToApi(status) {
  if (status === 'Active') return 'ACTIVE'
  if (status === 'In Active' || status === 'Deactivated') return 'INACTIVE'
  return String(status || 'ACTIVE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

export function mapEnrollmentStatusToUi(status) {
  const normalized = String(status ?? 'ACTIVE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (normalized === 'ACTIVE') return 'Active'
  if (normalized === 'INACTIVE' || normalized === 'IN_ACTIVE') return 'Deactivated'
  const raw = String(status ?? '').trim()
  return raw || 'Active'
}

function formatEnrollmentDate(value) {
  if (!value) return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) return str
  return parsed.toISOString().slice(0, 10)
}

function resolveEnrollmentMongoId(entry = {}) {
  const student = entry.student || {}
  const studentMongoId = isMongoObjectId(student._id) ? String(student._id).trim() : ''
  const nested = entry.enrollment && typeof entry.enrollment === 'object' ? entry.enrollment : {}
  const candidates = [
    entry._id,
    entry.id,
    entry.enrollmentMongoId,
    entry.batchEnrollmentId,
    nested._id,
    nested.id,
  ]
  for (const value of candidates) {
    const id = String(value || '').trim()
    if (!isMongoObjectId(id)) continue
    if (studentMongoId && id === studentMongoId) continue
    return id
  }
  return ''
}

/** Map API enrollment rows → batch student panel shape */
export function mapApiEnrollmentStudents(students = []) {
  if (!Array.isArray(students)) return []
  return students.map((entry) => {
    const student = entry.student || {}
    const rawEnrollmentStatus =
      entry.status ?? entry.accountStatus ?? student.enrollmentStatus ?? student.status ?? 'ACTIVE'
    const status = mapEnrollmentStatusToUi(rawEnrollmentStatus)
    const enrollmentMongoId = resolveEnrollmentMongoId(entry)
    const studentMongoId = isMongoObjectId(student._id) ? String(student._id).trim() : ''
    const displayEnrollmentId =
      entry.enrollmentId || entry.enrollmentNumber || entry.enrollmentCode || '—'
    const enrollmentApiId = enrollmentMongoId
    return {
      id: enrollmentMongoId || String(displayEnrollmentId),
      enrollmentApiId,
      enrollmentMongoId,
      studentMongoId,
      name: entry.studentName || entry.name || student.studentName || student.name || '—',
      email: entry.email || student.email || '',
      phone: entry.mobileNumber || entry.phone || student.mobileNumber || student.phone || '',
      enrollmentId: displayEnrollmentId,
      paymentStatus: mapPaymentStatusToUi(
        entry.paymentStatus ?? student.paymentStatus ?? 'PENDING',
      ),
      attendance:
        Number(
          entry.attendancePercentage ??
            entry.attendance ??
            student.attendancePercentage ??
            student.attendance ??
            0,
        ) || 0,
      progress:
        Number(
          entry.courseProgressPercentage ??
            entry.progress ??
            student.courseProgressPercentage ??
            student.progress ??
            0,
        ) || 0,
      status,
      enrolledAt: formatEnrollmentDate(
        entry.createdAt || entry.enrolledAt || entry.enrollmentDate,
      ),
    }
  })
}

export function unwrapBatchEnrollmentsList(body) {
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.enrollments)) return body.data.enrollments
  if (Array.isArray(body?.enrollments)) return body.enrollments
  if (Array.isArray(body?.items)) return body.items
  return []
}

export function unwrapBatchEnrollmentsMeta(body, fallback = {}) {
  const source = body?.data && !Array.isArray(body.data) ? body.data : body
  const total = Number(source?.total ?? source?.count ?? fallback.total ?? 0)
  const page = Number(source?.page ?? fallback.page ?? 1)
  const limit = Number(source?.limit ?? fallback.limit ?? 10)
  const pages = Number(
    source?.pages ?? source?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1),
  )
  return { total, page, pages, limit }
}

/** Mongo batch document → row shape used by Batch Manager tables */
export function mapBatchFromApi(doc) {
  if (!doc) return null

  const mongoId = resolveBatchDocumentId(doc)
  const fd = doc.formData || {}
  const humanBatchId = String(doc.batchId || doc.batchCode || fd.batchId || fd.batchCode || '').trim()
  if (!mongoId && !humanBatchId) return null

  const courseRef = doc.linkedCourse || doc.course || {}
  const fees =
    doc.fees ||
    doc.feesJson ||
    doc.feeDetails ||
    (doc.currency || doc.onlinePaymentAmount != null
      ? {
          currency: doc.currency,
          onlineAmount: doc.onlinePaymentAmount,
          offlineAmount: doc.offlinePaymentAmount,
          discountAmount: doc.discountAmount,
          onlineBulletPoints: doc.onlineBulletPoints,
          offlineBulletPoints: doc.offlineBulletPoints,
        }
      : {})
  const linkedSubjects = mapFacultySubjectsToLinked(
    doc.facultySubjects || doc.linkedSubjects || [],
  )
  const batchName = doc.batchName || doc.name || ''
  const courseName =
    doc.courseName ||
    doc.linkedCourseName ||
    courseRef.courseName ||
    courseRef.name ||
    ''
  const courseMongoId =
    parseMongoIdFromField(courseRef._id) ||
    parseMongoIdFromField(doc.academicCourseId) ||
    ''
  const courseCode = (() => {
    const fromRef = String(courseRef.courseId || '').trim()
    if (fromRef && !isMongoObjectId(fromRef)) return fromRef
    const docCode = String(doc.courseId || '').trim()
    if (docCode && !isMongoObjectId(docCode)) return docCode
    return String(fd.courseId || '').trim()
  })()
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
    doc.commencementDate ||
      doc.dateOfCommencement ||
      doc.commencement ||
      doc.formData?.commencement,
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
  const mentorId =
    parseMongoIdFromField(doc.mentorId) ||
    parseMongoIdFromField(mentor?._id) ||
    parseMongoIdFromField(fd.mentorId) ||
    ''
  const mentorName =
    doc.mentorName || mentor?.fullName || mentor?.name || fd.mentorName || ''
  const mentorEmail =
    doc.mentorEmail || mentor?.officialEmail || mentor?.email || fd.mentorEmail || ''
  const apiStudents = mapApiEnrollmentStudents(doc.students)

  return {
    id: mongoId || humanBatchId,
    name: batchName,
    batchId: humanBatchId || mongoId,
    batchCode: String(doc.batchCode || fd.batchCode || doc.batchId || fd.batchId || '').trim() || humanBatchId,
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
    bannerFileName:
      doc.bannerFileName ||
      fd.bannerFileName ||
      (bannerUrl ? fileNameFromMediaUrl(bannerUrl) || 'banner-image' : ''),
    brochureUrl: brochureUrl || fd.brochureUrl || '',
    brochureFileName:
      doc.brochureFileName ||
      fd.brochureFileName ||
      (brochureUrl ? fileNameFromMediaUrl(brochureUrl) || 'batch-brochure.pdf' : ''),
    brochureFileSize: doc.brochureFileSize ?? fd.brochureFileSize ?? null,
    status: mapApiBatchStatusToUi(doc.status || fd.status),
    capacity: doc.capacity ?? fd.capacity,
    totalStudents: doc.totalStudents ?? fd.totalStudents,
    mergedInto: doc.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: doc.mergedIntoName ?? fd.mergedIntoName ?? null,
    feeDetails: mapApiFeesToUi(fees),
    linkedSubjects,
    mentorId: String(mentorId || ''),
    mentorEmail,
    mentorEmployeeId: doc.mentorEmployeeId || mentor?.employeeId || fd.mentorEmployeeId || '',
    mentorName,
    mentorRoleId: doc.mentorRoleId || mentor?.roleCode || fd.mentorRoleId || '',
    mentorRoleLabel: doc.mentorRoleLabel || mentor?.roleTitle || fd.mentorRoleLabel || '',
    trainerName: doc.trainerName || fd.trainerName || mentorName || fd.mentorName || '',
    students: apiStudents,
    studentCount: doc.studentCount ?? doc.totalStudents ?? apiStudents.length,
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
      bannerFileName:
        doc.bannerFileName ||
        fd.bannerFileName ||
        (bannerUrl ? fileNameFromMediaUrl(bannerUrl) || 'banner-image' : ''),
      brochureUrl: brochureUrl || fd.brochureUrl || '',
      brochureFileName:
        doc.brochureFileName ||
        fd.brochureFileName ||
        (brochureUrl ? fileNameFromMediaUrl(brochureUrl) || 'batch-brochure.pdf' : ''),
      feeDetails: mapApiFeesToUi(fees),
      linkedSubjects,
      status: mapApiBatchStatusToUi(doc.status || fd.status),
      mentorId: String(mentorId || ''),
      mentorEmail,
      mentorEmployeeId: doc.mentorEmployeeId || mentor?.employeeId || fd.mentorEmployeeId || '',
      mentorName,
      mentorRoleLabel: doc.mentorRoleLabel || mentor?.roleTitle || fd.mentorRoleLabel || '',
      trainerName: doc.trainerName || fd.trainerName || mentorName || '',
    },
    createdAt: doc.createdAt || doc.createdOn,
    modifiedAt: doc.updatedAt || doc.modifiedAt || doc.modifiedOn,
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
