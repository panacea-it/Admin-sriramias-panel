import { isFrontendOnly } from '../config/appMode'
import {
  SEED_EXAM_PATTERNS,
  SEED_LANGUAGES,
  SEED_MARKING_RULES,
} from '../data/testConfigurationSeed'
import {
  getSectionSeedRows,
  isLegacySectionStore,
  normalizeSectionList,
  normalizeSectionRow,
  purgeLegacySectionStorage,
  SECTION_STORAGE_KEY,
} from '../utils/sectionManagementStorage'

const DELAY_MS = 160

export const TEST_CONFIG_UPDATED_EVENT = 'test-configuration-updated'

export function notifyTestConfigurationUpdated(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TEST_CONFIG_UPDATED_EVENT, { detail }))
}

const KEYS = {
  examPatterns: 'tm_exam_instructions_v2',
  sectionConfigs: SECTION_STORAGE_KEY,
  markingRules: 'tm_marking_rules_v1',
  languages: 'tm_languages_v1',
}

function delay(ms = DELAY_MS) {
  return new Promise((r) => setTimeout(r, ms))
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadStore(key, seed) {
  if (typeof window === 'undefined') return seed
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  const parsed = safeJsonParse(raw, seed)
  return Array.isArray(parsed) ? parsed : seed
}

function saveStore(key, list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(list))
  notifyTestConfigurationUpdated({ key })
}

function filterByQuery(list, q, keys) {
  const query = String(q || '').trim().toLowerCase()
  if (!query) return list
  return list.filter((row) => keys.some((k) => String(row[k] || '').toLowerCase().includes(query)))
}

function applyCommonFilters(rows, params, searchKeys) {
  let result = [...rows]
  result = filterByQuery(result, params.search, searchKeys)
  if (params.status && params.status !== 'all') {
    result = result.filter((r) => r.status === params.status)
  }
  if (params.examType && params.examType !== 'all') {
    result = result.filter((r) => r.examType === params.examType)
  }
  if (params.testType && params.testType !== 'all') {
    result = result.filter((r) => r.testType === params.testType)
  }
  if (params.sortBy === 'createdAt') {
    result.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }
  return result
}

function applyExamInstructionFilters(rows, params) {
  let result = filterByQuery(rows, params.search, ['id', 'instructionDescription', 'status'])
  if (params.status && params.status !== 'all') {
    result = result.filter((r) => r.status === params.status)
  }
  const sortBy = params.sortBy || 'createdOn'
  const sortDir = params.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const aVal = String(a[sortBy] || a.createdOn || '')
    const bVal = String(b[sortBy] || b.createdOn || '')
    return aVal.localeCompare(bVal) * sortDir
  })
  return result
}

function applySectionFilters(rows, params) {
  let result = filterByQuery(rows, params.search, ['id', 'sectionName', 'status'])
  if (params.status && params.status !== 'all') {
    result = result.filter((r) => r.status === params.status)
  }
  const sortBy = params.sortBy || 'createdOn'
  const sortDir = params.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const aVal = String(a[sortBy] || a.createdOn || a.createdAt || '')
    const bVal = String(b[sortBy] || b.createdOn || b.createdAt || '')
    return aVal.localeCompare(bVal) * sortDir
  })
  return result
}

async function fetchExamPatternsLocal(params = {}) {
  await delay()
  const rows = loadStore(KEYS.examPatterns, SEED_EXAM_PATTERNS)
  return applyExamInstructionFilters(rows, params)
}

async function upsertExamPatternLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadStore(KEYS.examPatterns, SEED_EXAM_PATTERNS)
  const now = new Date().toISOString().slice(0, 10)
  if (isEdit && id) {
    const next = list.map((row) =>
      String(row.id) === String(id)
        ? {
            ...row,
            ...payload,
            createdOn: row.createdOn || row.createdAt || now,
            modifiedOn: now,
          }
        : row,
    )
    saveStore(KEYS.examPatterns, next)
    return next.find((row) => String(row.id) === String(id))
  }
  const nextId = payload.id || `INS-${Math.floor(1000 + Math.random() * 8000)}`
  const row = {
    status: 'Active',
    createdOn: now,
    modifiedOn: now,
    ...payload,
    id: nextId,
  }
  saveStore(KEYS.examPatterns, [row, ...list])
  return row
}

async function deleteExamPatternLocal(id) {
  await delay()
  saveStore(
    KEYS.examPatterns,
    loadStore(KEYS.examPatterns, SEED_EXAM_PATTERNS).filter((row) => String(row.id) !== String(id)),
  )
}

function createCrudHandlers({ key, seed, idPrefix, searchKeys, defaultRow = {} }) {
  async function fetchLocal(params = {}) {
    await delay()
    const rows = loadStore(key, seed)
    return applyCommonFilters(rows, params, searchKeys)
  }

  async function upsertLocal(payload, { id, isEdit } = {}) {
    await delay()
    const list = loadStore(key, seed)
    const now = new Date().toISOString().slice(0, 10)
    if (isEdit && id) {
      const next = list.map((row) =>
        String(row.id) === String(id) ? { ...row, ...payload, createdAt: row.createdAt || now } : row,
      )
      saveStore(key, next)
      return next.find((row) => String(row.id) === String(id))
    }
    const nextId = payload.id || `${idPrefix}-${Math.floor(1000 + Math.random() * 8000)}`
    const row = { status: 'Active', createdAt: now, ...defaultRow, ...payload, id: nextId }
    saveStore(key, [row, ...list])
    return row
  }

  async function deleteLocal(id) {
    await delay()
    saveStore(
      key,
      loadStore(key, seed).filter((row) => String(row.id) !== String(id)),
    )
  }

  return { fetchLocal, upsertLocal, deleteLocal }
}

async function apiCall(method, path, { params, payload } = {}) {
  const { default: api } = await import('./axiosInstance')
  const config = { skipAuthRedirect: true, ...(params ? { params } : {}) }
  if (method === 'get') return api.get(path, config)
  if (method === 'post') return api.post(path, payload, config)
  if (method === 'put') return api.put(path, payload, config)
  if (method === 'delete') return api.delete(path, config)
  return null
}

function wrapApi(fetchLocal, upsertLocal, deleteLocal, basePath) {
  return {
    fetch: async (params = {}) => {
      if (isFrontendOnly) return fetchLocal(params)
      try {
        const response = await apiCall('get', basePath, { params })
        const body = response.data
        return Array.isArray(body) ? body : body?.data ?? []
      } catch {
        return fetchLocal(params)
      }
    },
    upsert: async (payload, meta) => {
      if (isFrontendOnly) return upsertLocal(payload, meta)
      try {
        if (meta?.isEdit && meta?.id) {
          const response = await apiCall('put', `${basePath}/${meta.id}`, { payload })
          return response.data?.data ?? response.data
        }
        const response = await apiCall('post', basePath, { payload })
        return response.data?.data ?? response.data
      } catch {
        return upsertLocal(payload, meta)
      }
    },
    remove: async (id) => {
      if (isFrontendOnly) return deleteLocal(id)
      try {
        await apiCall('delete', `${basePath}/${id}`)
      } catch {
        return deleteLocal(id)
      }
    },
  }
}

const examPatternApi = wrapApi(
  fetchExamPatternsLocal,
  upsertExamPatternLocal,
  deleteExamPatternLocal,
  '/test-management/exam-patterns',
)

function loadSectionStore() {
  purgeLegacySectionStorage()
  if (typeof window === 'undefined') return getSectionSeedRows()
  const key = KEYS.sectionConfigs
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    const seed = getSectionSeedRows()
    saveStore(key, seed)
    return seed
  }
  const parsed = safeJsonParse(raw, [])
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const seed = getSectionSeedRows()
    saveStore(key, seed)
    return seed
  }
  if (isLegacySectionStore(parsed)) {
    const seed = getSectionSeedRows()
    saveStore(key, seed)
    return seed
  }
  const normalized = normalizeSectionList(parsed)
  saveStore(key, normalized)
  return normalized
}

async function fetchSectionConfigsLocal(params = {}) {
  await delay()
  const rows = loadSectionStore()
  return applySectionFilters(rows, params)
}

async function upsertSectionConfigLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadSectionStore()
  const now = new Date().toISOString().slice(0, 10)
  const cleanPayload = {
    sectionName: String(payload.sectionName || '').trim(),
    status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
  }
  if (isEdit && id) {
    const next = list.map((row) =>
      String(row.id) === String(id)
        ? normalizeSectionRow({
            ...row,
            ...cleanPayload,
            createdOn: row.createdOn || now,
            modifiedOn: now,
          })
        : row,
    )
    saveStore(KEYS.sectionConfigs, next)
    return next.find((row) => String(row.id) === String(id))
  }
  const nextId = payload.id || `SEC-${Math.floor(1000 + Math.random() * 8000)}`
  const row = normalizeSectionRow({
    id: nextId,
    status: 'Active',
    createdOn: now,
    modifiedOn: now,
    ...cleanPayload,
  })
  saveStore(KEYS.sectionConfigs, [row, ...list])
  return row
}

async function deleteSectionConfigLocal(id) {
  await delay()
  saveStore(
    KEYS.sectionConfigs,
    loadSectionStore().filter((row) => String(row.id) !== String(id)),
  )
}

const markingRuleCrud = createCrudHandlers({
  key: KEYS.markingRules,
  seed: SEED_MARKING_RULES,
  idPrefix: 'MR',
  searchKeys: ['id', 'ruleName', 'status'],
})

function applyLanguageFilters(rows, params) {
  let result = filterByQuery(rows, params.search, ['id', 'languageName', 'status'])
  if (params.status && params.status !== 'all') {
    result = result.filter((r) => r.status === params.status)
  }
  const sortBy = params.sortBy || 'createdOn'
  const sortDir = params.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const aVal = String(a[sortBy] || a.createdOn || a.createdAt || '')
    const bVal = String(b[sortBy] || b.createdOn || b.createdAt || '')
    return aVal.localeCompare(bVal) * sortDir
  })
  return result
}

async function fetchLanguagesLocal(params = {}) {
  await delay()
  const rows = loadStore(KEYS.languages, SEED_LANGUAGES)
  return applyLanguageFilters(rows, params)
}

async function upsertLanguageLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadStore(KEYS.languages, SEED_LANGUAGES)
  const now = new Date().toISOString().slice(0, 10)
  const cleanPayload = {
    languageName: String(payload.languageName || '').trim(),
    status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
  }
  if (isEdit && id) {
    const next = list.map((row) =>
      String(row.id) === String(id)
        ? {
            ...row,
            ...cleanPayload,
            createdOn: row.createdOn || row.createdAt || now,
            modifiedOn: now,
          }
        : row,
    )
    saveStore(KEYS.languages, next)
    return next.find((row) => String(row.id) === String(id))
  }
  const nextId = payload.id || `LG-${Math.floor(1000 + Math.random() * 8000)}`
  const row = {
    id: nextId,
    status: 'Active',
    createdOn: now,
    modifiedOn: now,
    ...cleanPayload,
  }
  saveStore(KEYS.languages, [row, ...list])
  return row
}

async function deleteLanguageLocal(id) {
  await delay()
  saveStore(
    KEYS.languages,
    loadStore(KEYS.languages, SEED_LANGUAGES).filter((row) => String(row.id) !== String(id)),
  )
}

const sectionConfigApi = wrapApi(
  fetchSectionConfigsLocal,
  upsertSectionConfigLocal,
  deleteSectionConfigLocal,
  '/test-management/section-configs',
)

async function fetchSectionConfigs(params = {}) {
  const rows = await sectionConfigApi.fetch(params)
  return normalizeSectionList(rows)
}

async function upsertSectionConfig(payload, meta) {
  if (isFrontendOnly) {
    const saved = await upsertSectionConfigLocal(payload, meta)
    return normalizeSectionRow(saved)
  }
  try {
    if (meta?.isEdit && meta?.id) {
      const response = await apiCall('put', `/test-management/section-configs/${meta.id}`, { payload })
      notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
      return normalizeSectionRow(response.data?.data ?? response.data)
    }
    const response = await apiCall('post', '/test-management/section-configs', { payload })
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
    return normalizeSectionRow(response.data?.data ?? response.data)
  } catch (err) {
    const message = err?.response?.data?.message
    if (message) throw new Error(message)
    const saved = await upsertSectionConfigLocal(payload, meta)
    return normalizeSectionRow(saved)
  }
}

async function deleteSectionConfig(id) {
  if (isFrontendOnly) {
    await deleteSectionConfigLocal(id)
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
    return
  }
  try {
    await apiCall('delete', `/test-management/section-configs/${id}`)
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
  } catch {
    await deleteSectionConfigLocal(id)
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
  }
}
const markingRuleApi = wrapApi(
  markingRuleCrud.fetchLocal,
  markingRuleCrud.upsertLocal,
  markingRuleCrud.deleteLocal,
  '/test-management/marking-rules',
)
const languageApi = wrapApi(
  fetchLanguagesLocal,
  upsertLanguageLocal,
  deleteLanguageLocal,
  '/test-management/languages',
)

export async function fetchLanguages(params = {}) {
  return languageApi.fetch(params)
}

export async function upsertLanguage(payload, meta) {
  if (isFrontendOnly) return upsertLanguageLocal(payload, meta)
  try {
    if (meta?.isEdit && meta?.id) {
      const response = await apiCall('put', `/test-management/languages/${meta.id}`, { payload })
      const saved = response.data?.data ?? response.data
      notifyTestConfigurationUpdated({ entity: 'languages' })
      return saved
    }
    const response = await apiCall('post', '/test-management/languages', { payload })
    const saved = response.data?.data ?? response.data
    notifyTestConfigurationUpdated({ entity: 'languages' })
    return saved
  } catch (err) {
    const message = err?.response?.data?.message
    if (message) throw new Error(message)
    return upsertLanguageLocal(payload, meta)
  }
}

export async function deleteLanguage(id) {
  const result = await languageApi.remove(id)
  notifyTestConfigurationUpdated({ entity: 'languages' })
  return result
}

export async function fetchExamPatterns(params = {}) {
  return examPatternApi.fetch(params)
}

export async function upsertExamPattern(payload, meta) {
  if (isFrontendOnly) return upsertExamPatternLocal(payload, meta)
  try {
    if (meta?.isEdit && meta?.id) {
      const response = await apiCall('put', `/test-management/exam-patterns/${meta.id}`, { payload })
      const saved = response.data?.data ?? response.data
      notifyTestConfigurationUpdated({ entity: 'examPatterns' })
      return saved
    }
    const response = await apiCall('post', '/test-management/exam-patterns', { payload })
    const saved = response.data?.data ?? response.data
    notifyTestConfigurationUpdated({ entity: 'examPatterns' })
    return saved
  } catch (err) {
    const message = err?.response?.data?.message
    if (message) throw new Error(message)
    return upsertExamPatternLocal(payload, meta)
  }
}

export async function deleteExamPattern(id) {
  const result = await examPatternApi.remove(id)
  notifyTestConfigurationUpdated({ entity: 'examPatterns' })
  return result
}

export { fetchSectionConfigs, upsertSectionConfig, deleteSectionConfig }

export const fetchMarkingRules = markingRuleApi.fetch
export const upsertMarkingRule = markingRuleApi.upsert
export const deleteMarkingRule = markingRuleApi.remove

