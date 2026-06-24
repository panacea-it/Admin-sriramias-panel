export const TM_DASHBOARD_STATS = {
  totalCbtTests: 186,
  totalMainsTests: 42,
  totalSubjects: 5,
  totalFaculty: 5,
  studentsAttempted: 2847,
  avgPerformancePct: 68.4,
  pendingEvaluations: 23,
}

export const TM_RECENT_ACTIVITIES = [
  { id: 1, test: 'Historical Background Test Series', faculty: 'Polity - Narasimha', action: 'Results published', time: '12 min ago', status: 'Published' },
  { id: 2, test: 'President Test Series', faculty: 'Polity - Narasimha', action: '48 new attempts', time: '1 hr ago', status: 'Live' },
  { id: 3, test: 'Climate Change Test Series', faculty: 'Environment - Meghana', action: 'Evaluation pending', time: '2 hrs ago', status: 'Pending' },
  { id: 4, test: 'Budget 2026 Test Series', faculty: 'Economy - Arjun', action: 'Schedule updated', time: '4 hrs ago', status: 'Scheduled' },
  { id: 5, test: 'Medieval India Test Series', faculty: 'History - Nikita', action: 'Question paper locked', time: 'Yesterday', status: 'Draft' },
]

export const TM_FACULTY_PERFORMANCE = [
  { faculty: 'Narasimha', subject: 'Polity', avgScore: 72.1, tests: 24, participation: 892 },
  { faculty: 'Nikita', subject: 'History', avgScore: 65.8, tests: 18, participation: 654 },
  { faculty: 'Darshana', subject: 'Polity', avgScore: 70.4, tests: 20, participation: 721 },
  { faculty: 'Arjun', subject: 'Economy', avgScore: 63.2, tests: 15, participation: 412 },
  { faculty: 'Meghana', subject: 'Environment', avgScore: 69.5, tests: 12, participation: 368 },
]

export const TM_PARTICIPATION_TREND = [
  { month: 'Jan', attempts: 420 },
  { month: 'Feb', attempts: 510 },
  { month: 'Mar', attempts: 680 },
  { month: 'Apr', attempts: 720 },
  { month: 'May', attempts: 517 },
]

export const TM_TEST_TYPE_SPLIT = [
  { name: 'CBT', value: 186 },
  { name: 'Mains', value: 42 },
]
