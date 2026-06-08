export const INITIAL_TESTS = [
  {
    id: 1,
    name: 'Prelims Full Length Test 01',
    type: 'Prelims',
    center: 'Delhi Center',
    totalQuestions: '100',
    duration: '120 min',
    scheduledAt: '2026-05-22',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Mains Essay Mock Test',
    type: 'Mains',
    center: 'Delhi Center',
    totalQuestions: '2',
    duration: '180 min',
    scheduledAt: '2026-05-25',
    status: 'Active',
  },
  {
    id: 3,
    name: 'CSAT Sectional — Quant',
    type: 'CSAT',
    center: 'Mumbai Center',
    totalQuestions: '50',
    duration: '60 min',
    scheduledAt: '2026-05-28',
    status: 'Draft',
  },
]

export const ACADEMIC_TEST_TYPES = [
  'Prelims',
  'Mains',
  'CSAT',
  'Mock Test',
  'Sectional Test',
  'Practice Test',
  'Custom Test',
]

/** @deprecated Use ACADEMIC_TEST_TYPES */
export const TEST_TYPES = ACADEMIC_TEST_TYPES

export const TEST_STATUSES = ['Draft', 'Scheduled', 'Active', 'Completed']

export const NEGATIVE_MARK_PRESETS = ['0.25', '0.50', '1.00']

export const TEST_CENTERS = [
  'Delhi Center',
  'Mumbai Center',
  'Bangalore Center',
  'Chennai Center',
]
