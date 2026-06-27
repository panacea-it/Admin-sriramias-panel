import { getCentreDropdownDisplayName } from './centreDropdownDisplay'

function unwrapList(data, keys) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data?.[key])) return data.data[key]
  }
  return []
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

/** Filter APIs expect Mongo _id when available; fall back to business code. */
function resolveApiRef(mongoId, businessId) {
  if (isMongoObjectId(mongoId)) return String(mongoId)
  if (isMongoObjectId(businessId)) return String(businessId)
  return String(businessId || mongoId || '').trim()
}

export function normalizeCenterDropdownOptions(data) {
  return unwrapList(data, ['centers', 'items', 'results'])
    .map((row) => {
      const mongoId = row._id ?? (isMongoObjectId(row.id) ? row.id : '')
      const businessCenterId = row.centerId || row.value || ''
      const label = getCentreDropdownDisplayName({
        centerName: row.centerName ?? row.name ?? row.label,
        label: row.label,
      })
      return {
        value: resolveApiRef(mongoId, businessCenterId),
        label,
      }
    })
    .filter((opt) => opt.value && opt.label)
}

export function normalizeProgramDropdownOptions(data) {
  return unwrapList(data, ['programs', 'items', 'results'])
    .map((row) => {
      const mongoId = row._id ?? (isMongoObjectId(row.id) ? row.id : '')
      const businessProgramId = row.programId || row.code || ''
      return {
        value: resolveApiRef(mongoId, businessProgramId),
        label: String(row.programName ?? row.name ?? '').trim(),
        businessProgramId: String(businessProgramId || ''),
        mongoId: String(mongoId || ''),
      }
    })
    .filter((opt) => opt.value && opt.label)
}

export function normalizeCategoryDropdownOptions(data) {
  return unwrapList(data, ['categories', 'items', 'results'])
    .map((row) => {
      const mongoId = row._id ?? (isMongoObjectId(row.id) ? row.id : '')
      const businessCategoryId = row.categoryId || row.code || ''
      return {
        value: resolveApiRef(mongoId, businessCategoryId),
        label: String(row.categoryName ?? row.name ?? '').trim(),
        businessCategoryId: String(businessCategoryId || ''),
        mongoId: String(mongoId || ''),
      }
    })
    .filter((opt) => opt.value && opt.label)
}

export function normalizeSubCategoryDropdownOptions(data) {
  return unwrapList(data, ['subCategories', 'subcategories', 'items', 'results'])
    .map((row) => {
      const mongoId = row._id ?? (isMongoObjectId(row.id) ? row.id : '')
      const businessSubCategoryId = row.subCategoryId ?? row.subcategoryId ?? row.code ?? ''
      return {
        value: resolveApiRef(mongoId, businessSubCategoryId),
        label: String(row.subCategoryName ?? row.subcategoryName ?? row.name ?? '').trim(),
        businessSubCategoryId: String(businessSubCategoryId || ''),
        mongoId: String(mongoId || ''),
      }
    })
    .filter((opt) => opt.value && opt.label)
}

function formatCourseCatalogLabel(courseName, courseId) {
  const name = String(courseName || '').trim()
  const code = String(courseId || '').trim()
  return code ? `${name} - ${code}` : name
}

/** Batch form course picker — requires Mongo _id for POST /api/batches `courseId`. */
export function normalizeCourseCatalogDropdownOptions(data) {
  return unwrapList(data, ['courses', 'items', 'results'])
    .map((row) => {
      const mongoId =
        row._id ??
        row.academicCourseId ??
        (isMongoObjectId(row.id) ? row.id : '')
      const courseId = String(row.courseId || '').trim()
      const courseName = String(row.courseName ?? row.title ?? row.name ?? '').trim()
      if (!isMongoObjectId(mongoId) || !courseName) return null
      return {
        _id: String(mongoId),
        courseId,
        courseName,
        label: formatCourseCatalogLabel(courseName, courseId),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.courseName.localeCompare(b.courseName))
}

export function withCurrentSelectOption(options, value, label) {
  if (!value) return options
  const normalizedValue = String(value)
  if (options.some((option) => String(option.value) === normalizedValue)) {
    return options
  }
  if (!label) return options
  return [
    ...options,
    {
      value: normalizedValue,
      label: getCentreDropdownDisplayName({ centerName: label, label }),
    },
  ]
}
