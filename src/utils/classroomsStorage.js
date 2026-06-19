import { CLASSROOMS_SEED } from '../data/classroomsSeed'
import { findCityById, loadCities, readCentersArray } from './citiesStorage'

const STORAGE_KEY = 'sriram_classrooms_v1'

function nowIso() {
  return new Date().toISOString()
}

export function normalizeClassroomStatus(status) {
  if (status === 'Deactivated' || status === 'In Active') return 'Deactivated'
  return 'Active'
}

function resolveCenterMeta(centerId, centers) {
  if (!centerId) return null
  const list = Array.isArray(centers) ? centers : readCentersArray()
  return list.find((c) => String(c.centerId) === String(centerId)) || null
}

function assignDefaultLocation(row, cities) {
  if (row.centerId && row.cityPlaceId) return row
  if (!cities?.length) return row
  const idx = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
  const city = cities[idx % cities.length]
  if (!city) return row
  return {
    ...row,
    centerId: row.centerId || city.centerId,
    centerName: row.centerName || city.centerName,
    cityPlaceId: row.cityPlaceId || city.id,
    placeName: row.placeName || city.placeName,
  }
}

function normalize(row, cities = loadCities()) {
  const withLocation = assignDefaultLocation(row, cities)
  const city = withLocation.cityPlaceId ? findCityById(withLocation.cityPlaceId) : null
  const centers = readCentersArray()
  const centerId = String(withLocation.centerId || city?.centerId || '')
  const center = resolveCenterMeta(centerId, centers)

  return {
    id: withLocation.id,
    centerId,
    centerName: String(withLocation.centerName || city?.centerName || center?.centerName || '').trim(),
    cityPlaceId: String(withLocation.cityPlaceId || city?.id || ''),
    placeName: String(withLocation.placeName || city?.placeName || '').trim(),
    name: String(withLocation.name || '').trim(),
    code: String(withLocation.code || '').trim().toUpperCase(),
    capacity:
      withLocation.capacity != null && withLocation.capacity !== ''
        ? Number(withLocation.capacity)
        : null,
    description: String(withLocation.description || '').trim(),
    status: normalizeClassroomStatus(withLocation.status),
    color: withLocation.color || '#246392',
    createdAt: withLocation.createdAt || nowIso(),
    modifiedAt: withLocation.modifiedAt || withLocation.createdAt || nowIso(),
  }
}

export function loadClassrooms() {
  let rawList = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) rawList = parsed
    }
  } catch {
    /* ignore */
  }

  const source = rawList ?? CLASSROOMS_SEED
  const cities = loadCities()
  const normalized = source.map((row) => normalize(row, cities))
  const needsPersist =
    !rawList ||
    normalized.some(
      (row, i) =>
        row.centerId !== source[i]?.centerId ||
        row.cityPlaceId !== source[i]?.cityPlaceId ||
        row.status !== source[i]?.status,
    )

  if (needsPersist) saveClassrooms(normalized)
  return normalized
}

export function saveClassrooms(list) {
  const normalized = list.map(normalize)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('classrooms-updated', { detail: normalized }))
  return normalized
}

export function nextClassroomId(list) {
  const max = list.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `cr-${String(max + 1).padStart(3, '0')}`
}

export function findClassroomById(id) {
  return loadClassrooms().find((c) => c.id === id) || null
}

export function validateClassroomUnique(list, payload, { excludeId } = {}) {
  const errors = {}
  if (!payload.centerId) errors.centerId = 'Centre is required'
  if (!payload.cityPlaceId) errors.cityPlaceId = 'City / place is required'
  if (!payload.name?.trim()) errors.name = 'Classroom name is required'
  if (!payload.code?.trim()) errors.code = 'Classroom code is required'

  if (
    payload.capacity !== '' &&
    payload.capacity != null &&
    (Number.isNaN(Number(payload.capacity)) || Number(payload.capacity) < 1)
  ) {
    errors.capacity = 'Capacity must be a positive number'
  }

  const n = payload.name?.trim().toLowerCase()
  const c = payload.code?.trim().toLowerCase()
  list.forEach((row) => {
    if (excludeId && row.id === excludeId) return
    if (n && row.name.toLowerCase() === n) errors.name = 'Classroom name already exists'
    if (c && row.code.toLowerCase() === c) errors.code = 'Classroom code already exists'
  })
  return errors
}
