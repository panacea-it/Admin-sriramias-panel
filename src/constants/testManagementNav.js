import { LayoutDashboard, Monitor, Database, ClipboardCheck, ScanLine, ListChecks } from 'lucide-react'
import { TEST_CONFIGURATION_SUBMENU } from './testConfigurationNav'

export const TEST_MANAGEMENT_BASE = '/test-management'

export const TEST_MANAGEMENT_ROUTES = {
  dashboard: `${TEST_MANAGEMENT_BASE}/dashboard`,
  cbt: `${TEST_MANAGEMENT_BASE}/cbt`,
  cbtTestsCreate: `${TEST_MANAGEMENT_BASE}/cbt/create`,
  cbtTestsEdit: (id) =>
    `${TEST_MANAGEMENT_BASE}/cbt/edit/${encodeURIComponent(String(id))}`,
  cbtTestsView: (id) =>
    `${TEST_MANAGEMENT_BASE}/cbt/view/${encodeURIComponent(String(id))}`,
  cbtTestQuestions: (id) =>
    `${TEST_MANAGEMENT_BASE}/cbt/${encodeURIComponent(String(id))}/questions`,
  cbtFaculty: (subjectId) => `${TEST_MANAGEMENT_BASE}/cbt/faculty/${encodeURIComponent(String(subjectId))}`,
  cbtResults: (subjectId, testItemId) =>
    `${TEST_MANAGEMENT_BASE}/cbt/faculty/${encodeURIComponent(String(subjectId))}/results/${encodeURIComponent(String(testItemId))}`,
  cbtTopic: (subjectId, topicId) =>
    `${TEST_MANAGEMENT_BASE}/cbt/faculty/${encodeURIComponent(String(subjectId))}/topic/${encodeURIComponent(String(topicId))}`,
  mains: `${TEST_MANAGEMENT_BASE}/mains`,
  mainsFaculty: (subjectId) =>
    `${TEST_MANAGEMENT_BASE}/mains/faculty/${encodeURIComponent(String(subjectId))}`,
  mainsTopic: (subjectId, topicId) =>
    `${TEST_MANAGEMENT_BASE}/mains/faculty/${encodeURIComponent(String(subjectId))}/topic/${encodeURIComponent(String(topicId))}`,
  mainsResults: (subjectId, topicId, testItemId) =>
    `${TEST_MANAGEMENT_BASE}/mains/faculty/${encodeURIComponent(String(subjectId))}/topic/${encodeURIComponent(String(topicId))}/results/${encodeURIComponent(String(testItemId))}`,
  questionBank: `${TEST_MANAGEMENT_BASE}/question-bank`,
  evaluations: `${TEST_MANAGEMENT_BASE}/evaluations`,
  evaluationWorkspace: (paperId) =>
    `${TEST_MANAGEMENT_BASE}/evaluations/workspace/${encodeURIComponent(String(paperId))}`,
  evaluationAssign: `${TEST_MANAGEMENT_BASE}/evaluations/assign`,
  analytics: `${TEST_MANAGEMENT_BASE}/analytics`,
  omr: `${TEST_MANAGEMENT_BASE}/omr`,
  omrCreate: `${TEST_MANAGEMENT_BASE}/omr/create`,
  omrEdit: (examId) =>
    `${TEST_MANAGEMENT_BASE}/omr/edit/${encodeURIComponent(String(examId))}`,
  omrUploadResults: (examId) =>
    `${TEST_MANAGEMENT_BASE}/omr/${encodeURIComponent(String(examId))}/upload-results`,
}

export const CBT_MANAGEMENT_SUBMENU = {
  id: 'test-management-cbt',
  label: 'CBT Management',
  children: [
    { label: 'CBT Tests', path: TEST_MANAGEMENT_ROUTES.cbt, icon: Monitor },
    {
      label: 'OMR',
      path: TEST_MANAGEMENT_ROUTES.omr,
      icon: ScanLine,
      permission: 'omr.view',
    },
  ],
}

export const MAINS_MANAGEMENT_SUBMENU = {
  id: 'test-management-mains',
  label: 'Mains Management',
  children: [
    {
      label: 'Mains Management',
      path: TEST_MANAGEMENT_ROUTES.mains,
      icon: ListChecks,
    },
    {
      label: 'Evaluation Oversight',
      path: TEST_MANAGEMENT_ROUTES.evaluations,
      icon: ClipboardCheck,
    },
  ],
}

export const TEST_MANAGEMENT_NAV_ITEMS = [
  { label: 'Dashboard', path: TEST_MANAGEMENT_ROUTES.dashboard, icon: LayoutDashboard },
  CBT_MANAGEMENT_SUBMENU,
  MAINS_MANAGEMENT_SUBMENU,
  { label: 'Question Bank', path: TEST_MANAGEMENT_ROUTES.questionBank, icon: Database },
  TEST_CONFIGURATION_SUBMENU,
]

export function isTestManagementPath(pathname) {
  return pathname === TEST_MANAGEMENT_BASE || pathname.startsWith(`${TEST_MANAGEMENT_BASE}/`)
}
