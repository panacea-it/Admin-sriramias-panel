const UI_ACTIVE = 'Active'
const UI_INACTIVE = 'In Active'

export function mapUiStatusToApi(status) {
  const raw = String(status || UI_ACTIVE).toUpperCase().replace(/\s+/g, '_')
  if (raw === 'IN_ACTIVE' || raw === 'INACTIVE' || raw === 'DISABLED') return 'INACTIVE'
  return 'ACTIVE'
}

export function mapApiStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'IN_ACTIVE' || raw === 'INACTIVE' || raw === 'DISABLED') return UI_INACTIVE
  return UI_ACTIVE
}

export function mapProgramStatusFilterToApi(statusFilter) {
  if (statusFilter === UI_ACTIVE) return 'ACTIVE'
  if (statusFilter === UI_INACTIVE) return 'INACTIVE'
  return undefined
}

/** Client-side search by program ID or name (case-insensitive, partial match). */
export function matchesProgramSearch(row, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true

  const programId = String(row.programId || '').toLowerCase()
  const name = String(row.name || '').toLowerCase()

  return programId.includes(q) || name.includes(q)
}

export function buildProgramApiPayload(form) {
  return {
    programName: String(form.name || '').trim(),
    centers: (form.centerIds || []).map(String).filter(Boolean),
    status: mapUiStatusToApi(form.status),
  }
}

function extractCenterIds(row) {
  const raw = row?.centers ?? row?.centerIds ?? row?.center ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (item == null) return ''
      if (typeof item === 'object') {
        return String(item._id || item.id || item.centerId || item.value || '')
      }
      return String(item)
    })
    .filter(Boolean)
}

function extractCentreLabels(row) {
  const raw = row?.centers ?? row?.centerDetails ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        return item.centerName || item.name || item.label || ''
      }
      return ''
    })
    .filter(Boolean)
}

export function mapApiProgramToLocal(data) {
  const row = data?.data?.program ?? data?.data ?? data?.program ?? data
  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.programId
  if (!id && !row.programId) return null

  const centerIds = extractCenterIds(row)
  const centreNames = extractCentreLabels(row)
  const linkedRaw =
    row.linkedCoursesCount ??
    row.coursesCount ??
    row.linkedCourses ??
    row.courseIds ??
    0
  const linkedCount = Array.isArray(linkedRaw)
    ? linkedRaw.length
    : Number(linkedRaw) || 0

  return {
    id: String(id),
    programId: String(row.programId || row.code || id),
    name: String(row.programName || row.name || '').trim(),
    description: row.description || '',
    status: mapApiStatusToUi(row.status),
    centerIds,
    centreNames,
    courseIds: Array.isArray(row.courseIds) ? row.courseIds : [],
    linkedCount,
    createdAt: row.createdAt || row.createdOn || null,
    updatedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeProgramsListResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.programs ??
    payload?.items ??
    payload?.results ??
    data?.programs ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiProgramToLocal(row))
    .filter(Boolean)
}

/** Resolve centre display names from IDs */
export function getCentreNames(centresCatalog, centerIds = []) {
  if (!centerIds?.length) return []
  const map = new Map(centresCatalog.map((c) => [String(c.centerId), c.centerName]))
  return centerIds.map((id) => map.get(String(id)) || 'Unknown').filter(Boolean)
}

export function formatCentreNamesLabel(centresCatalog, centerIds = [], presetNames = []) {
  const names =
    presetNames?.length > 0
      ? presetNames
      : getCentreNames(centresCatalog, centerIds)
  if (!names.length) return '—'
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

/** Rough stats for program view */
export function getProgramStats(linkedCourses = []) {
  const subjects = new Set()
  linkedCourses.forEach((c) => {
    if (c.examCategory) subjects.add(c.examCategory)
    if (c.examSubcategory) subjects.add(`${c.examCategory}-${c.examSubcategory}`)
  })
  return {
    totalCourses: linkedCourses.length,
    totalSubjects: Math.max(subjects.size, linkedCourses.length > 0 ? 3 : 0),
    totalTopics: linkedCourses.length > 0 ? linkedCourses.length * 4 : 0,
  }
}
