import { seedCitiesFromCenters } from '../data/citiesSeed'

const STORAGE_KEY = 'sriram_academics_cities_v1'
const CENTERS_KEY = 'sriram_centers_v1'

function nowIso() {
  return new Date().toISOString()
}

export function readCentersArray() {
  try {
    const raw = localStorage.getItem(CENTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.centers)) return parsed.centers
    return []
  } catch {
    return []
  }
}

function readCenters() {
  return readCentersArray()
}

function resolveCentersList(centersArg) {
  if (Array.isArray(centersArg)) return centersArg
  return readCenters()
}

export function normalizeCity(row, centersArg) {
  const centers = resolveCentersList(centersArg)
  const center = centers.find((c) => String(c.centerId) === String(row.centerId))
  return {
    id: row.id,
    centerId: String(row.centerId || ''),
    centerName: String(row.centerName || center?.centerName || '').trim(),
    placeName: String(row.placeName || '').trim(),
    code: String(row.code || '').trim().toUpperCase(),
    status: row.status === 'Inactive' ? 'Inactive' : 'Active',
    createdAt: row.createdAt || nowIso(),
    modifiedAt: row.modifiedAt || row.createdAt || nowIso(),
  }
}

export function loadCities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw != null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((row) => normalizeCity(row))
    }
  } catch {
    /* ignore */
  }
  const centers = readCenters().filter((c) => c.status !== 'disabled')
  const seeded = seedCitiesFromCenters(centers)
  saveCities(seeded)
  return seeded
}

export function saveCities(list) {
  const centers = readCenters()
  const normalized = list.map((row) => normalizeCity(row, centers))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('cities-updated', { detail: normalized }))
  return normalized
}

export function nextCityId(list) {
  const max = list.reduce((m, row) => {
    const num = parseInt(String(row.id || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `city-${String(max + 1).padStart(3, '0')}`
}

export function findCityById(id) {
  return loadCities().find((c) => c.id === id) || null
}

export function getCitiesForCenter(centerId, { activeOnly = false } = {}) {
  if (!centerId) return []
  let list = loadCities().filter((c) => String(c.centerId) === String(centerId))
  if (activeOnly) list = list.filter((c) => c.status === 'Active')
  return list.sort((a, b) => a.placeName.localeCompare(b.placeName))
}

export function validateCityRecord(list, payload, { excludeId } = {}) {
  const errors = {}
  if (!payload.centerId) errors.centerId = 'Centre is required'
  if (!payload.placeName?.trim()) errors.placeName = 'Place name is required'
  if (!payload.code?.trim()) errors.code = 'City / branch code is required'

  const centerId = String(payload.centerId || '')
  const placeKey = payload.placeName?.trim().toLowerCase()
  const codeKey = payload.code?.trim().toLowerCase()

  list.forEach((row) => {
    if (excludeId && row.id === excludeId) return
    if (
      centerId &&
      String(row.centerId) === centerId &&
      row.placeName.toLowerCase() === placeKey
    ) {
      errors.placeName = 'This place already exists for the selected centre'
    }
    if (codeKey && row.code.toLowerCase() === codeKey) {
      errors.code = 'Branch code already exists'
    }
  })

  return errors
}

export function suggestCityCode({ centerCode, placeName, existingCodes = [] }) {
  const cc = String(centerCode || 'CTR')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()
  const place = String(placeName || 'PL')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()
  let n = 1
  let candidate = `${cc}-${place}-${String(n).padStart(2, '0')}`
  const taken = new Set(existingCodes.map((c) => c.toLowerCase()))
  while (taken.has(candidate.toLowerCase())) {
    n += 1
    candidate = `${cc}-${place}-${String(n).padStart(2, '0')}`
  }
  return candidate
}
