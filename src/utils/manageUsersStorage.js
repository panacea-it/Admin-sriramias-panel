import { DEFAULT_CENTER_NAMES, USER_ROLES } from '../data/manageUsersConfig'

const STORAGE_KEY = 'sriram_manage_users_v1'

const SEED_STUDENT_ADDRESSES = {
  'arjun.mehta@student.sriramias.in': {
    address: '123 Rajpath Colony, Connaught Place',
    city: 'New Delhi',
    pinCode: '110001',
  },
  'priya.sharma@student.sriramias.in': {
    address: '45 Jubilee Hills Road, Banjara Hills',
    city: 'Hyderabad',
    pinCode: '500034',
  },
  'vikram.singh@student.sriramias.in': {
    address: '123 ABC Street, Whitefield',
    city: 'Bangalore',
    pinCode: '560066',
  },
}

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nextUserId(list) {
  const max = list.reduce((m, row) => {
    const num = parseInt(String(row.userId || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `USR${String(max + 1).padStart(4, '0')}`
}

function defaultSeed() {
  const t = nowIso()
  const centers = DEFAULT_CENTER_NAMES
  const rows = [
    ['Arjun Mehta', 'arjun.mehta@student.sriramias.in', '9876543210', 'student', centers[0], 'Rajesh Mehta', '9876501234', '123 Rajpath Colony, Connaught Place', 'New Delhi', '110001'],
    ['Priya Sharma', 'priya.sharma@student.sriramias.in', '9876543211', 'student', centers[1], 'Sunil Sharma', '9876501235', '45 Jubilee Hills Road, Banjara Hills', 'Hyderabad', '500034'],
    ['Dr. Ravi Kumar', 'ravi.kumar@sriramias.in', '9876543220', 'faculty', centers[0], '', '', '', '', ''],
    ['Anita Desai', 'anita.desai@sriramias.in', '9876543221', 'faculty', centers[3], '', '', '', '', ''],
    ['Suresh Nair', 'suresh.nair@sriramias.in', '9876543230', 'employee', centers[2], '', '', '', '', ''],
    ['Kavitha Reddy', 'kavitha.reddy@sriramias.in', '9876543231', 'counselor', centers[1], '', '', '', '', ''],
    ['Rahul Verma', 'rahul.verma@sriramias.in', '9876543240', 'admin', centers[0], '', '', '', '', ''],
    ['Meera Iyer', 'meera.iyer@sriramias.in', '9876543241', 'support_staff', centers[4], '', '', '', '', ''],
    ['Vikram Singh', 'vikram.singh@student.sriramias.in', '9876543250', 'student', centers[4], 'Harpreet Singh', '9876501236', '123 ABC Street, Whitefield', 'Bangalore', '560066'],
    ['Deepa Joshi', 'deepa.joshi@sriramias.in', '9876543251', 'employee', centers[3], '', '', '', '', ''],
  ]
  return rows.map(
    ([fullName, email, phone, role, assignedCenter, parentName, parentPhone, address, city, pinCode], i) => ({
      id: newId(),
      userId: `USR${String(i + 1).padStart(4, '0')}`,
      fullName,
      email,
      phone,
      role,
      assignedCenter,
      parentName: String(parentName || '').trim(),
      parentPhone: String(parentPhone || '').trim(),
      address: String(address || '').trim(),
      city: String(city || '').trim(),
      pinCode: String(pinCode || '').trim(),
      status: i % 7 === 0 ? 'In Active' : 'Active',
      profileImage: '',
      joinedAt: t,
      updatedAt: t,
    }),
  )
}

function normalizeUser(row) {
  const validRole = USER_ROLES.some((r) => r.value === row.role)
  const seedAddress = SEED_STUDENT_ADDRESSES[String(row.email || '').trim().toLowerCase()] || {}
  return {
    id: row.id || newId(),
    userId: String(row.userId || '').trim(),
    fullName: String(row.fullName || '').trim(),
    email: String(row.email || '').trim().toLowerCase(),
    phone: String(row.phone || '').trim(),
    role: validRole ? row.role : 'student',
    assignedCenter: String(row.assignedCenter || '').trim(),
    status: row.status === 'In Active' ? 'In Active' : 'Active',
    profileImage: String(row.profileImage || ''),
    parentName: String(row.parentName || '').trim(),
    parentPhone: String(row.parentPhone || '').trim(),
    address: String(row.address || seedAddress.address || '').trim(),
    city: String(row.city || seedAddress.city || '').trim(),
    pinCode: String(row.pinCode || row.pincode || seedAddress.pinCode || '').trim(),
    joinedAt: row.joinedAt || nowIso(),
    updatedAt: row.updatedAt || row.joinedAt || nowIso(),
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStored(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('manage-users-updated', { detail: list }))
}

export function loadManageUsers() {
  const stored = readStored()
  if (stored?.length) return stored.map(normalizeUser)
  const seed = defaultSeed()
  writeStored(seed)
  return seed
}

export function saveManageUsers(list) {
  const normalized = list.map(normalizeUser)
  writeStored(normalized)
  return normalized
}

export function createManageUser(payload) {
  const list = loadManageUsers()
  const user = normalizeUser({
    ...payload,
    id: newId(),
    userId: payload.userId || nextUserId(list),
    joinedAt: nowIso(),
    updatedAt: nowIso(),
  })
  if (list.some((u) => u.email === user.email)) {
    return { ok: false, reason: 'Email already exists' }
  }
  const next = [user, ...list]
  saveManageUsers(next)
  return { ok: true, user }
}

export function updateManageUser(id, payload) {
  const list = loadManageUsers()
  const idx = list.findIndex((u) => String(u.id) === String(id))
  if (idx < 0) return { ok: false, reason: 'User not found' }
  const emailConflict = list.some(
    (u, i) => i !== idx && u.email === String(payload.email || '').trim().toLowerCase(),
  )
  if (emailConflict) return { ok: false, reason: 'Email already exists' }
  const updated = normalizeUser({
    ...list[idx],
    ...payload,
    id: list[idx].id,
    userId: list[idx].userId,
    joinedAt: list[idx].joinedAt,
    updatedAt: nowIso(),
  })
  const next = [...list]
  next[idx] = updated
  saveManageUsers(next)
  return { ok: true, user: updated }
}

export function findManageUserById(id) {
  const key = String(id || '').trim()
  if (!key) return null
  const list = loadManageUsers()
  return (
    list.find((u) => String(u.id) === key) ||
    list.find((u) => String(u.userId || '').toLowerCase() === key.toLowerCase()) ||
    null
  )
}
<<<<<<< HEAD

export function deleteManageUser(id) {
  const list = loadManageUsers()
  const next = list.filter((u) => String(u.id) !== String(id))
  if (next.length === list.length) return { ok: false, reason: 'User not found' }
  saveManageUsers(next)
  return { ok: true }
}
=======
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
