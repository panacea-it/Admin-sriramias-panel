import {
  mapApiProgramToLocal,
  mapApiStatusToUi,
  mapUiStatusToApi,
} from './programHelpers'
import { normalizeCentersDropdown } from '../services/centerService'

export { normalizeCentersDropdown }

export function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

export function resolveCategoryRelationRef(mongoId, businessId) {
  if (isMongoObjectId(mongoId)) return String(mongoId)
  if (isMongoObjectId(businessId)) return String(businessId)
  return String(businessId || mongoId || '').trim()
}

export function mapProgramForCategorySelect(row) {
  const local = mapApiProgramToLocal(row)
  if (!local) return null

  const raw = row?.data?.program ?? row?.data ?? row?.program ?? row
  const mongoId = raw?._id ?? (isMongoObjectId(raw?.id) ? raw.id : '')
  const businessProgramId = raw?.programId || raw?.code || local.programId

  return {
    ...local,
    mongoId: String(mongoId || ''),
    businessProgramId: String(businessProgramId || ''),
    apiRef: resolveCategoryRelationRef(mongoId, businessProgramId),
  }
}

export function mapExamCategoryStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function buildExamCategoryApiPayload(form) {
  const centerId = resolveCategoryRelationRef(form.centerMongoId, form.centerId)
  const programId = resolveCategoryRelationRef(form.programMongoId, form.programId)

  return {
    centerId,
    programId,
    categoryName: String(form.name || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

function resolveRelationId(value, { preferBusinessId = false } = {}) {
  if (value == null || value === '') return ''
  if (typeof value === 'object') {
    const mongoId = value._id || (isMongoObjectId(value.id) ? value.id : '')
    const businessId = value.centerId || value.programId || value.categoryId || value.id
    if (preferBusinessId && businessId) return String(businessId)
    return String(mongoId || businessId || value.id || '')
  }
  return String(value)
}

function resolveRelationLabel(value, fallbackKeys = []) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    for (const key of fallbackKeys) {
      if (value[key]) return String(value[key])
    }
  }
  return ''
}

export function mapApiExamCategoryToLocal(data) {
  const row =
    data?.data?.category ??
    data?.data ??
    data?.category ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.categoryId
  if (!id) return null

  const centerId = resolveCategoryRelationRef(
    typeof row.center === 'object' ? row.center?._id : '',
    resolveRelationId(row.center ?? row.centerId),
  )
  const programId = resolveCategoryRelationRef(
    typeof row.program === 'object' ? row.program?._id : '',
    typeof row.program === 'object'
      ? row.program?.programId || row.program?.id
      : row.programId || row.program,
  )

  return {
    id: String(id),
    categoryId: String(row.categoryId || row.code || id),
    name: String(row.categoryName || row.name || '').trim(),
    centerId,
    centerName:
      resolveRelationLabel(row.center, ['centerName', 'name']) ||
      String(row.centerName || '').trim(),
    programId,
    program:
      resolveRelationLabel(row.program, ['programName', 'name']) ||
      String(row.programName || '').trim(),
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeExamCategoriesListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.categories ??
    payload?.items ??
    payload?.results ??
    data?.categories ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiExamCategoryToLocal(row))
    .filter(Boolean)

  const pagination = payload?.pagination || data?.pagination || payload?.meta || data?.meta || {}
  const total =
    pagination.total ??
    payload?.total ??
    data?.total ??
    payload?.totalCount ??
    data?.totalCount ??
    data?.count ??
    items.length
  const totalPages =
    pagination.totalPages ??
    payload?.totalPages ??
    data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = pagination.page ?? payload?.page ?? data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function normalizeExamCategoryDropdownResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.categories ??
    payload?.items ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => {
      const local = mapApiExamCategoryToLocal(row)
      if (!local) return null
      return {
        _id: local.id,
        categoryId: local.categoryId,
        categoryName: local.name,
      }
    })
    .filter(Boolean)
}

export function normalizeProgramsByCenterResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.programs ??
    payload?.items ??
    data?.programs ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapProgramForCategorySelect(row))
    .filter(Boolean)
}

export function formatProgramOptionLabel(program) {
  if (!program) return ''
  const code = program.programId || program.id
  const name = program.name || program.programName
  if (code && name) return `${code} - ${name}`
  return name || code || ''
}

export {
  getCentreDropdownDisplayName,
  mapCentreDropdownDisplayOption,
  mapCentreDropdownDisplayOptions,
} from './centreDropdownDisplay'
