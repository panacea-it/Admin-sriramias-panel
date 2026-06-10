import { getApiErrorMessage } from './apiError'
import {
  EXAM_CATEGORY_OPTIONS,
  FREE_RESOURCE_CATEGORY,
  FREE_RESOURCE_CATEGORY_LIST,
  MAX_OPTIONS,
  MIN_OPTIONS,
  PAPER_TYPE_OPTIONS,
  YEAR_OPTIONS,
  normalizeFreeResourceCategory,
} from './freeResourceFormConstants'
import {
  createEmptyFreeResourceQuestion,
  createEmptyOption,
  parseQuestionCount,
} from './freeResourceFormUtils'
import { UPLOAD_PROFILES } from '../constants/uploadConstraints'
import { getFileExtension } from './uploadValidation'

/** Matches UploadField PDF_STANDARD hint (10 MB) shown on NCERT / Previous Year forms */
export const NCERT_BOOKS_MAX_PDF_BYTES = UPLOAD_PROFILES.PDF_STANDARD.maxBytes

function ncertPdfMaxSizeMessage() {
  const mb = Math.round(NCERT_BOOKS_MAX_PDF_BYTES / (1024 * 1024))
  return `Maximum file size is ${mb} MB.`
}

export const DEFAULT_STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const FREE_RESOURCE_LIST_MAX_LIMIT = 50

/** GET list query params — page/limit/search as strings. */
export function buildFreeResourceListParams({ page = 1, limit = 10, search } = {}) {
  return {
    page: String(Math.max(1, Number(page) || 1)),
    limit: String(
      Math.min(FREE_RESOURCE_LIST_MAX_LIMIT, Math.max(1, Number(limit) || 10)),
    ),
    search: String(search ?? '').trim(),
  }
}

/** POST /free-resources/list JSON body. */
export function buildFreeResourceListBody({ page = 1, limit = 10, search } = {}) {
  return {
    page: Math.max(1, Number(page) || 1),
    limit: Math.min(FREE_RESOURCE_LIST_MAX_LIMIT, Math.max(1, Number(limit) || 10)),
    search: String(search ?? '').trim(),
  }
}

export function mapResourceCategoryEnumToFormCategory(
  resourceCategory,
  resourceCategoryLabel = '',
) {
  const normalized = String(resourceCategory || '').toUpperCase().replace(/[\s-]+/g, '_')
  if (normalized === 'NCERT_BOOKS') return FREE_RESOURCE_CATEGORY.NCERT
  if (normalized === 'PREVIOUS_YEAR_QUESTIONS' || normalized === 'PREVIOUS_YEAR_QUESTION_PAPERS') {
    return FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR
  }
  if (normalized === 'STUDY_MATERIAL') return FREE_RESOURCE_CATEGORY.STUDY_MATERIAL
  if (normalized === 'FREE_MOCK_TEST' || normalized === 'FREE_MOCK_TESTS') {
    return FREE_RESOURCE_CATEGORY.MOCK_TEST
  }
  return resolveResourceCategoryFormValue(
    { resourceCategory, resourceCategoryLabel },
    [],
    normalizeFreeResourceCategory(resourceCategoryLabel || resourceCategory),
  )
}

function resolveUnifiedResourceDisplayName(item, resourceCategory) {
  const resourceName = String(item?.resourceName || '').trim()
  if (resourceName) return resourceName

  if (resourceCategory === 'NCERT_BOOKS') {
    return String(item?.bookName || 'NCERT Book').trim()
  }
  if (resourceCategory === 'PREVIOUS_YEAR_QUESTIONS') {
    return String(item?.paperName || 'Question Paper').trim()
  }
  if (resourceCategory === 'STUDY_MATERIAL') {
    return String(item?.studyMaterialName || 'Study Material').trim()
  }
  return 'Resource'
}

function unwrapUnifiedFreeResourceList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  const nested = data?.data
  if (nested && typeof nested === 'object') {
    for (const key of ['resources', 'items', 'results', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }
  for (const key of ['resources', 'items', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

export function mapUnifiedFreeResourceApiToRow(raw) {
  const item = raw || {}
  const id = item._id || item.id
  if (!id) return null

  const resourceCategory = String(item.resourceCategory || '').toUpperCase()
  if (resourceCategory === 'FREE_MOCK_TEST') return null

  const category = mapResourceCategoryEnumToFormCategory(
    resourceCategory,
    item.resourceCategoryLabel,
  )
  const name = resolveUnifiedResourceDisplayName(item, resourceCategory)
  const status = mapFreeResourceStatusForList(item.status)
  const base = {
    id,
    apiResourceId: id,
    name,
    category,
    status,
    resourceCategory,
    resourceCategoryLabel: item.resourceCategoryLabel || category,
  }

  if (resourceCategory === 'NCERT_BOOKS') {
    return {
      ...base,
      isApiNcertBook: true,
      formData: mapNcertBookApiToForm(item),
    }
  }
  if (resourceCategory === 'PREVIOUS_YEAR_QUESTIONS') {
    return {
      ...base,
      isApiPreviousYearPaper: true,
      formData: mapPreviousYearPaperApiToForm(item),
    }
  }
  if (resourceCategory === 'STUDY_MATERIAL') {
    return {
      ...base,
      isApiStudyMaterial: true,
      formData: mapStudyMaterialApiToForm(item),
    }
  }

  return null
}

export function normalizeFreeResourcesListResponse(
  data,
  { page = 1, limit = 10, includeMockTests = false } = {},
) {
  const itemsRaw = unwrapUnifiedFreeResourceList(data)
  const items = itemsRaw
    .map((row) => mapUnifiedFreeResourceApiToRow(row))
    .filter(Boolean)
    .filter((row) => includeMockTests || row.resourceCategory !== 'FREE_MOCK_TEST')

  const total = data?.total ?? data?.count ?? items.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

function unwrapList(data, keys) {
  if (Array.isArray(data)) return data

  const nested = data?.data
  if (Array.isArray(nested)) return nested

  if (nested && typeof nested === 'object') {
    for (const key of keys) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (nested && typeof nested === 'object' && Array.isArray(nested.options)) {
    return nested.options
  }

  if (Array.isArray(data?.options)) return data.options

  return []
}

function mapDropdownRow(row) {
  if (typeof row === 'string' || typeof row === 'number') {
    const text = String(row).trim()
    return text ? { value: text, label: text } : null
  }

  if (!row || typeof row !== 'object') return null

  const value = String(
    row.value ??
      row.code ??
      row.enum ??
      row.id ??
      row.year ??
      row.examCategory ??
      row.paperType ??
      row.name ??
      '',
  ).trim()

  const label = String(
    row.label ??
      row.name ??
      row.displayName ??
      row.examCategoryName ??
      row.paperTypeName ??
      row.categoryName ??
      row.year ??
      value,
  ).trim()

  if (!value && !label) return null

  return { value: value || label, label: label || value }
}

export const DEFAULT_RESOURCE_CATEGORY_OPTIONS = FREE_RESOURCE_CATEGORY_LIST.map((label) => ({
  value: label,
  label,
}))

export function normalizeResourceCategoryOptions(data) {
  const fromApi = unwrapList(data, ['resourceCategories', 'categories', 'items', 'results'])
    .map(mapDropdownRow)
    .filter(Boolean)
  return fromApi.length ? fromApi : DEFAULT_RESOURCE_CATEGORY_OPTIONS
}

export function normalizeStatusOptions(data) {
  const fromApi = unwrapList(data, ['status', 'statuses', 'items', 'results', 'options'])
    .map(mapDropdownRow)
    .filter(Boolean)
    .map((opt) => {
      const value = String(opt.value || '').toUpperCase()
      const label =
        value === 'INACTIVE'
          ? 'Inactive'
          : value === 'ACTIVE'
            ? 'Active'
            : opt.label
      return { value, label }
    })
    .filter((opt) => opt.value === 'ACTIVE' || opt.value === 'INACTIVE')

  return fromApi.length ? fromApi : DEFAULT_STATUS_OPTIONS
}

export function resolveResourceCategoryFormValue(
  { resourceCategory, resourceCategoryLabel } = {},
  categoryOptions = [],
  fallback = '',
) {
  const apiValue = String(resourceCategory || '').trim()
  const apiLabel = String(resourceCategoryLabel || '').trim()

  if (categoryOptions.length) {
    if (apiValue) {
      const byValue = categoryOptions.find(
        (opt) => String(opt.value).toUpperCase() === apiValue.toUpperCase(),
      )
      if (byValue) return byValue.value
    }

    if (apiLabel) {
      const byLabel = categoryOptions.find(
        (opt) => String(opt.label).trim().toLowerCase() === apiLabel.toLowerCase(),
      )
      if (byLabel) return byLabel.value
    }
  }

  const normalized = apiValue.toUpperCase().replace(/[\s-]+/g, '_')
  if (normalized === 'NCERT_BOOKS' || /ncert/i.test(apiLabel)) {
    return FREE_RESOURCE_CATEGORY.NCERT
  }
  if (
    normalized === 'PREVIOUS_YEAR_QUESTIONS' ||
    normalized.includes('PREVIOUS_YEAR') ||
    /previous.?year/i.test(apiLabel)
  ) {
    return FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR
  }
  if (normalized.includes('MOCK_TEST') || /mock test/i.test(apiLabel)) {
    return FREE_RESOURCE_CATEGORY.MOCK_TEST
  }
  if (normalized.includes('STUDY_MATERIAL') || /study material/i.test(apiLabel)) {
    return FREE_RESOURCE_CATEGORY.STUDY_MATERIAL
  }

  return fallback || normalizeFreeResourceCategory(apiLabel || apiValue)
}

export function isNcertBooksCategory(category, categoryOptions = []) {
  const value = String(category || '').trim()
  if (!value) return false
  if (value === FREE_RESOURCE_CATEGORY.NCERT || value === 'NCERT_BOOKS') return true

  const matched = categoryOptions.find((option) => String(option.value) === value)
  if (matched && /ncert/i.test(String(matched.label || ''))) return true

  return /ncert/i.test(value)
}

export function resolveNcertRendererCategory(category, categoryOptions = []) {
  return isNcertBooksCategory(category, categoryOptions) ? FREE_RESOURCE_CATEGORY.NCERT : ''
}

export function isPreviousYearPapersCategory(category, categoryOptions = []) {
  const value = String(category || '').trim()
  if (!value) return false

  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_')
  if (
    value === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR ||
    normalized === 'PREVIOUS_YEAR_QUESTIONS' ||
    normalized === 'PREVIOUS_YEAR_QUESTION_PAPERS' ||
    normalized === 'PREVIOUS_YEAR_QUESTION_PAPER' ||
    normalized === 'PREVIOUS_YEAR_PAPERS' ||
    normalized === 'PREVIOUS_YEAR'
  ) {
    return true
  }

  const matched = categoryOptions.find((option) => String(option.value) === value)
  if (matched && /previous year/i.test(String(matched.label || ''))) return true

  return /previous.?year/i.test(value)
}

export function isMockTestsCategory(category, categoryOptions = []) {
  const value = String(category || '').trim()
  if (!value) return false

  if (value === FREE_RESOURCE_CATEGORY.MOCK_TEST) return true

  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_')
  if (
    normalized === 'FREE_MOCK_TESTS' ||
    normalized === 'MOCK_TESTS' ||
    normalized === 'MOCK_TEST' ||
    normalized === 'FREE_MOCK_TEST'
  ) {
    return true
  }

  const matched = categoryOptions.find((option) => String(option.value) === value)
  if (matched && /mock test/i.test(String(matched.label || ''))) return true

  return /mock.?test/i.test(value)
}

export function isStudyMaterialCategory(category, categoryOptions = []) {
  const value = String(category || '').trim()
  if (!value) return false

  if (value === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL) return true

  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_')
  if (
    normalized === 'STUDY_MATERIAL' ||
    normalized === 'STUDY_MATERIALS' ||
    normalized === 'FREE_STUDY_MATERIAL'
  ) {
    return true
  }

  const matched = categoryOptions.find((option) => String(option.value) === value)
  if (matched && /study material/i.test(String(matched.label || ''))) return true

  return /study.?material/i.test(value)
}

export function resolveFreeResourceRendererCategory(category, categoryOptions = []) {
  if (isNcertBooksCategory(category, categoryOptions)) return FREE_RESOURCE_CATEGORY.NCERT
  if (isPreviousYearPapersCategory(category, categoryOptions)) {
    return FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR
  }
  if (isMockTestsCategory(category, categoryOptions)) return FREE_RESOURCE_CATEGORY.MOCK_TEST
  if (isStudyMaterialCategory(category, categoryOptions)) return FREE_RESOURCE_CATEGORY.STUDY_MATERIAL
  return ''
}

export function normalizeFreeResourceDropdownOptions(data, listKeys = []) {
  return unwrapList(data, [...listKeys, 'options', 'dropdown', 'list', 'values'])
    .map(mapDropdownRow)
    .filter(Boolean)
}

export function normalizeExamCategoryDropdownOptions(data) {
  const fromApi = normalizeFreeResourceDropdownOptions(data, [
    'examCategories',
    'examCategory',
    'categories',
    'items',
    'results',
  ])
  if (fromApi.length) return fromApi
  return EXAM_CATEGORY_OPTIONS.map((value) => ({ value, label: value }))
}

export function normalizePaperTypeDropdownOptions(data) {
  const fromApi = normalizeFreeResourceDropdownOptions(data, [
    'paperTypes',
    'paperType',
    'types',
    'items',
    'results',
  ])
  if (fromApi.length) return fromApi
  return PAPER_TYPE_OPTIONS.map((value) => ({ value, label: value }))
}

export function normalizeYearDropdownOptions(data) {
  const fromApi = normalizeFreeResourceDropdownOptions(data, ['years', 'year', 'items', 'results'])
  if (fromApi.length) return fromApi
  return YEAR_OPTIONS.map((value) => ({ value, label: value }))
}

export function normalizeNcertBookClassValue(className) {
  const raw = String(className || '').trim()
  if (!raw) return ''

  const classMatch = raw.match(/class\s*(\d{1,2})/i)
  if (classMatch) return `Class ${classMatch[1]}`

  const numberOnly = raw.match(/^(\d{1,2})$/)
  if (numberOnly) return `Class ${numberOnly[1]}`

  if (/^class\s+/i.test(raw)) {
    return raw.replace(/^class/i, 'Class')
  }

  return raw
}

function sanitizeUploadFilename(name, fallback = 'upload.pdf') {
  const trimmed = String(name || '').trim()
  const safe = trimmed
    .replace(/[|<>:"/\\?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return safe || fallback
}

function appendMultipartFile(formData, file, { fallbackName = 'upload.pdf', mimeType } = {}) {
  if (!(file instanceof Blob) || file.size <= 0) return false

  const safeName = sanitizeUploadFilename(file.name, fallbackName)
  const type = mimeType || file.type || 'application/pdf'
  const uploadFile =
    file instanceof File && file.name === safeName && (file.type || type) === type
      ? file
      : new File([file], safeName, { type })

  formData.append('file', uploadFile, safeName)
  return true
}

export function validateNcertBookPdf(file) {
  if (!file) {
    return { valid: false, message: 'PDF is required' }
  }

  const ext = getFileExtension(file.name)
  const isPdf = ext === 'pdf' || file.type === 'application/pdf'
  if (!isPdf) {
    return { valid: false, message: 'Only PDF files are allowed.' }
  }

  if (file.size > NCERT_BOOKS_MAX_PDF_BYTES) {
    return { valid: false, message: ncertPdfMaxSizeMessage() }
  }

  return { valid: true }
}

export function buildNcertBookFormData(
  { subject, className, bookName, status, bookFile },
  { isEdit = false } = {},
) {
  const formData = new FormData()
  formData.append('subject', String(subject || '').trim())
  formData.append('class', normalizeNcertBookClassValue(className))
  formData.append('bookName', String(bookName || '').trim())
  formData.append('status', String(status || 'ACTIVE').trim().toUpperCase())

  if (appendMultipartFile(formData, bookFile, { fallbackName: 'book.pdf' })) {
    return formData
  }

  if (!isEdit) {
    throw new Error('PDF file is required.')
  }

  return formData
}

function unwrapNcertBookRecord(data) {
  return data?.data ?? data?.ncertBook ?? data
}

export function mapNcertBookApiToForm(raw, categoryOptions = []) {
  const item = unwrapNcertBookRecord(raw) || {}
  const status = String(item.status || 'ACTIVE').toUpperCase()
  const fileMeta = item.file && typeof item.file === 'object' ? item.file : {}

  return {
    category: resolveResourceCategoryFormValue(
      {
        resourceCategory: item.resourceCategory,
        resourceCategoryLabel: item.resourceCategoryLabel,
      },
      categoryOptions,
      FREE_RESOURCE_CATEGORY.NCERT,
    ),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    subject: item.subject || '',
    className: item.class || item.className || '',
    bookName: item.bookName || item.resourceName || '',
    bookFileName: item.fileName || fileMeta.fileName || '',
    bookFile: null,
    apiResourceId: item._id || item.id || null,
  }
}

function unwrapNcertBookList(data) {
  if (Array.isArray(data)) return data
  const nested = data?.data
  if (Array.isArray(nested)) return nested
  if (nested && typeof nested === 'object') {
    for (const key of ['ncertBooks', 'books', 'items', 'results', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }
  for (const key of ['ncertBooks', 'books', 'items', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

export function mapNcertBookApiToRow(raw, categoryOptions = []) {
  const item = unwrapNcertBookRecord(raw) || {}
  const id = item._id || item.id
  const name = resolveUnifiedResourceDisplayName(item, 'NCERT_BOOKS')

  return {
    id,
    name,
    category: FREE_RESOURCE_CATEGORY.NCERT,
    status: mapNcertBookStatusForList(item.status),
    apiResourceId: id,
    resourceCategory: 'NCERT_BOOKS',
    resourceCategoryLabel: item.resourceCategoryLabel || FREE_RESOURCE_CATEGORY.NCERT,
    formData: mapNcertBookApiToForm(item, categoryOptions),
    isApiNcertBook: true,
  }
}

export function normalizeNcertBooksListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = unwrapNcertBookList(data)
  const items = itemsRaw.map((row) => mapNcertBookApiToRow(row)).filter(Boolean)

  const total = data?.total ?? data?.count ?? data?.data?.total ?? items.length
  const totalPages =
    data?.totalPages ??
    data?.data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? data?.data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function mapNcertBookStatusForList(status) {
  return String(status || '').toUpperCase() === 'INACTIVE' ? 'In Active' : 'Active'
}

function getFreeResourceCreateApiErrorMessage(error, fallback) {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.'
    }
    if (error?.code === 'ERR_NETWORK' || String(error?.message || '').toLowerCase().includes('network')) {
      return 'Network error. Check your connection and try again.'
    }
    return getApiErrorMessage(error, fallback)
  }

  const { status, data } = error.response
  if ([400, 401, 403, 404, 405, 408, 409, 415, 422, 429, 500].includes(status)) {
    return getApiErrorMessage(data, fallback)
  }

  return getApiErrorMessage(error, fallback)
}

export function extractCreatedFreeResourceId(response) {
  if (!response || typeof response !== 'object') return undefined

  const candidates = [
    response?.data?._id,
    response?.data?.id,
    response?._id,
    response?.id,
    response?.data?.ncertBook?._id,
    response?.data?.ncertBook?.id,
    response?.ncertBook?._id,
    response?.data?.previousYearPaper?._id,
    response?.data?.previousYearPaper?.id,
    response?.previousYearPaper?._id,
    response?.data?.mockTest?._id,
    response?.data?.mockTest?.id,
    response?.mockTest?._id,
    response?.data?.studyMaterial?._id,
    response?.data?.studyMaterial?.id,
    response?.studyMaterial?._id,
  ]

  return candidates.find((id) => id != null && String(id).trim() !== '')
}

export function getNcertBookApiErrorMessage(error, fallback = 'Failed to create NCERT book.') {
  return getFreeResourceCreateApiErrorMessage(error, fallback)
}

export function validatePreviousYearPaperPdf(file) {
  if (!file) {
    return { valid: false, message: 'PDF is required' }
  }

  const ext = getFileExtension(file.name)
  const isPdf = ext === 'pdf' || file.type === 'application/pdf'
  if (!isPdf) {
    return { valid: false, message: 'Only PDF files are allowed.' }
  }

  if (file.size > NCERT_BOOKS_MAX_PDF_BYTES) {
    return { valid: false, message: ncertPdfMaxSizeMessage() }
  }

  return { valid: true }
}

export function buildPreviousYearPaperFormData({
  examCategory,
  paperType,
  year,
  paperName,
  status,
  questionPaperFile,
}, { isEdit = false } = {}) {
  const formData = new FormData()
  formData.append('examCategory', String(examCategory || '').trim())
  formData.append('paperType', String(paperType || '').trim())
  formData.append('year', String(year || '').trim())
  formData.append('paperName', String(paperName || '').trim())
  formData.append('status', String(status || 'ACTIVE').trim().toUpperCase())
  appendMultipartFile(formData, questionPaperFile, {
    fallbackName: 'question-paper.pdf',
  })
  return formData
}

function unwrapPreviousYearPaperRecord(data) {
  return data?.data ?? data?.previousYearPaper ?? data?.paper ?? data
}

export function mapPreviousYearPaperApiToForm(raw, categoryOptions = []) {
  const item = unwrapPreviousYearPaperRecord(raw) || {}
  const status = String(item.status || 'ACTIVE').toUpperCase()
  const fileMeta = item.file && typeof item.file === 'object' ? item.file : {}

  return {
    category: resolveResourceCategoryFormValue(
      {
        resourceCategory: item.resourceCategory,
        resourceCategoryLabel: item.resourceCategoryLabel,
      },
      categoryOptions,
      FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
    ),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    examCategory: item.examCategory || '',
    paperType: item.paperType || '',
    year: item.year != null ? String(item.year) : '',
    paperName: item.paperName || item.resourceName || '',
    questionPaperFileName: item.fileName || fileMeta.fileName || '',
    questionPaperFile: null,
    apiResourceId: item._id || item.id || null,
  }
}

function unwrapPreviousYearPaperList(data) {
  if (Array.isArray(data)) return data
  const nested = data?.data
  if (Array.isArray(nested)) return nested
  if (nested && typeof nested === 'object') {
    for (const key of ['previousYearPapers', 'papers', 'items', 'results', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }
  for (const key of ['previousYearPapers', 'papers', 'items', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

export function mapPreviousYearPaperApiToRow(raw, categoryOptions = []) {
  const item = unwrapPreviousYearPaperRecord(raw) || {}
  const id = item._id || item.id
  const name = resolveUnifiedResourceDisplayName(item, 'PREVIOUS_YEAR_QUESTIONS')

  return {
    id,
    name,
    category: FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
    status: mapFreeResourceStatusForList(item.status),
    apiResourceId: id,
    resourceCategory: 'PREVIOUS_YEAR_QUESTIONS',
    resourceCategoryLabel: item.resourceCategoryLabel || FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
    formData: mapPreviousYearPaperApiToForm(item, categoryOptions),
    isApiPreviousYearPaper: true,
  }
}

export function normalizePreviousYearPapersListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = unwrapPreviousYearPaperList(data)
  const items = itemsRaw.map((row) => mapPreviousYearPaperApiToRow(row)).filter(Boolean)

  const total = data?.total ?? data?.count ?? data?.data?.total ?? items.length
  const totalPages =
    data?.totalPages ??
    data?.data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? data?.data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function isApiResourceId(id) {
  return /^[a-f0-9]{24}$/i.test(String(id || ''))
}

export function mapFreeResourceStatusForList(status) {
  return String(status || '').toUpperCase() === 'INACTIVE' ? 'In Active' : 'Active'
}

export function getPreviousYearPaperApiErrorMessage(
  error,
  fallback = 'Failed to create previous year question paper.',
) {
  return getFreeResourceCreateApiErrorMessage(error, fallback)
}

function unwrapMockTestRecord(data) {
  return data?.data ?? data?.mockTest ?? data
}

function unwrapMockTestList(data) {
  if (Array.isArray(data)) return data
  const nested = data?.data
  if (Array.isArray(nested)) return nested
  if (nested && typeof nested === 'object') {
    for (const key of ['mockTests', 'items', 'results', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }
  for (const key of ['mockTests', 'items', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

function unwrapMockTestQuestions(data) {
  if (Array.isArray(data)) return data
  const nested = data?.data
  if (Array.isArray(nested)) return nested
  if (Array.isArray(nested?.questions)) return nested.questions
  if (Array.isArray(data?.questions)) return data.questions
  return []
}

function parseNumericField(value, fallback = 0) {
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function mapMockTestCorrectAnswerUiToApi(question) {
  const options = question?.options || []
  const answers = Array.isArray(question?.correctAnswers) ? question.correctAnswers : []
  if (!answers.length || !options.length) return ''

  const first = answers[0]
  const idx = options.findIndex((opt) => opt.id === first || opt.label === first)
  return idx >= 0 ? String(idx + 1) : ''
}

function mapMockTestCorrectAnswerApiToUi(correctAnswer, options) {
  const idx = parseInt(String(correctAnswer ?? ''), 10) - 1
  if (idx >= 0 && options[idx]) return [options[idx].id]
  return []
}

export function mapMockTestQuestionUiToApi(question, index = 0) {
  const options = question?.options || []
  const getOptionText = (i) => String(options[i]?.text || '').trim()

  return {
    questionNo: parseInt(String(question?.questionNo), 10) || index + 1,
    question: String(question?.question || '').trim(),
    option1: getOptionText(0),
    option2: getOptionText(1),
    option3: getOptionText(2),
    option4: getOptionText(3),
    correctAnswer: mapMockTestCorrectAnswerUiToApi(question),
    explanation: String(question?.explanation || '').trim(),
    marks: parseNumericField(question?.marks, 1),
  }
}

export function mapMockTestQuestionApiToUi(raw) {
  const item = raw?.data ?? raw?.question ?? raw
  const optionTexts = [item?.option1, item?.option2, item?.option3, item?.option4]
  const options = optionTexts
    .map((text, index) => ({
      ...createEmptyOption(index),
      text: String(text ?? '').trim(),
    }))
    .filter((opt) => opt.text)

  while (options.length < MIN_OPTIONS) {
    options.push(createEmptyOption(options.length))
  }

  const questionNo = parseInt(String(item?.questionNo ?? ''), 10) || 1
  const base = createEmptyFreeResourceQuestion(questionNo)
  const apiId = item?._id || item?.id || null

  return {
    ...base,
    id: apiId || base.id,
    apiId,
    questionNo,
    question: item?.question || '',
    options: options.slice(0, MAX_OPTIONS),
    correctAnswers: mapMockTestCorrectAnswerApiToUi(item?.correctAnswer, options),
    explanation: item?.explanation || '',
    marks: String(item?.marks ?? '1'),
    saved: true,
  }
}

export function mapMockTestApiToForm(raw) {
  const item = unwrapMockTestRecord(raw) || {}
  const status = String(item.status || 'ACTIVE').toUpperCase()

  return {
    category: FREE_RESOURCE_CATEGORY.MOCK_TEST,
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    examCategory: item.examCategory || '',
    mockTestTitle: item.mockTestTitle || item.title || '',
    paperType: item.paperType || '',
    subject: item.subject || '',
    topic: item.topic || '',
    duration: item.duration != null ? String(item.duration) : '',
    totalMarks: item.totalMarks != null ? String(item.totalMarks) : '',
    negativeMarking: item.negativeMarking != null ? String(item.negativeMarking) : '',
    instructions: item.instructions || '',
    numberOfQuestions:
      item.numberOfQuestions != null ? String(item.numberOfQuestions) : '',
    questions: [],
    apiResourceId: item._id || item.id || null,
  }
}

export function mapMockTestApiToRow(raw) {
  const item = unwrapMockTestRecord(raw) || {}
  const id = item._id || item.id
  const title = String(item.mockTestTitle || item.title || 'Mock Test').trim()
  const count = Number(item.numberOfQuestions ?? item.questionCount ?? 0)
  const name = title ? (count > 0 ? `${title} (${count} Questions)` : title) : 'Mock Test'

  return {
    id,
    apiResourceId: id,
    name,
    category: FREE_RESOURCE_CATEGORY.MOCK_TEST,
    status: mapFreeResourceStatusForList(item.status),
    resourceCategory: 'FREE_MOCK_TEST',
    resourceCategoryLabel: FREE_RESOURCE_CATEGORY.MOCK_TEST,
    formData: mapMockTestApiToForm(item),
    isApiMockTest: true,
  }
}

export function normalizeMockTestsListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = unwrapMockTestList(data)
  const items = itemsRaw.map((row) => mapMockTestApiToRow(row)).filter(Boolean)

  const total = data?.total ?? data?.count ?? data?.data?.total ?? items.length
  const totalPages =
    data?.totalPages ??
    data?.data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? data?.data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function normalizeMockTestQuestionsResponse(data) {
  return unwrapMockTestQuestions(data).map(mapMockTestQuestionApiToUi)
}

export function buildMockTestCreatePayload(form) {
  const questionCount = parseQuestionCount(form.numberOfQuestions)

  return {
    examCategory: String(form.examCategory || '').trim(),
    mockTestTitle: String(form.mockTestTitle || '').trim(),
    paperType: String(form.paperType || '').trim(),
    subject: String(form.subject || '').trim(),
    topic: String(form.topic || '').trim(),
    duration: parseNumericField(form.duration, 0),
    totalMarks: parseNumericField(form.totalMarks, 0),
    negativeMarking: parseNumericField(form.negativeMarking, 0),
    instructions: String(form.instructions || '').trim(),
    numberOfQuestions: questionCount,
    status: String(form.status || 'ACTIVE').trim().toUpperCase() || 'ACTIVE',
    bulkFile: form.bulkFile ?? null,
  }
}

export function buildMockTestUpdatePayload(form) {
  return {
    examCategory: String(form.examCategory || '').trim(),
    mockTestTitle: String(form.mockTestTitle || '').trim(),
    paperType: String(form.paperType || '').trim(),
    subject: String(form.subject || '').trim(),
    topic: String(form.topic || '').trim(),
    duration: parseNumericField(form.duration, 0),
    totalMarks: parseNumericField(form.totalMarks, 0),
    negativeMarking: parseNumericField(form.negativeMarking, 0),
    instructions: String(form.instructions || '').trim(),
    status: String(form.status || 'ACTIVE').trim().toUpperCase() || 'ACTIVE',
    bulkFile: form.bulkFile ?? null,
  }
}

function appendMockTestBulkFile(formData, file) {
  if (!(file instanceof Blob) || file.size <= 0) return false

  const safeName = sanitizeUploadFilename(file.name, 'mock-test-questions.xlsx')
  const type =
    file.type ||
    (safeName.endsWith('.csv')
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  const uploadFile =
    file instanceof File && file.name === safeName ? file : new File([file], safeName, { type })

  formData.append('bulkFile', uploadFile, safeName)
  return true
}

/** POST/PUT /api/free-resources/mock-tests — multipart/form-data */
export function buildMockTestFormData(form, { isEdit = false } = {}) {
  const payload = isEdit ? buildMockTestUpdatePayload(form) : buildMockTestCreatePayload(form)
  const formData = new FormData()

  if (!isEdit) {
    formData.append('examCategory', payload.examCategory)
    formData.append('paperType', payload.paperType)
    formData.append('subject', payload.subject)
    formData.append('topic', payload.topic)
    if (payload.numberOfQuestions > 0) {
      formData.append('numberOfQuestions', String(payload.numberOfQuestions))
    }
  } else {
    if (payload.examCategory) formData.append('examCategory', payload.examCategory)
    if (payload.paperType) formData.append('paperType', payload.paperType)
    if (payload.subject) formData.append('subject', payload.subject)
    if (payload.topic) formData.append('topic', payload.topic)
  }

  formData.append('mockTestTitle', payload.mockTestTitle)
  formData.append('duration', String(payload.duration))
  formData.append('totalMarks', String(payload.totalMarks))
  formData.append('negativeMarking', String(payload.negativeMarking))
  formData.append('instructions', payload.instructions)
  formData.append('status', payload.status)

  appendMockTestBulkFile(formData, payload.bulkFile)

  return formData
}

export function validateMockTestBulkFile(file) {
  if (!file) {
    return { valid: false, message: 'File is required' }
  }

  const ext = getFileExtension(file.name)
  const allowed = ['csv', 'xlsx', 'xls']
  if (!allowed.includes(ext)) {
    return { valid: false, message: 'Only CSV or XLSX files are allowed.' }
  }

  return { valid: true }
}

export function triggerMockTestBulkTemplateDownload(response, filename = 'mock-test-questions-template.xlsx') {
  const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data])
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function getMockTestApiErrorMessage(error, fallback = 'Failed to process mock test request.') {
  return getFreeResourceCreateApiErrorMessage(error, fallback)
}

export const STUDY_MATERIAL_MAX_FILE_BYTES = 25 * 1024 * 1024

export const STUDY_MATERIAL_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx']

export const DEFAULT_STUDY_MATERIAL_CATEGORY_OPTIONS = [
  'POLITY',
  'HISTORY',
  'GEOGRAPHY',
  'ECONOMY',
  'SCIENCE',
  'ENVIRONMENT',
  'ART_AND_CULTURE',
  'ETHICS',
].map((value) => ({
  value,
  label: value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' '),
}))

export function normalizeStudyMaterialCategoryDropdownOptions(data) {
  const fromApi = normalizeFreeResourceDropdownOptions(data, [
    'studyMaterialCategories',
    'categories',
    'category',
    'items',
    'results',
  ])
  return fromApi.length ? fromApi : DEFAULT_STUDY_MATERIAL_CATEGORY_OPTIONS
}

export function validateStudyMaterialFile(file) {
  if (!file) {
    return { valid: false, message: 'File is required' }
  }

  const ext = getFileExtension(file.name)
  if (!STUDY_MATERIAL_ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, message: 'Unsupported file type.' }
  }

  if (file.size > STUDY_MATERIAL_MAX_FILE_BYTES) {
    return { valid: false, message: 'Maximum file size is 25 MB.' }
  }

  return { valid: true }
}

export function buildStudyMaterialFormData(
  { mainsCategory, studyMaterialName, status, studyMaterialFile, file },
  { isEdit = false } = {},
) {
  const formData = new FormData()
  const categoryValue = String(mainsCategory || '').trim()
  const nameValue = String(studyMaterialName || '').trim()
  const statusValue = String(status || 'ACTIVE').trim().toUpperCase()

  formData.append('category', categoryValue)
  formData.append('studyMaterialName', nameValue)
  formData.append('status', statusValue)

  const uploadFile = studyMaterialFile ?? file
  if (appendMultipartFile(formData, uploadFile, { fallbackName: 'study-material.pdf' })) {
    return formData
  }

  if (!isEdit) {
    throw new Error('Study material file is required.')
  }

  return formData
}

function unwrapStudyMaterialRecord(data) {
  return data?.data ?? data?.studyMaterial ?? data
}

function unwrapStudyMaterialList(data) {
  if (Array.isArray(data)) return data
  const nested = data?.data
  if (Array.isArray(nested)) return nested
  if (nested && typeof nested === 'object') {
    for (const key of ['studyMaterials', 'items', 'results', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }
  for (const key of ['studyMaterials', 'items', 'results', 'rows']) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

export function mapStudyMaterialApiToForm(raw) {
  const item = unwrapStudyMaterialRecord(raw) || {}
  const status = String(item.status || 'ACTIVE').toUpperCase()
  const categoryValue =
    item.studyMaterialCategory || item.category || item.mainsCategory || ''
  const fileMeta = item.file && typeof item.file === 'object' ? item.file : {}

  return {
    category: FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    mainsCategory: categoryValue,
    studyMaterialName: item.studyMaterialName || item.resourceName || item.name || '',
    studyMaterialFileName: item.fileName || fileMeta.fileName || item.originalFileName || '',
    studyMaterialFile: null,
    apiResourceId: item._id || item.id || null,
  }
}

export function mapStudyMaterialApiToRow(raw) {
  const item = unwrapStudyMaterialRecord(raw) || {}
  const id = item._id || item.id
  const name = resolveUnifiedResourceDisplayName(item, 'STUDY_MATERIAL')

  return {
    id,
    apiResourceId: id,
    name,
    category: FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
    status: mapFreeResourceStatusForList(item.status),
    resourceCategory: 'STUDY_MATERIAL',
    resourceCategoryLabel: item.resourceCategoryLabel || FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
    formData: mapStudyMaterialApiToForm(item),
    isApiStudyMaterial: true,
  }
}

export function getFreeResourceApiErrorMessage(error, fallback = 'Failed to process free resource.') {
  return getFreeResourceCreateApiErrorMessage(error, fallback)
}

export function normalizeStudyMaterialsListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = unwrapStudyMaterialList(data)
  const items = itemsRaw.map((row) => mapStudyMaterialApiToRow(row)).filter(Boolean)

  const total = data?.total ?? data?.count ?? data?.data?.total ?? items.length
  const totalPages =
    data?.totalPages ??
    data?.data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? data?.data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function getStudyMaterialApiErrorMessage(
  error,
  fallback = 'Failed to process study material request.',
) {
  return getFreeResourceCreateApiErrorMessage(error, fallback)
}

export function getFreeResourceDropdownErrorMessage(error, fallback = 'Unable to load dropdown options.') {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK' || String(error?.message || '').toLowerCase().includes('network')) {
      return 'Network error. Check your connection and try again.'
    }
    return getApiErrorMessage(error, fallback)
  }

  switch (error.response.status) {
    case 400:
    case 422:
      return getApiErrorMessage(error.response.data, fallback)
    case 401:
      return 'Session expired. Please sign in again.'
    case 403:
      return 'You do not have permission to load free resource options.'
    case 404:
      return 'Dropdown options are not available.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return getApiErrorMessage(error, fallback)
  }
}
