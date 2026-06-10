import { ClipboardList, Layers, Globe } from 'lucide-react'

export const TEST_CONFIGURATION_BASE = '/test-management/test-configuration'

export const TEST_CONFIGURATION_ROUTES = {
  base: TEST_CONFIGURATION_BASE,
  examPattern: `${TEST_CONFIGURATION_BASE}/exam-pattern`,
  sectionManagement: `${TEST_CONFIGURATION_BASE}/section-management`,
  markingRules: `${TEST_CONFIGURATION_BASE}/marking-rules`,
  languageSettings: `${TEST_CONFIGURATION_BASE}/language-settings`,
  difficultyLevels: `${TEST_CONFIGURATION_BASE}/difficulty-levels`,
  questionTags: `${TEST_CONFIGURATION_BASE}/question-tags`,
  examTemplates: `${TEST_CONFIGURATION_BASE}/exam-templates`,
  durationRules: `${TEST_CONFIGURATION_BASE}/duration-rules`,
}

export const TEST_CONFIGURATION_NAV_ITEMS = [
  {
    id: 'exam-pattern',
    label: 'Exam Pattern',
    path: TEST_CONFIGURATION_ROUTES.examPattern,
    icon: ClipboardList,
  },
  {
    id: 'section-management',
    label: 'Section Management',
    path: TEST_CONFIGURATION_ROUTES.sectionManagement,
    icon: Layers,
  },
  {
    id: 'language-settings',
    label: 'Language Settings',
    path: TEST_CONFIGURATION_ROUTES.languageSettings,
    icon: Globe,
  },
]

export const TEST_CONFIGURATION_SUBMENU = {
  id: 'test-management-configuration',
  label: 'Test Configuration',
  children: TEST_CONFIGURATION_NAV_ITEMS.map(({ label, path, icon }) => ({
    label,
    path,
    icon,
  })),
}

export function isTestConfigurationPath(pathname) {
  return (
    pathname === TEST_CONFIGURATION_BASE || pathname.startsWith(`${TEST_CONFIGURATION_BASE}/`)
  )
}
