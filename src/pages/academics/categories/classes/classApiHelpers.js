import { mapApiStatusToUi, mapUiStatusToApi } from '../../../../utils/programHelpers'

function resolveSubjectName(row) {
  const explicit = String(row?.subjectName ?? '').trim()
  if (explicit) return explicit

  if (row?.subject && typeof row.subject === 'object') {
    return String(row.subject.subjectName ?? row.subject.name ?? '').trim()
  }

  return ''
}

function resolveSubjectId(row) {
  if (row?.subjectId) return String(row.subjectId)
  if (row?.subject && typeof row.subject === 'object') {
    const id = row.subject._id ?? row.subject.id
    if (id) return String(id)
  }
  if (typeof row?.subject === 'string') return row.subject
  return ''
}

/** Map API class section → Classes table row shape. */
export function mapApiClassSectionToLocal(row) {
  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id
  if (!id) return null

  return {
    id: String(id),
    classSectionId: row.classSectionId != null ? String(row.classSectionId) : '',
    subjectId: resolveSubjectId(row),
    subject: resolveSubjectName(row) || '—',
    name: String(row.className ?? row.name ?? '').trim(),
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function mapClassSectionRowForClassesTable(row) {
  return mapApiClassSectionToLocal(row)
}

export function mapClassDetailFromQuery(data) {
  const row = data?.data ?? data
  return mapApiClassSectionToLocal(row)
}

export function normalizeClassSectionsListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = Array.isArray(data?.data) ? data.data : data?.items ?? []

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiClassSectionToLocal(row))
    .filter(Boolean)

  const total = data?.total ?? items.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    limit: data?.limit ?? limit,
    count: data?.count ?? items.length,
  }
}

export function normalizeClassSectionsDropdownResponse(data) {
  const list = Array.isArray(data) ? data : data?.data ?? []

  return (Array.isArray(list) ? list : [])
    .map((row) => {
      const value = String(row.id ?? row._id ?? '')
      const label = String(row.className ?? row.name ?? value)
      if (!value) return null
      return { value, label, className: label, classSectionId: row.classSectionId }
    })
    .filter(Boolean)
}

export function buildCreateClassPayload(form) {
  return {
    subjectId: String(form.subjectId || '').trim(),
    className: String(form.name || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

export function buildUpdateClassPayload(form) {
  return {
    subjectId: String(form.subjectId || '').trim(),
    className: String(form.name || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

export function mapClassFormStatusToApi(status) {
  return mapUiStatusToApi(status)
}

const API_FIELD_TO_FORM = {
  subjectId: 'subjectId',
  className: 'name',
}

/** Map backend validation errors[] to form field errors. */
export function mapClassSectionApiErrors(error) {
  const payload = error?.response?.data ?? error
  const list = payload?.errors
  if (!Array.isArray(list)) return {}

  return list.reduce((acc, entry) => {
    const field = API_FIELD_TO_FORM[entry?.field] || entry?.field
    if (field && entry?.message) {
      acc[field] = entry.message
    }
    return acc
  }, {})
}

export const CLASS_SORT_KEY_TO_API = {
  name: 'className',
  status: 'status',
  createdAt: 'createdAt',
}

export const CLASS_UI_SORT_FROM_API = {
  className: 'name',
  status: 'status',
  createdAt: 'createdAt',
  classSectionId: 'name',
}
