import { ROLES } from '../constants/roles'

/**
 * Demo / mock accounts for frontend RBAC testing.
 * Enable with VITE_ENABLE_DEMO_LOGIN=true or when API is unreachable.
 */
export const DEMO_AUTH_USERS = [
  {
    id: 'demo-super',
    name: 'Sriram Super Admin',
    email: 'superadmin@sriramias.com',
    password: 'Super@123',
    role: ROLES.SUPER_ADMIN,
    avatar: 'SA',
    centers: ['All Centers', 'Delhi Center', 'Mumbai Center'],
    status: 'active',
  },
  {
    id: 'demo-center',
    name: 'Delhi Center Admin',
    email: 'centeradmin@sriramias.com',
    password: 'Center@123',
    role: ROLES.CENTER_ADMIN,
    avatar: 'CA',
    center: 'Delhi Center',
    centers: ['Delhi Center'],
    status: 'active',
  },
  {
    id: 'demo-ops',
    name: 'Operations Lead',
    email: 'operations@sriramias.com',
    password: 'Ops@123',
    role: ROLES.OPERATION_ADMIN,
    avatar: 'OP',
    centers: ['All Centers'],
    status: 'active',
  },
  {
    id: 'demo-content',
    name: 'Content Manager',
    email: 'content@sriramias.com',
    password: 'Content@123',
    role: ROLES.CONTENT_ADMIN,
    avatar: 'CM',
    centers: ['All Centers'],
    status: 'active',
  },
  {
    id: 'demo-mentor',
    name: 'Mentor Coordinator',
    email: 'mentor@sriramias.com',
    password: 'Mentor@123',
    role: ROLES.MENTOR_ADMIN,
    avatar: 'MN',
    centers: ['All Centers'],
    status: 'active',
  },
  {
    id: 'demo-teacher',
    name: 'Faculty Admin',
    email: 'teacher@sriramias.com',
    password: 'Teacher@123',
    role: ROLES.TEACHER_ADMIN,
    avatar: 'TA',
    centers: ['All Centers'],
    status: 'active',
  },
  {
    id: 'demo-counsel',
    name: 'Counseling Lead',
    email: 'counselor@sriramias.com',
    password: 'Counsel@123',
    role: ROLES.COUNSELING_ADMIN,
    avatar: 'CL',
    centers: ['All Centers'],
    status: 'active',
  },
]

export function findDemoUser(email, password) {
  const e = email.trim().toLowerCase()
  const p = password.trim()
  return DEMO_AUTH_USERS.find(
    (u) => u.email.toLowerCase() === e && u.password === p && u.status !== 'inactive',
  )
}

export function getDemoUserByRole(roleId) {
  return DEMO_AUTH_USERS.find((u) => u.role === roleId)
}
