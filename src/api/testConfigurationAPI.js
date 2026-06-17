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

function wrapApi(_fetchLocal, upsertLocal, deleteLocal, basePath, { localOnly = false } = {}) {
  return {
    fetch: async (params = {}) => {
      if (localOnly) return _fetchLocal(params)
      try {
        const response = await apiCall('get', basePath, { params })
        const body = response.data
        return Array.isArray(body) ? body : body?.data ?? []
      } catch (err) {
        throw new Error(err?.response?.data?.message || err?.message || 'Failed to load data')
      }
    },
    upsert: async (payload, meta) => {
      if (localOnly) return upsertLocal(payload, meta)
      try {
        if (meta?.isEdit && meta?.id) {
          const response = await apiCall('put', `${basePath}/${meta.id}`, { payload })
          return response.data?.data ?? response.data
        }
        const response = await apiCall('post', basePath, { payload })
        return response.data?.data ?? response.data
      } catch (err) {
        throw new Error(err?.response?.data?.message || err?.message || 'Failed to save')
      }
    },
    remove: async (id) => {
      if (localOnly) return deleteLocal(id)
      try {
        await apiCall('delete', `${basePath}/${id}`)
      } catch (err) {
        throw new Error(err?.response?.data?.message || err?.message || 'Failed to delete')
      }
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Real Test Configuration API (backend: /api/test-configuration/*)          */
/* -------------------------------------------------------------------------- */

const EXAM_PATTERN_PATH = '/test-configuration/exam-patterns'
const SECTION_PATH = '/test-configuration/sections'
const LANGUAGE_PATH = '/test-configuration/languages'

function uiStatusToApi(status) {
  const raw = String(status || '').toLowerCase()
  if (raw === 'inactive') return 'INACTIVE'
  if (raw === 'active') return 'ACTIVE'
  return undefined
}

function apiStatusToUi(status) {
  return String(status || '').toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active'
}

function friendlyDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildListQuery(params = {}, sortPreset) {
  const query = { page: 1, limit: 100 }
  const search = String(params.search || '').trim()
  if (search) query.search = search
  const status = uiStatusToApi(params.status)
  if (status) query.status = status
  if (sortPreset) query.sortPreset = sortPreset
  return query
}

function presetFromSort(sortBy, sortDir, nameField) {
  const dir = sortDir === 'asc' ? 'asc' : 'desc'
  if (nameField && sortBy === nameField) {
    return dir === 'asc' ? `${nameField}_az` : `${nameField}_za`
  }
  if (sortBy === 'modifiedOn' || sortBy === 'updatedAt') {
    return dir === 'asc' ? 'modifiedOn_oldest' : 'modifiedOn_newest'
  }
  return dir === 'asc' ? 'createdOn_oldest' : 'createdOn_newest'
}

function mapApiExamPattern(row) {
  if (!row || typeof row !== 'object') return null
  const mongoId = row._id ?? row.id
  const instructionId = row.instructionId ?? ''
  if (!mongoId && !instructionId) return null
  return {
    id: String(mongoId ?? instructionId),
    instructionId: String(instructionId || mongoId),
    instructionDescription: String(row.instructionDescription ?? row.instructions ?? '').trim(),
    status: apiStatusToUi(row.status),
    createdOn: friendlyDate(row.createdAt || row.createdOn),
    modifiedOn: friendlyDate(row.updatedAt || row.modifiedOn || row.createdAt || row.createdOn),
  }
}

function mapApiSection(row) {
  if (!row || typeof row !== 'object') return null
  const mongoId = row._id ?? row.id
  const sectionId = row.sectionId ?? ''
  if (!mongoId && !sectionId) return null
  return {
    id: String(mongoId ?? sectionId),
    sectionId: String(sectionId || mongoId),
    sectionName: String(row.sectionName ?? row.configurationName ?? '').trim(),
    status: apiStatusToUi(row.status),
    createdOn: friendlyDate(row.createdAt || row.createdOn),
    modifiedOn: friendlyDate(row.updatedAt || row.modifiedOn || row.createdAt || row.createdOn),
  }
}

function mapApiLanguage(row) {
  if (!row || typeof row !== 'object') return null
  const mongoId = row._id ?? row.id
  const languageId = row.languageId ?? ''
  if (!mongoId && !languageId) return null
  return {
    id: String(mongoId ?? languageId),
    languageId: String(languageId || mongoId),
    languageName: String(row.languageName ?? row.language ?? '').trim(),
    status: apiStatusToUi(row.status),
    createdOn: friendlyDate(row.createdAt || row.createdOn),
    modifiedOn: friendlyDate(row.updatedAt || row.modifiedOn || row.createdAt || row.createdOn),
  }
}

async function fetchListFromApi(basePath, params, sortPreset, mapper) {
  const response = await apiCall('get', basePath, { params: buildListQuery(params, sortPreset) })
  const body = response.data
  const arr = Array.isArray(body) ? body : body?.data ?? []
  return (Array.isArray(arr) ? arr : []).map(mapper).filter(Boolean)
}

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
  // Read path only — persisting here fired TEST_CONFIG_UPDATED on every API
  // fallback and caused useTestConfigurationMaster to reload in a tight loop (429 storms).
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

async function fetchSectionConfigs(params = {}) {
  try {
    const preset = presetFromSort(params.sortBy, params.sortDir, 'sectionName')
    return await fetchListFromApi(SECTION_PATH, params, preset, mapApiSection)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to load sections')
  }
}

async function upsertSectionConfig(payload, meta) {
  const body = {
    sectionName: String(payload.sectionName || '').trim(),
    status: uiStatusToApi(payload.status) || 'ACTIVE',
  }
  try {
    const response =
      meta?.isEdit && meta?.id
        ? await apiCall('put', `${SECTION_PATH}/${meta.id}`, { payload: body })
        : await apiCall('post', SECTION_PATH, { payload: body })
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
    return mapApiSection(response.data?.data ?? response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to save section')
  }
}

async function deleteSectionConfig(id) {
  try {
    await apiCall('delete', `${SECTION_PATH}/${id}`)
    notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to delete section')
  }
}
const markingRuleApi = wrapApi(
  markingRuleCrud.fetchLocal,
  markingRuleCrud.upsertLocal,
  markingRuleCrud.deleteLocal,
  '/test-management/marking-rules',
  { localOnly: true },
)
export async function fetchLanguages(params = {}) {
  try {
    const preset = presetFromSort(params.sortBy, params.sortDir, 'languageName')
    return await fetchListFromApi(LANGUAGE_PATH, params, preset, mapApiLanguage)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to load languages')
  }
}

export async function upsertLanguage(payload, meta) {
  const body = {
    languageName: String(payload.languageName || '').trim(),
    status: uiStatusToApi(payload.status) || 'ACTIVE',
  }
  try {
    const response =
      meta?.isEdit && meta?.id
        ? await apiCall('put', `${LANGUAGE_PATH}/${meta.id}`, { payload: body })
        : await apiCall('post', LANGUAGE_PATH, { payload: body })
    notifyTestConfigurationUpdated({ entity: 'languages' })
    return mapApiLanguage(response.data?.data ?? response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to save language')
  }
}

export async function deleteLanguage(id) {
  try {
    await apiCall('delete', `${LANGUAGE_PATH}/${id}`)
    notifyTestConfigurationUpdated({ entity: 'languages' })
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to delete language')
  }
}

export async function fetchExamPatterns(params = {}) {
  try {
    const preset = presetFromSort(params.sortBy, params.sortDir, null)
    return await fetchListFromApi(EXAM_PATTERN_PATH, params, preset, mapApiExamPattern)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to load exam patterns')
  }
}

export async function upsertExamPattern(payload, meta) {
  const body = {
    instructionDescription: String(payload.instructionDescription || '').trim(),
    status: uiStatusToApi(payload.status) || 'ACTIVE',
  }
  try {
    const response =
      meta?.isEdit && meta?.id
        ? await apiCall('put', `${EXAM_PATTERN_PATH}/${meta.id}`, { payload: body })
        : await apiCall('post', EXAM_PATTERN_PATH, { payload: body })
    notifyTestConfigurationUpdated({ entity: 'examPatterns' })
    return mapApiExamPattern(response.data?.data ?? response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to save exam instruction')
  }
}

export async function deleteExamPattern(id) {
  try {
    await apiCall('delete', `${EXAM_PATTERN_PATH}/${id}`)
    notifyTestConfigurationUpdated({ entity: 'examPatterns' })
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to delete exam instruction')
  }
}

export { fetchSectionConfigs, upsertSectionConfig, deleteSectionConfig }

export const fetchMarkingRules = markingRuleApi.fetch
export const upsertMarkingRule = markingRuleApi.upsert
export const deleteMarkingRule = markingRuleApi.remove

/** Local-only helpers — used by marking rules (no backend API yet). */
export {
  fetchExamPatternsLocal,
  upsertExamPatternLocal,
  deleteExamPatternLocal,
  fetchSectionConfigsLocal,
  upsertSectionConfigLocal,
  deleteSectionConfigLocal,
  fetchLanguagesLocal,
  upsertLanguageLocal,
  deleteLanguageLocal,
}

