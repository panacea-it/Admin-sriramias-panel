import { isDemoAuthEnabled, isFrontendOnly } from '../config/appMode'
import { ROLES } from '../constants/roles'
import { findDemoUser } from '../data/demoAuthUsers'
import { loginSuperAdmin } from '../services/authService'
import { clearAuthStorage } from '../utils/authStorage'
import { findEmployeeByCredentials } from '../utils/employeeAuthStorage'
import { getLoginErrorMessage, mapLoginResponse, normalizeRole } from '../utils/authHelpers'

function toSafeUser(record) {
  const { password: _password, ...safe } = record
  void _password
  const name = safe.name || safe.fullName || safe.email?.split('@')[0] || 'Admin'
  return {
    ...safe,
    name,
    role: normalizeRole(safe.role),
    avatar:
      safe.avatar ||
      name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    centers: safe.centers || (safe.center ? [safe.center] : ['All Centers']),
  }
}

function mockAuthenticate(email, password) {
  const employee = findEmployeeByCredentials(email, password)
  if (employee) {
    return {
      user: toSafeUser(employee),
      accessToken: `employee-token-${employee.id || employee.email}`,
    }
  }

  const demo = findDemoUser(email, password)
  if (demo) {
    return {
      user: toSafeUser(demo),
      accessToken: `demo-token-${demo.id}`,
    }
  }

  throw new Error('No matching demo account for this email and password')
}

function assertExpectedRole(mapped, expectedRole) {
  if (expectedRole && mapped.user.role !== expectedRole) {
    throw new Error(
      'Selected role does not match this account. Choose the correct role or credentials.',
    )
  }
}

function shouldFallbackToDemo(error) {
  if (!isDemoAuthEnabled) return false
  const status = error?.status ?? error?.response?.status
  if (status === 401) return true
  if (error?.code === 'ERR_NETWORK' || !error?.response) return true
  return false
}

function resolveThrownMessage(error) {
  if (typeof error === 'object' && error?.message) return error.message
  return getLoginErrorMessage(error)
}

async function loginSuperAdminViaApi(credentials, expectedRole) {
  const data = await loginSuperAdmin(credentials)

  if (data?.success === false) {
    throw { message: data.message || 'Login failed' }
  }

  const mapped = mapLoginResponse(data)
  assertExpectedRole(mapped, expectedRole)
  return mapped
}

/**
 * Admin login — Super Admin uses live API when not in frontend-only mode.
 */
export async function login({ email, password, expectedRole }) {
  const credentials = {
    email: email.trim(),
    password: password.trim(),
  }

  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required')
  }

  const tryMock = () => {
    const result = mockAuthenticate(credentials.email, credentials.password)
    assertExpectedRole(result, expectedRole)
    return result
  }

  if (expectedRole === ROLES.SUPER_ADMIN && !isFrontendOnly) {
    try {
      return await loginSuperAdminViaApi(credentials, expectedRole)
    } catch (error) {
      if (shouldFallbackToDemo(error)) {
        try {
          return tryMock()
        } catch (demoError) {
          throw new Error(resolveThrownMessage(error), { cause: error })
        }
      }
      throw new Error(resolveThrownMessage(error), { cause: error })
    }
  }

  if (isFrontendOnly || isDemoAuthEnabled) {
    return tryMock()
  }

  return loginSuperAdminViaApi(credentials, expectedRole)
}

export function logout() {
  clearAuthStorage()
}
