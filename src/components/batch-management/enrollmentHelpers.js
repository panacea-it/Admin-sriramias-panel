import { mapPaymentStatusToApi, mapPaymentStatusToUi } from '../../utils/batchApiHelpers'
import { isMongoObjectId } from '../../utils/facultySubjectHelpers'

/**
 * Mongo enrollment _id for batch-enrollment API routes (PUT/PATCH/DELETE).
 * Display codes like ENR119 must NOT be used — they cause backend 500 cast errors.
 */
export function resolveEnrollmentApiId(student) {
  if (!student) return ''

  const studentMongoId = String(student.studentMongoId || '').trim()
  const candidates = [
    student.enrollmentMongoId,
    student.enrollmentApiId,
    student.id,
  ]

  for (const value of candidates) {
    const id = String(value || '').trim()
    if (!isMongoObjectId(id)) continue
    if (studentMongoId && id === studentMongoId) continue
    return id
  }

  return ''
}

export function findEnrollmentInList(rows = [], student) {
  if (!Array.isArray(rows) || !student) return null

  const apiId = resolveEnrollmentApiId(student)
  if (apiId) {
    const byMongo = rows.find((row) => resolveEnrollmentApiId(row) === apiId)
    if (byMongo) return byMongo
  }

  const displayId = String(student.enrollmentId || '').trim()
  if (displayId && displayId !== '—') {
    const byCode = rows.find((row) => String(row.enrollmentId || '').trim() === displayId)
    if (byCode) return byCode
  }

  return null
}

export function buildEnrollmentRowFromEdit(baseStudent, form, putResult) {
  const apiId = resolveEnrollmentApiId(putResult) || resolveEnrollmentApiId(baseStudent)
  const paymentStatus = mapPaymentStatusToUi(
    mapPaymentStatusToApi(form.paymentStatus || baseStudent?.paymentStatus),
  )

  return {
    ...baseStudent,
    ...(putResult && typeof putResult === 'object' ? putResult : {}),
    enrollmentApiId: apiId,
    enrollmentMongoId: apiId || baseStudent?.enrollmentMongoId || '',
    id: apiId || baseStudent?.id || baseStudent?.enrollmentId || '',
    name: String(form.name ?? '').trim() || baseStudent?.name || '—',
    email: String(form.email ?? '').trim() || baseStudent?.email || '',
    phone: String(form.phone ?? '').trim() || baseStudent?.phone || '',
    paymentStatus,
    attendance: Number(form.attendance ?? baseStudent?.attendance ?? 0) || 0,
    progress: Number(form.progress ?? baseStudent?.progress ?? 0) || 0,
    enrollmentId: baseStudent?.enrollmentId || putResult?.enrollmentId || '—',
    status: putResult?.status || baseStudent?.status || 'Active',
    enrolledAt: putResult?.enrolledAt || baseStudent?.enrolledAt || '',
  }
}

/** GET /batch-enrollments/:id with list-row fallback for edit/view prep. */
export async function fetchEnrollmentForEdit(student, { students = [], getEnrollmentById } = {}) {
  if (!student) return null

  const enrollmentId = resolveEnrollmentApiId(student)
  if (enrollmentId && typeof getEnrollmentById === 'function') {
    try {
      const fresh = await getEnrollmentById(enrollmentId)
      if (fresh) return fresh
    } catch {
      /* fall back to cached list row */
    }
  }

  return findEnrollmentInList(students, student) || student
}

/** List-only refresh — never calls GET /batch-enrollments/:id. */
export async function resolveLatestEnrollmentStudent({
  student,
  students = [],
  refetchStudents,
}) {
  if (!student) return null

  if (typeof refetchStudents === 'function') {
    const listResult = await refetchStudents()
    const fromList = findEnrollmentInList(listResult?.students || [], student)
    if (fromList) return fromList
  }

  return findEnrollmentInList(students, student) || student
}
