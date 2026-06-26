import {
  CBT_CREATE_FORM_ENUMS,
  SEED_PRELIMS_TESTS,
} from '../data/cbtPrelimsTestsSeed'
import { buildDefaultCbtForm } from '../utils/cbtTestFormHelpers'
import cbtDropdownService from './cbtDropdownService'

const STORAGE_KEY = 'tm_prelims_tests_v1'
const QUESTIONS_KEY = 'tm_prelims_questions_v1'
const DELAY_MS = 160

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadTests() {
  if (typeof window === 'undefined') return [...SEED_PRELIMS_TESTS]
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PRELIMS_TESTS))
    return [...SEED_PRELIMS_TESTS]
  }
  const parsed = safeJsonParse(raw, SEED_PRELIMS_TESTS)
  return Array.isArray(parsed) ? parsed : [...SEED_PRELIMS_TESTS]
}

function saveTests(tests) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tests))
}

function loadQuestions(testId) {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(QUESTIONS_KEY)
  const all = safeJsonParse(raw, {})
  return Array.isArray(all[testId]) ? all[testId] : []
}

function saveQuestions(testId, questions) {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(QUESTIONS_KEY)
  const all = safeJsonParse(raw, {})
  all[testId] = questions
  window.localStorage.setItem(QUESTIONS_KEY, JSON.stringify(all))
}

function filterTests(tests, filters = {}) {
  let rows = [...tests]
  const q = String(filters.search || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (row) =>
        row.testName?.toLowerCase().includes(q) ||
        row.prelimsTestId?.toLowerCase().includes(q) ||
        row.facultySubjectName?.toLowerCase().includes(q),
    )
  }
  if (filters.facultySubjectId && filters.facultySubjectId !== 'all') {
    rows = rows.filter((row) => String(row.facultySubjectId) === String(filters.facultySubjectId))
  }
  if (filters.folderId && filters.folderId !== 'all') {
    rows = rows.filter((row) => String(row.folderId) === String(filters.folderId))
  }
  if (filters.publishStatus && filters.publishStatus !== 'all') {
    rows = rows.filter((row) => row.publishStatus === filters.publishStatus)
  }
  return rows
}

function parseFormData(formData) {
  if (!(formData instanceof FormData)) return {}
  const values = {}
  for (const [key, value] of formData.entries()) {
    if (key === 'batchIds' || key === 'languages') {
      try {
        values[key] = JSON.parse(value)
      } catch {
        values[key] = []
      }
    } else if (key.startsWith('questionFile_')) {
      values[key] = value
    } else {
      values[key] = value
    }
  }
  return values
}

export const cbtTestService = {
  async getCreateForm(body = {}) {
    await delay()
    const [facultySubjects, languages, examPatterns] = await Promise.all([
      cbtDropdownService.facultySubjects(),
      cbtDropdownService.languages(),
      cbtDropdownService.examPatterns(),
    ])
    return {
      data: {
        enums: {
          ...CBT_CREATE_FORM_ENUMS,
          facultySubjects: facultySubjects.data,
          languages: languages.data,
          examPatterns: examPatterns.data,
        },
      },
    }
  },

  async getDashboardSummary() {
    await delay()
    return { data: { totalTests: loadTests().length } }
  },

  async createTest(formData) {
    await delay()
    const values = parseFormData(formData)
    const tests = loadTests()
    const nextId = `cbt-test-${Date.now()}`
    const nextCode = `PTM${String(tests.length + 1).padStart(3, '0')}`
    const row = {
      _id: nextId,
      prelimsTestId: nextCode,
      testName: values.testName || 'New CBT Test',
      facultySubjectId: values.facultySubjectId,
      folderId: values.folderId,
      batchIds: values.batchIds || [],
      languages: values.languages || [],
      totalQuestions: 0,
      durationMinutes: Number(values.durationMinutes) || 120,
      durationLabel: `${Number(values.durationMinutes) || 120} min`,
      scheduleDate: values.scheduleDate,
      scheduleTime: values.scheduleTime,
      resultDate: values.resultDate,
      publishStatus: values.publishStatus || 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveTests([row, ...tests])
    return { success: true, message: 'CBT test created successfully', data: row }
  },

  async updateTest(id, payload) {
    await delay()
    const tests = loadTests()
    const idx = tests.findIndex((row) => String(row._id) === String(id))
    if (idx < 0) throw new Error('Test not found')
    tests[idx] = { ...tests[idx], ...payload, updatedAt: new Date().toISOString() }
    saveTests(tests)
    return { success: true, data: tests[idx] }
  },

  async deleteTest(id) {
    await delay()
    saveTests(loadTests().filter((row) => String(row._id) !== String(id)))
    return { success: true }
  },

  async getTestById(id) {
    await delay()
    const row = loadTests().find((test) => String(test._id) === String(id))
    if (!row) throw new Error('Test not found')
    return { data: row }
  },

  async getTests(filters = {}) {
    await delay()
    const page = Number(filters.page) || 1
    const limit = Number(filters.limit) || 10
    const rows = filterTests(loadTests(), filters)
    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    return {
      data: rows.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages,
      count: rows.length,
    }
  },

  async publishTest(id, publishStatus) {
    return this.updateTest(id, { publishStatus })
  },

  async duplicateTest(id, testName) {
    await delay()
    const source = loadTests().find((row) => String(row._id) === String(id))
    if (!source) throw new Error('Test not found')
    const copy = {
      ...source,
      _id: `cbt-test-${Date.now()}`,
      prelimsTestId: `PTM${String(loadTests().length + 1).padStart(3, '0')}`,
      testName: testName || `${source.testName} (Copy)`,
      publishStatus: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveTests([copy, ...loadTests()])
    return { success: true, data: copy }
  },

  async uploadQuestions(formData) {
    await delay()
    const values = parseFormData(formData)
    const testId = values.prelimsTestId
    const existing = loadQuestions(testId)
    const added = (values.languages || []).map((lang, index) => ({
      id: `q-${testId}-${lang}-${Date.now()}-${index}`,
      language: lang,
      questionCount: 25,
    }))
    saveQuestions(testId, [...existing, ...added])
    return { success: true, message: 'Questions uploaded successfully' }
  },

  async reuploadQuestions(formData) {
    await delay()
    const values = parseFormData(formData)
    const testId = values.prelimsTestId
    saveQuestions(testId, [])
    return this.uploadQuestions(formData)
  },

  async listQuestions(body = {}) {
    await delay()
    const testId = body.prelimsTestId || body.id
    return { data: loadQuestions(testId) }
  },
}

export default cbtTestService
