import { buildTestimonialTitle } from '../constants/testimonialsConstants'

export function buildTestimonialExcerpt({ studentName, rank, examName, year }) {
  const name = String(studentName || '').trim()
  const exam = String(examName || 'UPSC CSE').trim()
  const rankValue = String(rank || '').trim()
  if (!name || !rankValue || !year) return ''
  return `Read how ${name} prepared for ${exam} ${year} and secured AIR ${rankValue} with SRIRAM'S IAS.`
}

export function mapApiTestimonialToRow(item) {
  if (!item) return null

  const row = {
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

  return row
}

export function mapApiTestimonialsToRows(items = []) {
  return items.map(mapApiTestimonialToRow).filter(Boolean)
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
