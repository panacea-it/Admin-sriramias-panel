import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'sriram_centers_v1'

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowIso() {
  return new Date().toISOString()
}

function defaultSeed() {
  const t = nowIso()
  const rows = [
    ['Delhi Center', 'DLH', 'New Delhi', 'Delhi'],
    ['Mumbai Center', 'MUM', 'Mumbai', 'Maharashtra'],
    ['Bangalore Center', 'BLR', 'Bengaluru', 'Karnataka'],
    ['Chennai Center', 'CHE', 'Chennai', 'Tamil Nadu'],
    ['Hyderabad Center', 'HYD', 'Hyderabad', 'Telangana'],
  ]
  return rows.map(([centerName, centerCode, city, state]) => ({
    centerId: newId(),
    centerName,
    centerCode,
    address: '',
    state,
    city,
    contactNumber: '',
    email: '',
    status: 'active',
    assignedAdmins: [],
    linkedStudentCount: 0,
    createdAt: t,
    updatedAt: t,
  }))
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

function normalizeCenters(list) {
  return list.map((c) => ({
    centerId: c.centerId || newId(),
    centerName: String(c.centerName || '').trim(),
    centerCode: String(c.centerCode || '').trim(),
    address: String(c.address || ''),
    state: String(c.state || ''),
    city: String(c.city || ''),
    contactNumber: String(c.contactNumber || ''),
    email: String(c.email || ''),
    status: c.status === 'disabled' ? 'disabled' : 'active',
    assignedAdmins: Array.isArray(c.assignedAdmins) ? c.assignedAdmins.map(String) : [],
    linkedStudentCount: Number.isFinite(Number(c.linkedStudentCount))
      ? Number(c.linkedStudentCount)
      : 0,
    createdAt: c.createdAt || nowIso(),
    updatedAt: c.updatedAt || c.createdAt || nowIso(),
  }))
}

function loadInitialCenters() {
  const stored = readStored()
  if (stored?.length) return normalizeCenters(stored)
  const seed = defaultSeed()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

const CentersContext = createContext(null)

export function CentersProvider({ children }) {
  const [centers, setCenters] = useState(loadInitialCenters)

  const persist = useCallback((updater) => {
    setCenters((prev) => {
      const base = normalizeCenters(prev)
      const next = typeof updater === 'function' ? updater(base) : updater
      const normalized = normalizeCenters(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    })
  }, [])

  const activeCenters = useMemo(
    () => (Array.isArray(centers) ? centers : []).filter((c) => c.status === 'active'),
    [centers],
  )

  const activeCenterNames = useMemo(
    () =>
      [...activeCenters.map((c) => c.centerName).filter(Boolean)].sort((a, b) =>
        a.localeCompare(b),
      ),
    [activeCenters],
  )

  const headerCenterOptions = useMemo(
    () => ['All Centers', ...activeCenterNames],
    [activeCenterNames],
  )

  const createCenter = useCallback(
    (payload) => {
      const row = {
        centerId: payload.centerId || newId(),
        centerName: payload.centerName.trim(),
        centerCode: payload.centerCode.trim().toUpperCase(),
        address: payload.address.trim(),
        state: payload.state.trim(),
        city: payload.city.trim(),
        contactNumber: payload.contactNumber.trim(),
        email: payload.email.trim(),
        status: payload.status === 'disabled' ? 'disabled' : 'active',
        assignedAdmins: Array.isArray(payload.assignedAdmins)
          ? payload.assignedAdmins.map((s) => String(s).trim()).filter(Boolean)
          : [],
        linkedStudentCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      persist((prev) => [row, ...prev])
      return row
    },
    [persist],
  )

  const updateCenter = useCallback(
    (centerId, patch) => {
      persist((prev) =>
        prev.map((c) => {
          if (c.centerId !== centerId) return c
          const assignedAdmins =
            patch.assignedAdmins != null
              ? patch.assignedAdmins.map((s) => String(s).trim()).filter(Boolean)
              : c.assignedAdmins
          const status =
            patch.status === 'disabled' || patch.status === 'active' ? patch.status : c.status
          return {
            ...c,
            centerName:
              patch.centerName != null ? String(patch.centerName).trim() : c.centerName,
            centerCode:
              patch.centerCode != null
                ? String(patch.centerCode).trim().toUpperCase()
                : c.centerCode,
            address: patch.address != null ? String(patch.address).trim() : c.address,
            state: patch.state != null ? String(patch.state).trim() : c.state,
            city: patch.city != null ? String(patch.city).trim() : c.city,
            contactNumber:
              patch.contactNumber != null ? String(patch.contactNumber).trim() : c.contactNumber,
            email: patch.email != null ? String(patch.email).trim() : c.email,
            status,
            assignedAdmins,
            linkedStudentCount:
              patch.linkedStudentCount != null
                ? Number(patch.linkedStudentCount) || 0
                : c.linkedStudentCount,
            updatedAt: nowIso(),
          }
        }),
      )
    },
    [persist],
  )

  const setCenterDisabled = useCallback(
    (centerId, disabled) => {
      updateCenter(centerId, { status: disabled ? 'disabled' : 'active' })
    },
    [updateCenter],
  )

  /**
   * Hard delete only when no admins assigned and no linked students (counts).
   * @returns {{ ok: boolean, reason?: string }}
   */
  const deleteCenter = useCallback((centerId) => {
    let result = { ok: false, reason: 'Center not found' }
    persist((prev) => {
      const target = prev.find((c) => c.centerId === centerId)
      if (!target) {
        result = { ok: false, reason: 'Center not found' }
        return prev
      }
      if (target.assignedAdmins?.length > 0) {
        result = {
          ok: false,
          reason: 'Remove assigned admins before deleting this center.',
        }
        return prev
      }
      if ((target.linkedStudentCount || 0) > 0) {
        result = { ok: false, reason: 'This center still has linked students.' }
        return prev
      }
      result = { ok: true }
      return prev.filter((c) => c.centerId !== centerId)
    })
    return result
  }, [persist])

  const getCenterById = useCallback(
    (centerId) => (Array.isArray(centers) ? centers : []).find((c) => c.centerId === centerId),
    [centers],
  )

  const value = useMemo(
    () => ({
      centers,
      activeCenters,
      activeCenterNames,
      headerCenterOptions,
      createCenter,
      updateCenter,
      setCenterDisabled,
      deleteCenter,
      getCenterById,
    }),
    [
      centers,
      activeCenters,
      activeCenterNames,
      headerCenterOptions,
      createCenter,
      updateCenter,
      setCenterDisabled,
      deleteCenter,
      getCenterById,
    ],
  )

  return <CentersContext.Provider value={value}>{children}</CentersContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useCenters() {
  const ctx = useContext(CentersContext)
  if (!ctx) throw new Error('useCenters must be used within CentersProvider')
  return ctx
}
