import { buildTestimonialTitle } from '../constants/testimonialsConstants'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function buildTestimonialExcerpt({ studentName, rank, examName, year }) {
  const name = String(studentName || '').trim()
  const exam = String(examName || 'UPSC CSE').trim()
  const rankValue = String(rank || '').trim()
  if (!name || !rankValue || !year) return ''
  return `Read how ${name} prepared for ${exam} ${year} and secured AIR ${rankValue} with SRIRAM'S IAS.`
}

export function mapApiTestimonialToRow(item) {
  if (!item) return null

  return {
    id: item._id,
    testimonialId: item.testimonialId,
    studentName: item.studentName,
    rank: item.rank,
    examName: item.examName,
    year: item.year,
    title: item.title || buildTestimonialTitle(item),
    excerpt: buildTestimonialExcerpt(item),
    testimonialImage: item.testimonialImage || { url: '' },
    displayOrder: item.displayOrder,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function mapApiTestimonialsToRows(items = []) {
  return items.map(mapApiTestimonialToRow).filter(Boolean)
}

export function buildYearFilterOptions(rows = []) {
  const years = [...new Set(rows.map((row) => row.year).filter(Boolean))].sort(
    (a, b) => b - a,
  )

  return [
    { value: 'all', label: 'All years' },
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ]
}

export function suggestNextDisplayOrder(rows = []) {
  if (!rows.length) return '1'
  const maxOrder = Math.max(...rows.map((row) => Number(row.displayOrder) || 0))
  return String(maxOrder + 1)
}

export function validateTestimonialImageFile(file) {
  if (!(file instanceof File)) {
    return 'Testimonial image is required'
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Image must be JPG, PNG, or WEBP'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must not exceed 5 MB'
  }

  return ''
}

export function mapApiErrorsToForm(error) {
  const formErrors = {}
  const body = error?.cause?.response?.data ?? error?.response?.data ?? error

  const list = body?.errors
  if (!Array.isArray(list)) return formErrors

  for (const item of list) {
    if (!item?.field || !item?.message) continue
    formErrors[item.field] = item.message
  }

  return formErrors
}

export function buildTestimonialFormData(form, { includeImage = false } = {}) {
  const formData = new FormData()

  formData.append('studentName', String(form.studentName || '').trim())
  formData.append('rank', String(form.rank || '').trim())
  formData.append('examName', String(form.examName || 'UPSC CSE').trim())
  formData.append('year', String(form.year))
  formData.append('displayOrder', String(form.displayOrder))
  formData.append('status', form.status || 'ACTIVE')

  if (includeImage && form.imageFile instanceof File) {
    formData.append('testimonialImage', form.imageFile)
  }

  return formData
}

export function formFromApiTestimonial(row) {
  return {
    studentName: row.studentName || '',
    rank: row.rank || '',
    examName: row.examName || 'UPSC CSE',
    year: String(row.year || ''),
    displayOrder: String(row.displayOrder || ''),
    status: row.status || 'ACTIVE',
    excerpt: row.excerpt || buildTestimonialExcerpt(row),
    imagePreview: row.testimonialImage?.url || '',
    imageFileName: row.testimonialImage?.url ? 'Existing image' : '',
    imageFile: null,
  }
}

export function hasTestimonialFormChanges(form, editTarget) {
  if (!editTarget) return true

  return (
    String(form.studentName || '').trim() !== String(editTarget.studentName || '').trim() ||
    String(form.rank || '').trim() !== String(editTarget.rank || '').trim() ||
    String(form.examName || 'UPSC CSE').trim() !== String(editTarget.examName || 'UPSC CSE').trim() ||
    String(form.year) !== String(editTarget.year) ||
    String(form.displayOrder) !== String(editTarget.displayOrder) ||
    form.status !== editTarget.status ||
    form.imageFile instanceof File
  )
}
