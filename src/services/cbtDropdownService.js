import {
  buildCbtMappingRows,
  getCbtFacultyBySubjectId,
  getCbtTopics,
} from '../utils/cbtTestSeriesHierarchy'
import { SEED_EXAM_PATTERNS, SEED_LANGUAGES } from '../data/testConfigurationSeed'
import {
  CBT_CREATE_FORM_ENUMS,
  CBT_DROPDOWN_BATCHES,
  CBT_DROPDOWN_LANGUAGES,
} from '../data/cbtPrelimsTestsSeed'

const DELAY_MS = 120

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function facultySubjectOptions() {
  return buildCbtMappingRows().map((row) => ({
    value: row.subjectId,
    label: `${row.subjectName} — ${row.facultyName}`,
  }))
}

export const cbtDropdownService = {
  async facultySubjects(search = '') {
    await delay()
    const q = String(search || '').trim().toLowerCase()
    let items = facultySubjectOptions()
    if (q) {
      items = items.filter((item) => item.label.toLowerCase().includes(q))
    }
    return { data: items }
  },

  async folders(facultySubjectId, search = '') {
    await delay()
    const faculty = getCbtFacultyBySubjectId(facultySubjectId)
    if (!faculty) return { data: [] }
    const q = String(search || '').trim().toLowerCase()
    let items = getCbtTopics(faculty).map((topic) => ({
      value: topic.id,
      label: topic.title,
    }))
    if (q) items = items.filter((item) => item.label.toLowerCase().includes(q))
    return { data: items }
  },

  async batches(_facultySubjectId) {
    await delay()
    return { data: CBT_DROPDOWN_BATCHES }
  },

  async languages() {
    await delay()
    const items =
      SEED_LANGUAGES.length > 0
        ? SEED_LANGUAGES.filter((lang) => lang.status === 'Active').map((lang) => ({
            value: lang.code || lang.id,
            label: lang.name,
          }))
        : CBT_DROPDOWN_LANGUAGES
    return { data: items }
  },

  async examPatterns() {
    await delay()
    return {
      data: SEED_EXAM_PATTERNS.filter((row) => row.status === 'Active').map((row) => ({
        value: row.id,
        label: row.instructionDescription?.slice(0, 48) || row.id,
      })),
    }
  },
}

export default cbtDropdownService
