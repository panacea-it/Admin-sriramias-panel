import { resolveWhyChooseSubtitle, resolveWhyChooseTitle } from './academicCourseForm'
import { normalizeWhyChooseFeatures } from './whyChooseFeatures'

export function mapCourseStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function mapApiCourseStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'In Active'
  return 'Active'
}

export function buildKeyFeaturesPayload(slots = []) {
  const normalized = Array.isArray(slots) ? slots : []
  const blocks = []
  const imageFiles = []

  let i = 0
  while (i < normalized.length) {
    const slot = normalized[i]

    if (i === 0 || slot?.file) {
      if (i === 0) {
        if (slot?.file) {
          imageFiles.push({ index: imageFiles.length, file: slot.file })
        }
        i++
      } else if (slot?.file) {
        imageFiles.push({ index: imageFiles.length, file: slot.file })
        i++
      }

      const points = []
      while (i < normalized.length && !normalized[i]?.file) {
        const text = String(normalized[i]?.text || '').trim()
        if (text) points.push(text)
        i++
      }
      if (points.length) blocks.push({ points })
    } else {
      const points = []
      while (i < normalized.length && !normalized[i]?.file) {
        const text = String(normalized[i]?.text || '').trim()
        if (text) points.push(text)
        i++
      }
      if (points.length) blocks.push({ points })
    }
  }

  return { blocks, imageFiles }
}

export function buildFeatureCardsPayload(features = []) {
  return normalizeWhyChooseFeatures({ whyChooseFeatures: features }).map((card) => ({
    featureTitle: String(card.title || '').trim(),
    displayOrder: Number(card.order) || 1,
    featureDescription: String(card.description || '').trim(),
    highlightOnWebsite: Boolean(card.isHighlighted),
  }))
}

export function validateCreateCourseContent(form) {
  const errors = {}
  const overview = String(form.overview ?? form.courseOverview ?? '').trim()
  if (!overview) errors.overview = 'Course overview is required'

  const { blocks } = buildKeyFeaturesPayload(form.keyFeatures || [])
  if (!blocks.some((block) => block.points?.length)) {
    errors.keyFeatures = 'Add at least one key feature point'
  }

  if (!resolveWhyChooseTitle(form).trim()) {
    errors.whyChooseTitle = 'Why choose title is required'
  }
  if (!resolveWhyChooseSubtitle(form).trim()) {
    errors.whyChooseSubtitle = 'Why choose subtitle is required'
  }

  const cards = buildFeatureCardsPayload(form.whyChooseFeatures || [])
  if (!cards.some((card) => card.featureTitle)) {
    errors.featureCards = 'Add at least one feature card with a title'
  }

  return errors
}

export function buildCreateCourseFormData(form) {
  const formData = new FormData()

  formData.append('courseName', String(form.name || '').trim())
  formData.append('centerId', String(form.centerId || ''))
  formData.append('programId', String(form.programId || ''))
  formData.append('categoryId', String(form.examCategoryId || ''))
  formData.append('subCategoryId', String(form.examSubCategoryId || ''))
  formData.append(
    'courseOverview',
    String(form.overview ?? form.courseOverview ?? '').trim(),
  )
  formData.append('status', 'ACTIVE')
  formData.append('whyChooseTitle', resolveWhyChooseTitle(form))
  formData.append('whyChooseSubtitle', resolveWhyChooseSubtitle(form))

  const { blocks, imageFiles } = buildKeyFeaturesPayload(form.keyFeatures || [])
  formData.append('keyFeatures', JSON.stringify(blocks))

  imageFiles.forEach(({ index, file }) => {
    if (file) formData.append(`keyFeatureImage_${index}`, file)
  })

  const featureCards = buildFeatureCardsPayload(form.whyChooseFeatures || [])
  formData.append('featureCards', JSON.stringify(featureCards))

  normalizeWhyChooseFeatures({ whyChooseFeatures: form.whyChooseFeatures }).forEach(
    (card, index) => {
      if (card.iconFile instanceof File) {
        formData.append(`featureCardIcon_${index}`, card.iconFile)
      }
    },
  )

  const howWill = form.howWill || []
  for (let blockIndex = 0; blockIndex * 3 < howWill.length; blockIndex++) {
    const video = howWill[blockIndex * 3]
    const image1 = howWill[blockIndex * 3 + 1]
    const image2 = howWill[blockIndex * 3 + 2]
    if (video?.file) formData.append(`helpSectionVideo_${blockIndex}`, video.file)
    if (image1?.file) formData.append(`helpSectionImage1_${blockIndex}`, image1.file)
    if (image2?.file) formData.append(`helpSectionImage2_${blockIndex}`, image2.file)
  }

  return formData
}

function resolveNestedName(value) {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    return String(
      value.centerName ||
        value.programName ||
        value.categoryName ||
        value.subCategoryName ||
        value.name ||
        '',
    ).trim()
  }
  return ''
}

export function mapApiCourseToLocal(data) {
  const row =
    data?.data?.course ??
    data?.course ??
    data?.data ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.courseId
  if (!id) return null

  const center = row.center
  const program = row.program
  const category = row.academicCategory ?? row.category
  const subCategory = row.academicSubCategory ?? row.subCategory

  return {
    id: String(id),
    courseId: String(row.courseId || '').trim(),
    name: String(row.courseName || row.title || row.name || '').trim(),
    centerId: String(center?._id ?? center?.id ?? row.centerId ?? ''),
    centerName: resolveNestedName(center) || String(row.centerName || '').trim(),
    programId: String(program?._id ?? program?.id ?? row.programId ?? ''),
    program:
      resolveNestedName(program) ||
      String(row.programName || (typeof row.program === 'string' ? row.program : '') || '').trim(),
    examCategoryId: String(category?._id ?? category?.id ?? row.categoryId ?? ''),
    examCategory:
      resolveNestedName(category) ||
      String(row.examCategory || row.categoryName || '').trim(),
    examSubCategoryId: String(
      subCategory?._id ?? subCategory?.id ?? row.subCategoryId ?? '',
    ),
    examSubCategory:
      resolveNestedName(subCategory) ||
      String(row.examSubCategory || row.subCategoryName || '').trim(),
    status: mapApiCourseStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
    overview: row.courseOverview || row.overview || '',
    courseOverview: row.courseOverview || row.overview || '',
    keyFeatures: row.keyFeatures || [],
    whyChooseFeatures: row.whyChooseSection?.featureCards || row.whyChooseFeatures || [],
    whyChooseTitle: row.whyChooseSection?.title || row.whyChooseTitle || '',
    whyChooseSubtitle: row.whyChooseSection?.subtitle || row.whyChooseSubtitle || '',
    howWill: row.helpSections || row.howWill || [],
  }
}

export function normalizeCoursesListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data

  const itemsRaw =
    payload?.courses ??
    payload?.items ??
    payload?.results ??
    data?.courses ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (itemsRaw || []).map(mapApiCourseToLocal).filter(Boolean)
  const total = Number(payload?.total ?? data?.total ?? items.length) || items.length
  const totalPages = Math.max(1, Number(payload?.pages ?? data?.pages ?? Math.ceil(total / limit)))
  const safePage = Math.min(Math.max(1, page), totalPages)

  return {
    items,
    total,
    totalPages,
    page: safePage,
  }
}
