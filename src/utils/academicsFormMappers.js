import { normalizeLinkedSubjects } from './batchHelpers'
import { emptyWhyChooseFeature, normalizeWhyChooseFeatures } from './whyChooseFeatures'
import {
  FREE_RESOURCE_CATEGORY,
  normalizeFreeResourceCategory,
} from './freeResourceFormConstants'

const makeSlots = (count, factory) => Array.from({ length: count }, (_, i) => factory(i))

export function createEmptyCourseForm() {
  return {
    batchId: '',
    batchName: '',
    courseId: '',
    academicCourseId: '',
    courseName: '',
    category: '',
    subCategory: '',
    center: 'Delhi',
    status: 'Active',
    commencement: '',
    durationLabel: '',
    durationFrom: '',
    durationTo: '',
    batchStartFrom: '',
    batchEndTo: '',
    bannerFileName: '',
    bannerPreview: '',
    bannerUrl: '',
    linkedSubjects: [{ subjectId: '', subjectName: '' }],
    subjects: ['', ''],
    onlineFees: '',
    onlineDiscount: '',
    offlineFees: '',
    offlineDiscount: '',
    overview: '',
    keyFeatures: makeSlots(6, (i) => ({ id: `kf-${i}`, fileName: '', text: '' })),
    whyChoose: makeSlots(6, (i) => ({ id: `wc-${i}`, fileName: '', hasIcon: i > 0 })),
    whyChooseFeatures: [emptyWhyChooseFeature(1)],
    howWill: makeSlots(6, (i) => ({
      id: `hw-${i}`,
      kind: i === 0 || i === 3 ? 'video' : 'image',
      fileName: '',
      placeholder: i === 0 || i === 3 ? 'Video to be played for motion effect' : 'Image to be displayed',
    })),
  }
}

export function courseRowToForm(row) {
  if (row?.formData) {
    const merged = { ...createEmptyCourseForm(), ...row.formData }
    merged.linkedSubjects = normalizeLinkedSubjects(merged)
    merged.whyChooseFeatures = normalizeWhyChooseFeatures(merged)
    if (!merged.linkedSubjects.length) {
      merged.linkedSubjects = [{ subjectId: '', subjectName: '' }]
    }
    return merged
  }
  const price = String(row?.price || '')
  return {
    ...createEmptyCourseForm(),
    batchId: row?.batchId || '',
    batchName: row?.batchName || row?.name || '',
    courseId: row?.courseId || '',
    academicCourseId: row?.academicCourseId || row?.formData?.academicCourseId || '',
    courseName: row?.courseName || row?.name || '',
    category: row?.category || '',
    center: row?.center || 'Delhi',
    status: row?.status || 'Active',
    offlineFees: price.includes(' - ') ? price.split(' - ')[0]?.trim() : price,
    onlineFees: price.includes(' - ') ? price.split(' - ')[1]?.trim() : '',
  }
}

export function courseFormToRow(form, existing) {
  const price =
    form.offlineFees && form.onlineFees
      ? `${form.offlineFees} - ${form.onlineFees}`
      : form.offlineFees || form.onlineFees || existing?.price || '—'
  const displayName = form.batchName?.trim() || form.courseName?.trim() || existing?.name
  const linkedSubjects = normalizeLinkedSubjects(form)
  return {
    id: existing?.id ?? Date.now(),
    batchId: form.batchId || existing?.batchId,
    batchName: form.batchName?.trim() || displayName,
    name: displayName,
    courseId: form.courseId || existing?.courseId,
    academicCourseId: form.academicCourseId || existing?.academicCourseId,
    courseName: form.courseName || existing?.courseName,
    commencement: form.commencement || existing?.commencement,
    durationLabel: form.durationLabel || existing?.durationLabel,
    batchStartFrom: form.batchStartFrom || existing?.batchStartFrom,
    batchEndTo: form.batchEndTo || existing?.batchEndTo,
    bannerPreview: form.bannerPreview || existing?.bannerPreview,
    bannerFileName: form.bannerFileName || existing?.bannerFileName,
    linkedSubjects,
    category: form.category || existing?.category,
    center: form.center || existing?.center || 'Delhi',
    price,
    status: form.status || existing?.status || 'Active',
    formData: form,
  }
}

export function createEmptyFreeResourceForm() {
  return {
    category: '',
    status: 'Active',

    // NCERT Books
    subject: '',
    className: '',
    bookName: '',
    bookFileName: '',
    bookFile: null,

    // Previous Year Question Papers
    examCategory: '',
    paperType: '',
    year: '',
    paperName: '',
    questionPaperFileName: '',
    questionPaperFile: null,

    // Free Mock Test
    mockTestTitle: '',
    topic: '',
    duration: '',
    totalMarks: '',
    negativeMarking: '',
    instructions: '',
    numberOfQuestions: '',
    bulkFileName: '',
    bulkFile: null,
    // Study Material
    mainsCategory: '',
    studyMaterialName: '',
    studyMaterialFileName: '',
    studyMaterialFile: null,

    // Free Mock Tests — question cards
    questions: [],
  }
}

export function freeResourceRowToForm(row) {
  if (row?.formData) {
    const merged = { ...createEmptyFreeResourceForm(), ...row.formData }
    merged.category = normalizeFreeResourceCategory(merged.category || row?.category)
    return merged
  }
  const category = normalizeFreeResourceCategory(row?.category || '')
  const base = { ...createEmptyFreeResourceForm(), category, status: row?.status || 'Active' }

  switch (category) {
    case FREE_RESOURCE_CATEGORY.NCERT:
      return { ...base, bookName: String(row?.name || ''), subject: '', className: '' }
    case FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR:
      return { ...base, paperName: String(row?.name || '') }
    case FREE_RESOURCE_CATEGORY.MOCK_TEST:
      return { ...base, mockTestTitle: String(row?.name || '') }
    case FREE_RESOURCE_CATEGORY.STUDY_MATERIAL:
      return { ...base, studyMaterialName: String(row?.name || '') }
    default:
      return base
  }
}

export function freeResourceFormToRow(form, existing) {
  function displayFromCategory() {
    const category = normalizeFreeResourceCategory(form?.category)
    if (category === FREE_RESOURCE_CATEGORY.NCERT) {
      const subject = String(form.subject || '').trim()
      const className = String(form.className || '').trim()
      const bookName = String(form.bookName || '').trim()
      return [subject, className].filter(Boolean).length
        ? `${[subject, className].filter(Boolean).join(' - ')} - ${bookName || 'NCERT Book'}`.trim()
        : bookName || existing?.name
    }
    if (category === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR) {
      const examCategory = String(form.examCategory || '').trim()
      const paperType = String(form.paperType || '').trim()
      const year = String(form.year || '').trim()
      const paperName = String(form.paperName || '').trim()
      return (
        [paperType || 'Question Paper', examCategory, year ? `(${year})` : '']
          .filter(Boolean)
          .join(' - ') +
        (paperName ? ` ${paperName}` : '')
      ).trim()
    }
    if (category === FREE_RESOURCE_CATEGORY.MOCK_TEST) {
      const title = String(form.mockTestTitle || '').trim()
      const count = Number(form.numberOfQuestions || 0)
      if (title) return count > 0 ? `${title} (${count} Questions)` : title
      return `Mock Test${count > 0 ? ` (${count} Questions)` : ''}`.trim()
    }
    if (category === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL) {
      const name = String(form.studyMaterialName || '').trim()
      const mains = String(form.mainsCategory || '').trim()
      if (name && mains) return `${mains} - ${name}`
      return name || mains || existing?.name
    }
    return existing?.name || 'Untitled'
  }

  const displayName = displayFromCategory()
  const category = normalizeFreeResourceCategory(form.category || existing?.category)
  const apiResourceId = form?.apiResourceId ?? existing?.apiResourceId ?? existing?.id
  return {
    id: existing?.id ?? form?.apiResourceId ?? Date.now(),
    name: displayName,
    category,
    status: form.status || existing?.status || 'Active',
    apiResourceId: form?.apiResourceId ?? existing?.apiResourceId,
    isApiNcertBook:
      category === FREE_RESOURCE_CATEGORY.NCERT &&
      Boolean(form?.apiResourceId ?? existing?.isApiNcertBook ?? existing?.apiResourceId),
    isApiPreviousYearPaper:
      category === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR &&
      Boolean(form?.apiResourceId ?? existing?.isApiPreviousYearPaper ?? existing?.apiResourceId),
    formData: { ...form, category, apiResourceId },
  }
}

export function createEmptyCurrentAffairsForm(category = '') {
  return {
    category,
    name: '',
    year: '',
    month: '',
    date: '',
    mainsCategory: '',
    paperName: '',
    duration: '',
    totalMarks: '',
    fileName: '',
    file: null,
    existingPdfUrl: null,
    sampleFileName: '',
    sampleFile: null,
    existingSampleUrl: null,
    sectionFrom: '',
    sectionTo: '',
    questions: [],
    status: 'Active',
  }
}

export function currentAffairsRowToForm(row) {
  if (row?.formData) return { ...createEmptyCurrentAffairsForm(), ...row.formData }
  return {
    ...createEmptyCurrentAffairsForm(),
    category: row?.category || '',
    name: row?.name || '',
    status: row?.status || 'Active',
  }
}

function currentAffairsDisplayName(form, existing) {
  if (form.category === 'Daily Practice Questions') {
    return (
      form.paperName?.trim() ||
      [form.mainsCategory, form.month, form.year].filter(Boolean).join(' - ') ||
      existing?.name
    )
  }
  if (form.category === 'Monthly Magazine') {
    return (
      form.name?.trim() ||
      [form.name, form.month, form.year].filter(Boolean).join(' ') ||
      existing?.name
    )
  }
  return (
    form.name?.trim() ||
    `${form.month || ''} ${form.year || ''}`.trim() ||
    existing?.name ||
    'Untitled'
  )
}

export function currentAffairsFormToRow(form, existing) {
  return {
    id: existing?.id ?? Date.now(),
    name: currentAffairsDisplayName(form, existing),
    category: form.category || existing?.category,
    status: form.status || existing?.status || 'Active',
    formData: { ...form, file: undefined },
  }
}

export function createEmptyBookForm() {
  return {
    bookName: '',
    thumbnail: '',
    author: '',
    description: '',
    detailImages: Array.from({ length: 3 }, () => ({ fileName: '' })),
    galleryImages: Array.from({ length: 3 }, () => ({ fileName: '' })),
    keywords: Array.from({ length: 3 }, () => ({ value: '', fileName: '' })),
    samplePdf: '',
    bookPrice: '',
    discountPct: '',
    status: 'Active',
    coupons: [{ code: '', discount: '', description: '' }],
  }
}

export function bookRowToForm(row) {
  if (row?.formData) return { ...createEmptyBookForm(), ...row.formData }
  const price = String(row?.price || '').replace(/^₹/, '').trim()
  return {
    ...createEmptyBookForm(),
    bookName: row?.name || '',
    bookPrice: price,
    status: row?.status || 'Active',
  }
}

export function bookFormToRow(form, existing) {
  const price = form.bookPrice?.trim()
    ? `₹${form.bookPrice.trim()}`
    : existing?.price || '—'
  return {
    id: existing?.id ?? Date.now(),
    name: form.bookName?.trim() || existing?.name,
    price,
    status: form.status || existing?.status || 'Active',
    formData: form,
  }
}

export function createEmptyLiveClassForm() {
  return {
    title: '',
    faculty: '',
    center: 'Delhi Center',
    scheduledAt: '',
    duration: '',
    status: 'Active',
    description: '',
    meetingLink: '',
  }
}

export function liveClassRowToForm(row) {
  if (row?.formData) return { ...createEmptyLiveClassForm(), ...row.formData }
  return {
    ...createEmptyLiveClassForm(),
    title: row?.name || '',
    faculty: row?.faculty || '',
    center: row?.center || 'Delhi Center',
    scheduledAt: row?.scheduledAt || '',
    duration: row?.duration || '',
    status: row?.status || 'Active',
    description: row?.description || '',
  }
}

export function liveClassFormToRow(form, existing) {
  return {
    id: existing?.id ?? Date.now(),
    name: form.title?.trim() || existing?.name,
    faculty: form.faculty || existing?.faculty,
    center: form.center || existing?.center,
    scheduledAt: form.scheduledAt || existing?.scheduledAt,
    duration: form.duration || existing?.duration,
    status: form.status || existing?.status || 'Active',
    description: form.description,
    formData: form,
  }
}

export {
  createEmptyTestForm,
  testFormToRow,
  testRowToForm,
  validateTestForm,
} from './testFormUtils'
