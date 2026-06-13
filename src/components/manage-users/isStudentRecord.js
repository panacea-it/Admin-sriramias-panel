import { isStudentRow } from '../../services/manageUsersService'

/** Returns true when a user-list row represents a student account. */
export function isStudentRecord(row) {
  return isStudentRow(row)
}
