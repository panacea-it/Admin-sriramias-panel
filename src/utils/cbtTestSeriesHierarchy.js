import { isTestSeriesCategory } from './subjectCategoryHelpers'
import { CATEGORY_TYPES } from './facultySubjectHierarchy'
import { loadAcademicsSubjects } from './academicsSubjectsStorage'
import { loadSubjectContent } from './facultySubjectContentStorage'
import { deriveEvaluationStats } from './evaluationProgressMetrics'

export function normalizeSubjectLabel(name = '') {
  const n = String(name).trim()
  if (/polity/i.test(n)) return 'Polity'
  if (/history/i.test(n)) return 'History'
  if (/geograph/i.test(n)) return 'Geography'
  if (/econom/i.test(n)) return 'Economy'
  if (/environment/i.test(n)) return 'Environment'
  return n || 'General'
}

export function facultyNodeId(subjectId, teacher) {
  return `fac-${subjectId}-${String(teacher || 'unknown').replace(/\s+/g, '-').toLowerCase()}`
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

function buildFolderTree(folders = [], parentId = null) {
  return folders
    .filter((f) => (f.parentFolderId ?? null) === parentId)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((folder) => {
      const childFolders = buildFolderTree(folders, folder.id)
      const testItems = (folder.items || [])
        .filter((item) => item.itemType === CATEGORY_TYPES.TEST_SERIES)
        .map((item) => ({
          id: item.id,
          type: 'testSeries',
          title: item.title,
          folderId: folder.id,
          testSeries: item.testSeries,
          status: item.status,
          lastUpdated: item.lastUpdated,
        }))
      return {
        id: folder.id,
        type: 'folder',
        title: folder.folderName,
        updatedAt: folder.updatedAt,
        children: [...childFolders, ...testItems],
      }
    })
}

export function extractTestSeriesTree(content) {
  const category = content?.categories?.find(
    (c) => c.categoryType === CATEGORY_TYPES.TEST_SERIES,
  )
  if (!category?.folders?.length) return []
  return buildFolderTree(category.folders)
}

export function countTestSeriesLeaves(nodes = []) {
  let count = 0
  for (const node of nodes) {
    if (node.type === 'testSeries') count += 1
    if (node.children?.length) count += countTestSeriesLeaves(node.children)
  }
  return count
}

function deriveRowMetrics(subjectId, facultyName, testSeriesCount) {
  if (!testSeriesCount) {
    return { studentsAttempted: 0, averageScorePct: 0 }
  }
  const seed = hashCode(`${subjectId}-${facultyName}`)
  return {
    studentsAttempted: 80 + (seed % 450) + testSeriesCount * 12,
    averageScorePct: 58 + (seed % 28),
  }
}

function getTestCategoryLastUpdated(content) {
  const testCat = content?.categories?.find(
    (c) => c.categoryType === CATEGORY_TYPES.TEST_SERIES,
  )
  let latest = content?.updatedAt || ''
  testCat?.folders?.forEach((folder) => {
    if (folder.updatedAt && folder.updatedAt > latest) latest = folder.updatedAt
    folder.items?.forEach((item) => {
      if (item.lastUpdated && item.lastUpdated > latest) latest = item.lastUpdated
    })
  })
  return latest || null
}

function buildFacultyRow(subject) {
  const teacher = subject.teacher || subject.facultyName || 'Faculty'
  const content = loadSubjectContent(subject.id, subject)
  const folders = extractTestSeriesTree(content)
  const totalTestSeries = countTestSeriesLeaves(folders)
  const totalTopics = folders.filter(
    (node) => node.type === 'folder' && countTestSeriesLeaves(node.children || []) > 0,
  ).length
  const metrics = deriveRowMetrics(subject.id, teacher, totalTestSeries)

  return {
    id: facultyNodeId(subject.id, teacher),
    subjectId: String(subject.id),
    subjectName: normalizeSubjectLabel(subject.subjectName),
    subjectNameRaw: subject.subjectName,
    facultyName: teacher,
    testCategory: 'TEST',
    totalTopics,
    totalTestSeries,
    studentsAttempted: metrics.studentsAttempted,
    averageScorePct: metrics.averageScorePct,
    lastUpdated: getTestCategoryLastUpdated(content),
    folders,
  }
}

/** Academic test mapping rows — one per faculty subject with TEST category enabled */
export function buildCbtMappingRows() {
  const subjects = loadAcademicsSubjects()
  const order = ['Polity', 'History', 'Geography', 'Economy', 'Environment']

  return subjects
    .filter((s) => isTestSeriesCategory(s.categories ?? s.category))
    .map(buildFacultyRow)
    .filter((row) => row.totalTestSeries > 0)
    .sort((a, b) => {
      const ai = order.indexOf(a.subjectName)
      const bi = order.indexOf(b.subjectName)
      if (ai !== bi) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
      return a.facultyName.localeCompare(b.facultyName)
    })
}

export function getCbtFacultyBySubjectId(subjectId) {
  const subjects = loadAcademicsSubjects()
  const subject = subjects.find((s) => String(s.id) === String(subjectId))
  if (!subject || !isTestSeriesCategory(subject.categories ?? subject.category)) {
    return null
  }
  const row = buildFacultyRow(subject)
  if (!row.totalTestSeries) return null
  return row
}

export function findTestSeriesInTree(nodes, testItemId) {
  for (const node of nodes || []) {
    if (node.id === testItemId && node.type === 'testSeries') {
      return node
    }
    if (node.children?.length) {
      const found = findTestSeriesInTree(node.children, testItemId)
      if (found) return found
    }
  }
  return null
}

/** @deprecated Explorer hierarchy — use buildCbtMappingRows */
export function buildCbtTestSeriesHierarchy() {
  const rows = buildCbtMappingRows()
  const groups = new Map()
  rows.forEach((row) => {
    if (!groups.has(row.subjectName)) {
      groups.set(row.subjectName, {
        id: `subject-${row.subjectName.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'subject',
        title: row.subjectName,
        faculties: [],
      })
    }
    groups.get(row.subjectName).faculties.push({
      id: row.id,
      type: 'faculty',
      title: `${row.subjectName} - ${row.facultyName}`,
      subjectId: row.subjectId,
      subjectName: row.subjectNameRaw,
      teacher: row.facultyName,
      folders: row.folders,
    })
  })
  return Array.from(groups.values())
}

export function findCbtTestSeriesLeaf(_hierarchy, leafId) {
  const rows = buildCbtMappingRows()
  for (const row of rows) {
    const leaf = findTestSeriesInTree(row.folders, leafId)
    if (leaf) {
      return {
        path: [],
        leaf,
        faculty: row,
      }
    }
  }
  return { path: [], leaf: null, faculty: null }
}

/** Top-level folders in TEST tree act as topics for admin navigation. */
export function getCbtTopics(faculty) {
  if (!faculty?.folders?.length) return []
  return faculty.folders
    .filter((node) => node.type === 'folder')
    .map((folder) => ({
      id: folder.id,
      title: folder.title,
      testCount: countTestSeriesLeaves(folder.children || []),
      updatedAt: folder.updatedAt,
      children: folder.children || [],
    }))
    .filter((t) => t.testCount > 0)
}

export function getCbtTopic(faculty, topicId) {
  return getCbtTopics(faculty).find((t) => String(t.id) === String(topicId)) || null
}

export function flattenCbtTestLeaves(faculty) {
  const leaves = []
  const walk = (nodes, topicId, topicTitle) => {
    for (const node of nodes || []) {
      if (node.type === 'testSeries') {
        const stats = deriveEvaluationStats(node.id)
        leaves.push({
          id: node.id,
          testName: node.title,
          topicId,
          topicTitle,
          conductedAt: node.lastUpdated || faculty?.lastUpdated || new Date().toISOString(),
          evaluationStatus: node.status === 'published' ? 'Completed' : 'In Progress',
          ...stats,
        })
      }
      if (node.children?.length) {
        walk(
          node.children,
          node.type === 'folder' ? node.id : topicId,
          node.type === 'folder' ? node.title : topicTitle,
        )
      }
    }
  }
  getCbtTopics(faculty).forEach((topic) => walk(topic.children, topic.id, topic.title))
  return leaves
}

export function buildLatestCbtEvaluationCards(limit = 3) {
  const all = []
  buildCbtMappingRows().forEach((faculty) => {
    flattenCbtTestLeaves(faculty).forEach((test) => {
      all.push({
        ...test,
        subjectId: faculty.subjectId,
        facultyLabel: `${faculty.subjectName} by ${faculty.facultyName}`,
      })
    })
  })
  return all.sort((a, b) => new Date(b.conductedAt) - new Date(a.conductedAt)).slice(0, limit)
}

export function enrichCbtTestRow(testNode, faculty) {
  const stats = deriveEvaluationStats(testNode.id)
  return {
    id: testNode.id,
    title: testNode.title,
    uploadedDate: testNode.lastUpdated?.slice(0, 10) || '—',
    evaluationStatus: testNode.status === 'published' ? 'Completed' : 'In Progress',
    ...stats,
    facultyLabel: faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : '',
  }
}

export function findCbtTopicContext(topicId) {
  if (!topicId) return { faculty: null, topic: null }
  for (const faculty of buildCbtMappingRows()) {
    const topic = getCbtTopic(faculty, topicId)
    if (topic) return { faculty, topic }
  }
  return { faculty: null, topic: null }
}

export function getCbtTestsForTopic(topicId) {
  const { faculty, topic } = findCbtTopicContext(topicId)
  if (!topic) {
    return { topic: null, tests: [] }
  }

  const tests = (topic.children || [])
    .filter((node) => node.type === 'testSeries')
    .map((node) => enrichCbtTestRow(node, faculty))

  return {
    topic: {
      topicId: topic.id,
      topicName: topic.title,
      folderId: topic.id,
      facultySubjectName: faculty
        ? `${faculty.subjectName} — ${faculty.facultyName}`
        : '',
    },
    tests,
  }
}

export function mapCbtFacultySubjectsForTable() {
  return buildCbtMappingRows().map((row) => ({
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    facultyName: row.facultyName,
    facultySubjectLabel: `${row.subjectName} — ${row.facultyName}`,
    totalTopics: row.totalTopics,
    totalTestSeries: row.totalTestSeries,
    studentsAttempted: row.studentsAttempted,
    averageScorePct: row.averageScorePct,
    lastUpdated: row.lastUpdated,
  }))
}
