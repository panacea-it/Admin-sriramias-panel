/** Testimonials CMS constants. */

export const TESTIMONIALS_BASE = '/marketing/testimonials'

export const TESTIMONIAL_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

export const TESTIMONIAL_STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: TESTIMONIAL_STATUS.ACTIVE, label: 'Active' },
  { value: TESTIMONIAL_STATUS.INACTIVE, label: 'Inactive' },
]

export const TESTIMONIAL_YEAR_OPTIONS = [
  { value: 'all', label: 'All years' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
  { value: '2015', label: '2015' },
]

export const DEFAULT_EXAM_NAME = 'UPSC CSE'

export function buildTestimonialTitle({ studentName, rank, examName, year }) {
  return `${String(studentName || '').trim()} IAS — RANK ${String(rank || '').trim()}, ${String(examName || DEFAULT_EXAM_NAME).trim()} ${year}`
}

export function emptyTestimonialForm() {
  return {
    studentName: '',
    rank: '',
    examName: DEFAULT_EXAM_NAME,
    year: '',
    displayOrder: '',
    status: TESTIMONIAL_STATUS.ACTIVE,
    excerpt: '',
    imagePreview: '',
    imageFileName: '',
    imageFile: null,
  }
}
