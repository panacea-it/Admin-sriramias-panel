import { mapApiStatusToUi, mapUiStatusToApi } from './programHelpers'

/** @typedef {{ value: string, label: string }} SelectOption */

const API_TO_UI_CATEGORY = {
  LIVE_CLASS: 'Live Class',
  RECORDING: 'Recording',
  PRELIMS_TEST: 'Test',
  MAINS_ANSWER_WRITING: 'Mains Answer Writing',
  PDF: 'PDF',
}

const UI_TO_API_CATEGORY = {
  'Live Class': 'LIVE_CLASS',
  Recording: 'RECORDING',
  Test: 'PRELIMS_TEST',
  'Prelims Test': 'PRELIMS_TEST',
  'Test Series': 'PRELIMS_TEST',
  'Mains Answer Writing': 'MAINS_ANSWER_WRITING',
  PDF: 'PDF',
}

/** Canonical category options — matches GET /api/faculty-subjects/categories */
export const DEFAULT_FACULTY_SUBJECT_CATEGORIES = [
  { value: 'LIVE_CLASS', label: 'Live Class' },
  { value: 'RECORDING', label: 'Recording' },
  { value: 'PRELIMS_TEST', label: 'Prelims Test' },
  { value: 'MAINS_ANSWER_WRITING', label: 'Mains Answer Writing' },
  { value: 'PDF', label: 'PDF' },
]

const CATEGORY_LABEL_BY_VALUE = Object.fromEntries(
  DEFAULT_FACULTY_SUBJECT_CATEGORIES.map((o) => [o.value, o.label]),
)

export function mapFacultySubjectStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function mapApiCategoriesToUi(categories) {
  if (!Array.isArray(categories)) return []
  return [...new Set(
    categories
      .map((c) => {
        const raw = String(c || '').trim()
        if (API_TO_UI_CATEGORY[raw]) return API_TO_UI_CATEGORY[raw]
        if (UI_TO_API_CATEGORY[raw]) return raw
        return raw
      })
      .filter(Boolean),
  )]
}

export function mapUiCategoriesToApi(categories) {
  if (!Array.isArray(categories)) return []
  return [...new Set(
    categories
      .map((c) => {
        const raw = String(c || '').trim()
        if (API_TO_UI_CATEGORY[raw]) return raw
        return UI_TO_API_CATEGORY[raw] || null
      })
      .filter(Boolean),
  )]
}

function formatDisplayId(row, fallbackId) {
  const raw = row?.facultySubjectId ?? row?.displayId ?? fallbackId
  if (raw == null || raw === '') return '—'
  const num = parseInt(String(raw).replace(/\D/g, ''), 10)
  if (!Number.isNaN(num) && num > 0) return String(num).padStart(3, '0')
  return String(raw)
}

function extractTeacherName(apiRow) {
  if (apiRow?.teacherDetails?.teacherName) return apiRow.teacherDetails.teacherName
  if (apiRow?.teacherName) return apiRow.teacherName
  if (typeof apiRow?.teacher === 'object' && apiRow.teacher?.teacherName) {
    return apiRow.teacher.teacherName
  }
  if (typeof apiRow?.teacher === 'string' && !/^[a-f0-9]{24}$/i.test(apiRow.teacher)) {
    return apiRow.teacher
  }
  return ''
}

function extractTeacherId(apiRow) {
  if (typeof apiRow?.teacher === 'object') return String(apiRow.teacher._id || apiRow.teacher.id || '')
  if (typeof apiRow?.teacher === 'string') return apiRow.teacher
  return String(apiRow?.teacherId || '')
}

function extractSubjectId(apiRow) {
  if (typeof apiRow?.subject === 'object') return String(apiRow.subject._id || apiRow.subject.id || '')
  if (typeof apiRow?.subject === 'string') return apiRow.subject
  return String(apiRow?.subjectId || '')
}

function extractTopicIds(apiRow) {
  if (!Array.isArray(apiRow?.topics)) return []
  return apiRow.topics
    .map((t) => (typeof t === 'object' ? String(t._id || t.id || '') : String(t)))
    .filter(Boolean)
}

function extractTopicNames(apiRow) {
  if (!Array.isArray(apiRow?.topics)) return []
  return apiRow.topics
    .map((t) => (typeof t === 'object' ? String(t.topicName || t.name || '') : String(t)))
    .filter(Boolean)
}

export function unwrapFacultySubjectPayload(data) {
  if (data?.data != null && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }
  return data
}

function extractSubjectLabel(apiRow) {
  if (typeof apiRow?.subject === 'object' && apiRow.subject) {
    return String(apiRow.subject.subjectName || apiRow.subject.name || '').trim()
  }
  if (apiRow?.subjectDetails?.subjectName) {
    return String(apiRow.subjectDetails.subjectName).trim()
  }
  if (apiRow?.subjectName && typeof apiRow?.subject === 'string') {
    return ''
  }
  return String(apiRow?.subjectName || '').trim()
}

export function mapApiFacultySubjectToRow(data) {
  const apiRow = unwrapFacultySubjectPayload(data)
  if (!apiRow || typeof apiRow !== 'object') return null

  const id = apiRow._id ?? apiRow.id
  if (!id) return null

  const topicNames = extractTopicNames(apiRow)

  return {
    id: String(id),
    displayId: formatDisplayId(apiRow, id),
    facultySubjectId: apiRow.facultySubjectId != null ? String(apiRow.facultySubjectId) : undefined,
    subjectName: String(apiRow.subjectName || '').trim(),
    subjectLabel: extractSubjectLabel(apiRow),
    subject: extractSubjectId(apiRow),
    teacher: extractTeacherName(apiRow),
    teacherId: extractTeacherId(apiRow),
    topics: topicNames,
    topic: topicNames[0] || '',
    categories: mapApiCategoriesToUi(apiRow.categories),
    category: mapApiCategoriesToUi(apiRow.categories)[0] || '',
    status: mapApiStatusToUi(apiRow.status),
    liveClasses: apiRow.liveClasses || [],
    recordings: apiRow.recordings || [],
    testSeries: apiRow.testSeries || null,
    createdAt: apiRow.createdAt || null,
    modifiedAt: apiRow.updatedAt || apiRow.modifiedAt || null,
  }
}

const MONGO_OBJECT_ID = /^[a-f0-9]{24}$/i

export function isMongoObjectId(value) {
  return MONGO_OBJECT_ID.test(String(value || '').trim())
}

/** Row shape for edit form — stores ids in subject / teacher / topics fields. */
export function mapApiFacultySubjectToFormRow(data) {
  const row = mapApiFacultySubjectToRow(data)
  if (!row) return null
  const apiRow = unwrapFacultySubjectPayload(data)
  const topicIds = extractTopicIds(apiRow)
  const teacherId = extractTeacherId(apiRow)
  return {
    ...row,
    _hydrated: true,
    subject: extractSubjectId(apiRow),
    teacher: teacherId,
    teacherId,
    topicIds,
    topics: topicIds,
    categories: Array.isArray(apiRow.categories)
      ? apiRow.categories.map(String).filter(Boolean)
      : mapApiCategoriesToUi(apiRow.categories),
    topicMeta: Array.isArray(apiRow.topics)
      ? apiRow.topics
          .map((t) =>
            typeof t === 'object'
              ? {
                  value: String(t._id || t.id || ''),
                  label: String(t.topicName || t.name || ''),
                }
              : null,
          )
          .filter((o) => o?.value)
      : [],
    teacherMeta:
      apiRow.teacherDetails && typeof apiRow.teacherDetails === 'object'
        ? [
            {
              value: String(apiRow.teacherDetails._id || apiRow.teacherDetails.id || ''),
              label: String(apiRow.teacherDetails.teacherName || apiRow.teacherDetails.name || ''),
            },
          ].filter((o) => o.value)
        : [],
  }
}

function resolveTopicIds(form) {
  const raw = Array.isArray(form.topicIds) && form.topicIds.length
    ? form.topicIds
    : form.topics
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map(String).filter(isMongoObjectId))]
}

function resolveTeacherId(form) {
  const id = String(form.teacherId || form.teacher || '').trim()
  return isMongoObjectId(id) ? id : ''
}

export function buildFacultySubjectApiPayload(form) {
  return {
    subjectName: String(form.subjectName || '').trim(),
    subjectId: String(form.subject || '').trim(),
    topicIds: resolveTopicIds(form),
    teacherId: resolveTeacherId(form),
    categories: mapUiCategoriesToApi(form.categories),
    status: mapUiStatusToApi(form.status || 'Active'),
  }
}

export function normalizeFacultySubjectsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw = Array.isArray(data?.data)
    ? data.data
    : payload?.items ??
      payload?.results ??
      payload?.subjects ??
      (Array.isArray(payload) ? payload : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiFacultySubjectToRow(row))
    .filter(Boolean)

  const total = data?.total ?? payload?.total ?? items.length
  const totalPages =
    data?.totalPages ??
    payload?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? payload?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}

/** @returns {SelectOption[]} */
export function normalizeSubjectsDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : data?.data ?? data?.items ?? []
  return (Array.isArray(list) ? list : [])
    .map((row) => {
      const value = String(row._id ?? row.id ?? '')
      const label = String(row.subjectName ?? row.name ?? value)
      if (!value) return null
      return { value, label }
    })
    .filter(Boolean)
}

/** @returns {SelectOption[]} */
export function normalizeFacultySubjectCategoriesResponse(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : []

  const parsed = (Array.isArray(list) ? list : [])
    .map((row) => {
      if (typeof row === 'string') {
        const value = row.trim()
        if (!value) return null
        return { value, label: CATEGORY_LABEL_BY_VALUE[value] || value }
      }
      const value = String(row.value ?? row.id ?? row.code ?? '').trim()
      const label = String(row.label ?? row.name ?? CATEGORY_LABEL_BY_VALUE[value] ?? value)
      if (!value) return null
      return { value, label }
    })
    .filter(Boolean)

  return parsed.length ? parsed : DEFAULT_FACULTY_SUBJECT_CATEGORIES
}

/** Build category dropdown options from raw API enum strings. */
export function buildCategoryOptionsFromEnums(enums = []) {
  const merged = new Set([
    ...DEFAULT_FACULTY_SUBJECT_CATEGORIES.map((o) => o.value),
    ...enums.map((value) => String(value || '').trim()).filter(Boolean),
  ])

  return [...merged].map((value) => ({
    value,
    label: CATEGORY_LABEL_BY_VALUE[value] || value,
  }))
}

/** @returns {{ subjects: SelectOption[], topics: SelectOption[], teachers: SelectOption[] }} */
export function normalizeFacultySubjectCreateFormResponse(data) {
  const payload = data?.data ?? data ?? {}
  const mapTopic = (row) => ({
    value: String(row._id ?? row.id ?? ''),
    label: String(row.topicName ?? row.name ?? ''),
  })
  const mapTeacher = (row) => ({
    value: String(row._id ?? row.id ?? ''),
    label: String(row.teacherName ?? row.name ?? ''),
  })
  const mapSubject = (row) => ({
    value: String(row._id ?? row.id ?? ''),
    label: String(row.subjectName ?? row.name ?? ''),
  })

  return {
    subjects: (Array.isArray(payload.subjects) ? payload.subjects : [])
      .map(mapSubject)
      .filter((o) => o.value),
    topics: (Array.isArray(payload.topics) ? payload.topics : [])
      .map(mapTopic)
      .filter((o) => o.value),
    teachers: (Array.isArray(payload.teachers) ? payload.teachers : [])
      .map(mapTeacher)
      .filter((o) => o.value),
  }
}
