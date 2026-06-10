/** UI display label → API enum */
export const UI_CATEGORY_TO_API = {
  'Current Affairs': 'CURRENT_AFFAIRS',
  'Monthly Magazine': 'MONTHLY_MAGAZINE',
  Infographics: 'INFOGRAPHICS',
  'Monthly Recap': 'MONTHLY_RECAP',
  'Daily Practice Questions': 'DAILY_PRACTICE_QUESTIONS',
}

/** API enum → UI display label */
export const API_CATEGORY_TO_UI = Object.fromEntries(
  Object.entries(UI_CATEGORY_TO_API).map(([ui, api]) => [api, ui]),
)

const UI_MAINS_TO_API = {
  Prelims: 'PRELIMS',
  Mains: 'MAINS',
}

const API_MAINS_TO_UI = {
  PRELIMS: 'Prelims',
  MAINS: 'Mains',
}

export function mapUiCategoryToApi(category) {
  return UI_CATEGORY_TO_API[category] || String(category || '').trim().toUpperCase().replace(/\s+/g, '_')
}

export function mapApiCategoryToUi(category) {
  return API_CATEGORY_TO_UI[String(category || '').toUpperCase()] || category || ''
}

export function mapUiMainsCategoryToApi(value) {
  return UI_MAINS_TO_API[value] || String(value || '').trim().toUpperCase()
}

export function mapApiMainsCategoryToUi(value) {
  return API_MAINS_TO_UI[String(value || '').toUpperCase()] || value || ''
}

export function mapUiStatusToApi(status) {
  return status === 'Active'
}

export function mapApiStatusToUi(status) {
  if (status === true || String(status).toLowerCase() === 'true' || String(status).toLowerCase() === 'active') {
    return 'Active'
  }
  return 'In Active'
}

export function mapUiStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').toLowerCase()
  if (normalized === 'all') return undefined
  if (normalized === 'active') return 'true'
  if (normalized === 'in active' || normalized === 'inactive') return 'false'
  return undefined
}

function mapAnswerUiToApi(answer) {
  const t = String(answer || '').trim().toUpperCase()
  if (/^[A-D]$/.test(t)) return t
  if (/^[1-4]$/.test(t)) return 'ABCD'[parseInt(t, 10) - 1]
  return t
}

function mapAnswerApiToUi(answer) {
  const t = String(answer || '').trim().toUpperCase()
  if (/^[A-D]$/.test(t)) return String('ABCD'.indexOf(t) + 1)
  return String(answer || '').trim()
}

export function mapQuestionUiToApi(q) {
  return {
    questionNumber: parseInt(String(q.questionNo), 10) || 0,
    question: String(q.question || '').trim(),
    optionA: String(q.option1 || '').trim(),
    optionB: String(q.option2 || '').trim(),
    optionC: String(q.option3 || '').trim(),
    optionD: String(q.option4 || '').trim(),
    correctAnswer: mapAnswerUiToApi(q.answer),
    explanation: String(q.explanation || '').trim(),
  }
}

export function mapQuestionApiToUi(q) {
  return {
    id: q._id || q.id || `ca-q-${q.questionNumber}`,
    apiId: q._id || q.id || null,
    questionNo: String(q.questionNumber ?? ''),
    question: q.question || '',
    option1: q.optionA || '',
    option2: q.optionB || '',
    option3: q.optionC || '',
    option4: q.optionD || '',
    answer: mapAnswerApiToUi(q.correctAnswer),
    explanation: q.explanation || '',
    imageName: q.imageUrl ? extractPdfFileName(q.imageUrl) : '',
    image: null,
    imageUrl: q.imageUrl || null,
  }
}

function extractPdfFileName(url) {
  if (!url) return ''
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split('/').pop() || 'document.pdf')
  } catch {
    return 'document.pdf'
  }
}

export function unwrapCurrentAffairResponse(data) {
  return data?.data ?? data?.currentAffair ?? data
}

export function mapApiCurrentAffairToRow(data) {
  if (!data || typeof data !== 'object') return null

  const id = data._id || data.id
  const category = mapApiCategoryToUi(data.category)

  return {
    id: String(id || ''),
    name: String(data.title || data.paperName || '').trim() || 'Untitled',
    category,
    status: mapApiStatusToUi(data.status),
    pdfUrl: data.pdfUrl || null,
    _raw: data,
  }
}

export function mapApiCurrentAffairToForm(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const category = mapApiCategoryToUi(data.category)
  const pdfUrl = data.pdfUrl || null

  return {
    category,
    name: String(data.title || '').trim(),
    year: data.year != null ? String(data.year) : '',
    month: data.month || '',
    date: data.date || '',
    mainsCategory: mapApiMainsCategoryToUi(data.mainsCategory),
    paperName: data.paperName || data.title || '',
    sectionFrom: data.sectionFrom != null ? String(data.sectionFrom) : '',
    sectionTo: data.sectionTo != null ? String(data.sectionTo) : '',
    questions: Array.isArray(data.questions) ? data.questions.map(mapQuestionApiToUi) : [],
    fileName: extractPdfFileName(pdfUrl),
    file: null,
    existingPdfUrl: pdfUrl,
    status: mapApiStatusToUi(data.status),
  }
}

export function normalizeCurrentAffairsListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : []

  const items = itemsRaw.map((row) => mapApiCurrentAffairToRow(row)).filter(Boolean)

  const total = data?.total ?? data?.count ?? items.length
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

export function buildCurrentAffairFormData(form, { isEdit = false } = {}) {
  const formData = new FormData()
  const category = form.category || ''
  const apiCategory = mapUiCategoryToApi(category)

  formData.append('category', apiCategory)
  formData.append('title', String(form.name || '').trim())
  if (form.year) formData.append('year', String(form.year))
  if (form.month) formData.append('month', String(form.month))
  if (form.file instanceof File) {
    formData.append('pdf', form.file)
  }

  if (isEdit) {
    formData.append('status', form.status === 'Active' ? 'true' : 'false')
  }

  return formData
}

export function buildDailyPracticePayload(form, { isEdit = false } = {}) {
  const payload = {
    mainsCategory: mapUiMainsCategoryToApi(form.mainsCategory),
    paperName: String(form.paperName || '').trim(),
    year: parseInt(String(form.year), 10) || String(form.year || ''),
    month: String(form.month || '').trim(),
    date: String(form.date || '').trim(),
    sectionFrom: parseInt(String(form.sectionFrom), 10) || 0,
    sectionTo: parseInt(String(form.sectionTo), 10) || 0,
    questions: (form.questions || []).map(mapQuestionUiToApi),
  }

  if (isEdit) {
    payload.status = form.status === 'Active'
  }

  return payload
}

export function buildDailyPracticeBulkFormData(form, file) {
  const formData = new FormData()
  formData.append('mainsCategory', mapUiMainsCategoryToApi(form.mainsCategory))
  formData.append('paperName', String(form.paperName || '').trim())
  formData.append('year', String(form.year || ''))
  formData.append('month', String(form.month || ''))
  formData.append('date', String(form.date || ''))
  formData.append('file', file)
  return formData
}

export function buildQuestionFormData(q) {
  const formData = new FormData()
  formData.append('questionNumber', String(parseInt(String(q.questionNo), 10) || 0))
  formData.append('question', String(q.question || '').trim())
  formData.append('optionA', String(q.option1 || '').trim())
  formData.append('optionB', String(q.option2 || '').trim())
  formData.append('optionC', String(q.option3 || '').trim())
  formData.append('optionD', String(q.option4 || '').trim())
  formData.append('correctAnswer', mapAnswerUiToApi(q.answer))
  formData.append('explanation', String(q.explanation || '').trim())
  if (q.image instanceof File) {
    formData.append('image', q.image)
  }
  return formData
}

export function normalizeMainsCategoriesResponse(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : []

  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { value: mapApiMainsCategoryToUi(item), label: mapApiMainsCategoryToUi(item) }
      }
      const value = mapApiMainsCategoryToUi(item.value || item.code || item.name || item)
      const label = String(item.label || item.name || value).trim()
      return value ? { value, label } : null
    })
    .filter(Boolean)
}
