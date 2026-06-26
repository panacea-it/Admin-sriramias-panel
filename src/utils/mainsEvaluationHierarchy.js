import { CATEGORY_TYPES } from './facultySubjectHierarchy'
import { isMainsAnswerWritingCategory } from './subjectCategoryHelpers'
import { loadAcademicsSubjects } from './academicsSubjectsStorage'
import { loadSubjectContent } from './facultySubjectContentStorage'
import { deriveEvaluationStats } from './evaluationProgressMetrics'
import { MAINS_DEMO_FACULTY_ROWS } from '../data/mainsEvaluationHierarchySeed'
import { facultyNodeId, normalizeSubjectLabel } from './cbtTestSeriesHierarchy'

function buildTopicFromFolder(folder) {
  const tests = (folder.items || [])
    .filter((item) => item.itemType === CATEGORY_TYPES.MAINS_ANSWER_WRITING)
    .map((item) => ({
      id: item.id,
      title: item.title,
      uploadedDate: item.lastUpdated?.slice(0, 10) || '—',
      conductedAt: item.lastUpdated || new Date().toISOString(),
      evaluationStatus: item.status === 'published' ? 'Completed' : 'In Progress',
    }))

  return {
    id: folder.id,
    title: folder.folderName,
    testCount: tests.length,
    tests,
  }
}

function extractMainsTopicsFromContent(content) {
  const category = content?.categories?.find(
    (c) => c.categoryType === CATEGORY_TYPES.MAINS_ANSWER_WRITING,
  )
  if (!category?.folders?.length) return []

  return category.folders
    .filter((f) => !f.parentFolderId)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map(buildTopicFromFolder)
    .filter((t) => t.testCount > 0)
}

function buildFacultyRowFromSubject(subject) {
  const teacher = subject.teacher || subject.facultyName || 'Faculty'
  const content = loadSubjectContent(subject.id, subject)
  const topics = extractMainsTopicsFromContent(content)
  const totalTests = topics.reduce((s, t) => s + t.testCount, 0)
  if (!totalTests) return null

  let lastUpdated = content?.updatedAt || ''
  topics.forEach((topic) => {
    topic.tests.forEach((test) => {
      if (test.conductedAt > lastUpdated) lastUpdated = test.conductedAt
    })
  })

  return {
    id: facultyNodeId(subject.id, teacher),
    subjectId: String(subject.id),
    subjectName: normalizeSubjectLabel(subject.subjectName),
    subjectNameRaw: subject.subjectName,
    facultyName: teacher,
    totalTopics: topics.length,
    totalTests,
    lastUpdated: lastUpdated || null,
    topics,
    fromStorage: true,
  }
}

export function buildMainsFacultyRows() {
  const subjects = loadAcademicsSubjects()
  const fromStorage = subjects
    .filter((s) => isMainsAnswerWritingCategory(s.categories ?? s.category))
    .map(buildFacultyRowFromSubject)
    .filter(Boolean)

  const storageIds = new Set(fromStorage.map((r) => r.subjectId))
  const demoRows = MAINS_DEMO_FACULTY_ROWS.filter((r) => !storageIds.has(r.subjectId))

  return [...fromStorage, ...demoRows].sort((a, b) =>
    `${a.subjectName} ${a.facultyName}`.localeCompare(`${b.subjectName} ${b.facultyName}`),
  )
}

export function getMainsFacultyBySubjectId(subjectId) {
  return buildMainsFacultyRows().find((r) => String(r.subjectId) === String(subjectId)) || null
}

export function getMainsTopic(faculty, topicId) {
  if (!faculty?.topics) return null
  return faculty.topics.find((t) => String(t.id) === String(topicId)) || null
}

export function findMainsTest(faculty, testItemId) {
  if (!faculty?.topics) return null
  for (const topic of faculty.topics) {
    const test = topic.tests?.find((t) => String(t.id) === String(testItemId))
    if (test) return { test, topic }
  }
  return null
}

export function flattenMainsTests(facultyRows = []) {
  const flat = []
  facultyRows.forEach((faculty) => {
    faculty.topics?.forEach((topic) => {
      topic.tests?.forEach((test) => {
        const stats = deriveEvaluationStats(test.id)
        flat.push({
          id: test.id,
          testName: test.title,
          facultyLabel: `${faculty.subjectName} by ${faculty.facultyName}`,
          subjectId: faculty.subjectId,
          topicId: topic.id,
          topicTitle: topic.title,
          conductedAt: test.conductedAt,
          evaluationStatus: test.evaluationStatus,
          ...stats,
        })
      })
    })
  })
  return flat
}

export function buildLatestMainsEvaluationCards(limit = 3) {
  return flattenMainsTests(buildMainsFacultyRows())
    .sort((a, b) => new Date(b.conductedAt) - new Date(a.conductedAt))
    .slice(0, limit)
}

export function enrichMainsTestRow(test, faculty) {
  const stats = deriveEvaluationStats(test.id)
  const uploaded = stats.studentsUploaded ?? 0
  const evaluated = stats.studentsEvaluated ?? 0
  return {
    id: test.id,
    mainsAnswerWritingId: test.id,
    title: test.title,
    uploadedDate: test.uploadedDate || '—',
    studentsAssigned: stats.studentsAssigned ?? 0,
    studentsDownloaded: stats.pdfDownloads ?? 0,
    studentsUploaded: uploaded,
    studentsEvaluated: evaluated,
    pendingEvaluations: stats.pendingEvaluations ?? 0,
    evaluationStatusLabel: test.evaluationStatus || 'Not Started',
    evaluationPct: uploaded > 0 ? Math.round((evaluated / uploaded) * 100) : 0,
    facultyLabel: faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : '',
  }
}

export function findMainsTopicContext(topicId) {
  if (!topicId) return { faculty: null, topic: null }
  for (const faculty of buildMainsFacultyRows()) {
    const topic = getMainsTopic(faculty, topicId)
    if (topic) return { faculty, topic }
  }
  return { faculty: null, topic: null }
}

export function getMainsTestsForTopic(topicId) {
  const { faculty, topic } = findMainsTopicContext(topicId)
  if (!topic) {
    return { topic: null, tests: [] }
  }

  const tests = (topic.tests || []).map((test) => enrichMainsTestRow(test, faculty))

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      facultyLabel: faculty
        ? `${faculty.subjectName} — ${faculty.facultyName}`
        : '',
    },
    tests,
  }
}

export function mapMainsFacultySubjectsForTable() {
  return buildMainsFacultyRows().map((row) => ({
    subjectId: row.subjectId,
    facultySubjectCode: row.subjectId,
    subjectName: row.subjectName,
    facultyName: row.facultyName,
    totalTopics: row.totalTopics,
    totalTests: row.totalTests,
    lastUpdated: row.lastUpdated,
  }))
}
