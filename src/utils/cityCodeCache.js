const STORAGE_KEY = 'sriram_city_codes_v1'

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota errors */
  }
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
}

function compositeKey(centerId, placeName) {
  const center = String(centerId || '').trim()
  const place = String(placeName || '').trim().toLowerCase()
  if (!center || !place) return ''
  return `place:${center}:${place}`
}

export function getCachedCityCode(cityOrId) {
  const map = readMap()
  if (cityOrId && typeof cityOrId === 'object') {
    const idKey = cityOrId.id != null ? String(cityOrId.id) : ''
    if (idKey && map[idKey]) return normalizeCode(map[idKey])

    const composite = compositeKey(cityOrId.centerId, cityOrId.placeName)
    if (composite && map[composite]) return normalizeCode(map[composite])
    return ''
  }

  const key = String(cityOrId ?? '').trim()
  return key && map[key] ? normalizeCode(map[key]) : ''
}

export function setCachedCityCode(cityOrId, code, { centerId, placeName } = {}) {
  const normalized = normalizeCode(code)
  if (!normalized) return

  const map = readMap()
  if (cityOrId && typeof cityOrId === 'object') {
    if (cityOrId.id != null) map[String(cityOrId.id)] = normalized
    const composite = compositeKey(cityOrId.centerId ?? centerId, cityOrId.placeName ?? placeName)
    if (composite) map[composite] = normalized
  } else {
    const key = String(cityOrId ?? '').trim()
    if (key) map[key] = normalized
  }

  const composite = compositeKey(centerId, placeName)
  if (composite) map[composite] = normalized

  writeMap(map)
}

export function buildPlaceholderCityCode(index) {
  const n = Number(index)
  if (!Number.isFinite(n) || n < 1) return 'CT001'
  return `CT${String(n).padStart(3, '0')}`
}
