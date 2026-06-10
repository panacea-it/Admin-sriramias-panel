import { resolveCategoryRelationRef } from './examCategoryApiHelpers'
import { mapApiStatusToUi, mapUiStatusToApi } from './programHelpers'

export function mapExamSubCategoryStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function buildExamSubCategoryApiPayload(form) {
  return {
    centerId: String(form.centerId || ''),
    programId: String(form.programId || ''),
    categoryId: String(form.examCategoryId || form.categoryId || ''),
    subCategoryName: String(form.name || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

function resolveRelationId(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'object') {
    return String(
      value._id || value.id || value.centerId || value.programId || value.categoryId || '',
    )
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

export function mapApiExamSubCategoryToLocal(data) {
  const row =
    data?.data?.subCategory ??
    data?.data?.subcategory ??
    data?.data ??
    data?.subCategory ??
    data?.subcategory ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.subCategoryId ?? row.subcategoryId
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
  const categoryId = resolveCategoryRelationRef(
    typeof row.category === 'object'
      ? row.category?._id
      : typeof row.examCategory === 'object'
        ? row.examCategory?._id
        : '',
    resolveRelationId(
      row.category ?? row.examCategory ?? row.categoryId ?? row.examCategoryId,
    ),
  )

  return {
    id: String(id),
    subcategoryId: String(row.subCategoryId || row.subcategoryId || row.code || id),
    name: String(row.subCategoryName || row.subcategoryName || row.name || '').trim(),
    centerId,
    centerName:
      resolveRelationLabel(row.center, ['centerName', 'name']) ||
      String(row.centerName || '').trim(),
    programId,
    program:
      resolveRelationLabel(row.program, ['programName', 'name']) ||
      String(row.programName || '').trim(),
    examCategoryId: categoryId,
    examCategory:
      resolveRelationLabel(row.category ?? row.examCategory, ['categoryName', 'name']) ||
      String(row.categoryName || row.examCategoryName || '').trim(),
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeExamSubCategoriesListResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.subCategories ??
    payload?.subcategories ??
    payload?.items ??
    payload?.results ??
    data?.subCategories ??
    data?.subcategories ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiExamSubCategoryToLocal(row))
    .filter(Boolean)
}

export function normalizeCategoriesFilterResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.categories ??
    payload?.items ??
    data?.categories ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => {
      const id = row?._id ?? row?.id ?? row?.categoryId
      if (!id) return null
      const name = String(row.categoryName || row.name || '').trim()
      return {
        id: String(id),
        categoryId: String(row.categoryId || row.code || id),
        name,
        label: name || String(row.categoryId || id),
      }
    })
    .filter(Boolean)
}

export function formatExamCategoryOptionLabel(category) {
  if (!category) return ''
  const code = category.categoryId || category.id
  const name = category.name || category.label
  if (code && name && code !== name) return `${code} - ${name}`
  return name || code || ''
}
