import {
  formatManageUserJoinDate,
  isStudentRow,
} from '../../utils/userHelpers'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

function pick(...values) {
  for (const value of values) {
    const v = typeof value === 'string' ? value.trim() : value
    if (v != null && v !== '') return v
  }
  return ''
}

function formatDisplayDate(value) {
  if (!value) return '—'
  const formatted = formatManageUserJoinDate(value)
  if (formatted && formatted !== '—') return formatted
  return formatCategoryDateTime(value)
}

export function buildUserDetailModel({ summary, student360 }) {
  if (!summary) return null

  const raw = summary._raw || {}
  const studentDetails =
    summary.studentDetails && typeof summary.studentDetails === 'object'
      ? summary.studentDetails
      : raw.studentDetails && typeof raw.studentDetails === 'object'
        ? raw.studentDetails
        : {}

  const isStudent = Boolean(student360?.isStudent || isStudentRow(summary))
  const enrollments = student360?.enrollments || []
  const primaryEnrollment = enrollments[0] || {}
  const financeProfile = student360?.financeProfile || null
  const documents = financeProfile?.documents || raw.documents || studentDetails.documents || []

  const activity = [...(student360?.activity || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  )

  const loginHistory = activity.filter((event) => event.type === 'login')

  return {
    isStudent,
    basic: {
      avatar: summary.profileImage || '',
      fullName: summary.fullName || '—',
      username: pick(summary.userId, summary.studentId, summary.employeeId, raw.username),
      email: summary.email || raw.officialEmail || '—',
      mobile: pick(summary.phoneNumber, summary.phone, raw.contactNumber, raw.mobile),
      gender: pick(studentDetails.gender, raw.gender),
      dateOfBirth: pick(studentDetails.dateOfBirth, studentDetails.dob, raw.dateOfBirth, raw.dob),
    },
    student: isStudent
      ? {
          studentId: pick(summary.studentId, summary.userId, raw.studentId),
          batch: pick(primaryEnrollment.batchName, studentDetails.batchName),
          course: pick(primaryEnrollment.courseName, studentDetails.courseName),
          program: pick(primaryEnrollment.programName, studentDetails.program, primaryEnrollment.courseName),
          center: pick(summary.assignedCenter, summary.center, raw.centerName),
          admissionDate: formatDisplayDate(
            pick(studentDetails.admissionDate, summary.joinedAt, summary.joinedDate, summary.createdAt),
          ),
          assignedMentor: pick(primaryEnrollment.trainerName, studentDetails.mentorName),
          enrollmentStatus: pick(primaryEnrollment.batchStatus, studentDetails.enrollmentStatus, summary.status),
        }
      : null,
    family: {
      fatherName: pick(studentDetails.fatherName, studentDetails.fathersName, raw.fatherName),
      motherName: pick(studentDetails.motherName, studentDetails.mothersName, raw.motherName),
      guardianName: pick(studentDetails.guardianName, summary.parentName, studentDetails.parentName),
      guardianContact: pick(
        studentDetails.guardianContact,
        summary.parentMobile,
        summary.parentPhone,
        studentDetails.parentMobile,
      ),
      emergencyContact: pick(studentDetails.emergencyContact, studentDetails.emergencyPhone, raw.emergencyContact),
    },
    address: {
      addressLine: pick(studentDetails.address, summary.address, raw.address, raw.addressLine),
      city: pick(studentDetails.city, summary.city, raw.city),
      state: pick(studentDetails.state, raw.state),
      country: pick(studentDetails.country, raw.country, 'India'),
      pincode: pick(studentDetails.pinCode, studentDetails.pincode, raw.pinCode, raw.pincode),
    },
    access: {
      role: summary.role || raw.roleTitle || '—',
      accountStatus: summary.status || '—',
      isActive: summary.status === 'Active',
      lastLogin: formatDisplayDate(raw.lastLoginAt || summary.lastLoginAt),
      createdDate: formatDisplayDate(summary.createdAt || summary.joinedAt),
      updatedDate: formatDisplayDate(summary.updatedAt),
    },
    documents: Array.isArray(documents) ? documents : [],
    activity,
    loginHistory,
  }
}
