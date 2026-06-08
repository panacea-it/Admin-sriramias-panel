import { ROLES } from '../constants/roles'
import { EMPLOYEES_UPDATED_EVENT } from './mentorEmployees'

const STORAGE_KEY = 'sriram_admin_employees_v1'

function notifyEmployeesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EMPLOYEES_UPDATED_EVENT))
  }
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/**
 * @param {object} employee
 * @param {string} employee.id
 * @param {string} employee.name
 * @param {string} employee.email
 * @param {string} employee.password
 * @param {string} employee.role
 * @param {string} [employee.phone]
 * @param {string} [employee.center]
 * @param {string} [employee.employeeId]
 * @param {'active'|'inactive'} [employee.status]
 */
export function saveEmployeeAccount(employee) {
  const list = readAll()
  const email = employee.email.trim().toLowerCase()
  const next = list.filter((e) => e.email.toLowerCase() !== email)
  next.push({
    ...employee,
    email,
    status: employee.status || 'active',
    createdAt: employee.createdAt || new Date().toISOString(),
  })
  writeAll(next)
  notifyEmployeesUpdated()
  return employee
}

export function findEmployeeByCredentials(email, password) {
  const e = email.trim().toLowerCase()
  const p = password.trim()
  const row = readAll().find(
    (u) =>
      u.email.toLowerCase() === e &&
      u.password === p &&
      u.status !== 'inactive',
  )
  if (!row) return null
  const { password: _pw, ...safe } = row
  void _pw
  const name = row.name || row.fullName || 'Admin'
  const initials =
    row.avatar ||
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  return {
    ...safe,
    name,
    avatar: initials,
    role: row.role || ROLES.OPERATION_ADMIN,
    centers: row.centers || (row.center ? [row.center] : ['All Centers']),
  }
}

export function listEmployees() {
  return readAll()
}

export function deleteEmployeeByEmail(email) {
  const normalized = email.trim().toLowerCase()
  writeAll(readAll().filter((row) => row.email.toLowerCase() !== normalized))
  notifyEmployeesUpdated()
}
