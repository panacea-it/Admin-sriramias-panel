import userService from '../services/userService'
import { normalizeUserListResponse } from './userHelpers'

function normalizeStudentId(value) {
  return String(value || '').trim().toUpperCase()
}

function pickStudentRow(items, studentId) {
  const target = normalizeStudentId(studentId)
  if (!target) return null

  return (
    items.find((row) => {
      const candidates = [row.studentId, row.userId, row._raw?.studentId]
        .map(normalizeStudentId)
        .filter(Boolean)

      return candidates.includes(target)
    }) || null
  )
}

export async function lookupStudentByStudentId(studentId) {
  const trimmed = String(studentId || '').trim()
  if (!trimmed) {
    return { ok: false, message: 'Student ID is required.' }
  }

  try {
    const data = await userService.getUsers({
      page: 1,
      limit: 50,
      search: trimmed,
      role: 'STUDENT',
      recordType: 'STUDENT',
    })

    const { items = [] } = normalizeUserListResponse(data, { page: 1, limit: 50 })
    const match = pickStudentRow(items, trimmed)

    if (!match) {
      return {
        ok: false,
        message:
          'No enrolled student found for this Student ID. Create the student in Users → List Users first, then use that ID here.',
      }
    }

    const studentName =
      match.fullName && match.fullName !== '—' ? match.fullName.trim() : ''

    if (!studentName) {
      return {
        ok: false,
        message: 'Student record found but name is missing. Update the student profile first.',
      }
    }

    return {
      ok: true,
      studentId: match.studentId || match.userId || trimmed,
      studentName,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Could not verify Student ID. Please try again.',
    }
  }
}
