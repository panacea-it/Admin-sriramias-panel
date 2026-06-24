/** Evaluation Oversight — batches, filters, papers, mentors */

export const OVERSIGHT_STATUSES = ['Evaluated', 'In Progress', 'Not Started', 'Pending', 'Overdue']
export const OVERSIGHT_PRIORITIES = ['Urgent', 'High', 'Normal', 'Low']
export const OVERSIGHT_EXAM_TYPES = ['Mains', 'CBT', 'Descriptive']

export const SEED_OVERSIGHT_BATCHES = [
  { id: 'BATCH-2024-A', label: 'Batch 2024-A' },
  { id: 'BATCH-2023-FALL', label: '2023 Fall - Computer Science' },
  { id: 'BATCH-2025-UPSC', label: 'UPSC Foundation 2026' },
  { id: 'BATCH-2024-B', label: 'Batch 2024-B' },
  { id: 'BATCH-GATE-25', label: 'GATE 2025 — Mechanical' },
  { id: 'BATCH-NEET-24', label: 'NEET Repeater 2024' },
]

export const SEED_OVERSIGHT_PROGRAMS = [
  { id: 'PROG-UPSC', label: 'UPSC Civil Services' },
  { id: 'PROG-GATE', label: 'GATE Engineering' },
  { id: 'PROG-NEET', label: 'NEET Medical' },
  { id: 'PROG-CS', label: 'Computer Science Degree' },
  { id: 'PROG-ALL', label: 'All Programs' },
]

export const SEED_OVERSIGHT_CENTERS = [
  { id: 'CTR-DELHI', label: 'Delhi — Rajendra Place' },
  { id: 'CTR-MUMBAI', label: 'Mumbai — Andheri' },
  { id: 'CTR-BLR', label: 'Bangalore — Koramangala' },
  { id: 'CTR-HYD', label: 'Hyderabad — Gachibowli' },
  { id: 'CTR-CHN', label: 'Chennai — Anna Nagar' },
  { id: 'CTR-ONLINE', label: 'Online / Remote' },
]

export const SEED_OVERSIGHT_SUBJECTS = [
  { id: 'SUB-MATH', label: 'Advanced Mathematics', batchIds: ['BATCH-2024-A', 'BATCH-2025-UPSC', 'BATCH-GATE-25'], programId: 'PROG-GATE' },
  { id: 'SUB-CS402', label: 'CS402: Distributed Systems', batchIds: ['BATCH-2023-FALL'], programId: 'PROG-CS' },
  { id: 'SUB-POLITY', label: 'GS-2 Polity & Governance', batchIds: ['BATCH-2025-UPSC'], programId: 'PROG-UPSC' },
  { id: 'SUB-ETHICS', label: 'Ethics & Integrity', batchIds: ['BATCH-2025-UPSC'], programId: 'PROG-UPSC' },
  { id: 'SUB-GEO', label: 'Geography — Physical & Human', batchIds: ['BATCH-2025-UPSC', 'BATCH-2024-B'], programId: 'PROG-UPSC' },
  { id: 'SUB-PHY', label: 'Physics — Mechanics', batchIds: ['BATCH-NEET-24', 'BATCH-GATE-25'], programId: 'PROG-NEET' },
  { id: 'SUB-ENG', label: 'English Essay Writing', batchIds: ['BATCH-2024-A', 'BATCH-2024-B'], programId: 'PROG-UPSC' },
]

export const SEED_OVERSIGHT_SUBTOPICS = [
  { id: 'ST-ALL', label: 'All Sub-topics', subjectId: 'SUB-MATH' },
  { id: 'ST-CALC', label: 'Calculus', subjectId: 'SUB-MATH' },
  { id: 'ST-ALG', label: 'Linear Algebra', subjectId: 'SUB-MATH' },
  { id: 'ST-ALL-CS', label: 'All Sub-topics', subjectId: 'SUB-CS402' },
  { id: 'ST-DIST', label: 'Distributed Consensus', subjectId: 'SUB-CS402' },
  { id: 'ST-ALL-POL', label: 'All Sub-topics', subjectId: 'SUB-POLITY' },
  { id: 'ST-ALL-ETH', label: 'All Sub-topics', subjectId: 'SUB-ETHICS' },
  { id: 'ST-CLIMATE', label: 'Climate & Environment', subjectId: 'SUB-GEO' },
  { id: 'ST-MECH', label: 'Classical Mechanics', subjectId: 'SUB-PHY' },
  { id: 'ST-ESSAY', label: 'Essay Structure', subjectId: 'SUB-ENG' },
]

export const SEED_OVERSIGHT_TESTS = [
  {
    id: 'TST-MID-MATH',
    label: 'Mid-Term Assessment',
    subjectId: 'SUB-MATH',
    batchIds: ['BATCH-2024-A', 'BATCH-2024-B'],
    examType: 'Descriptive',
    maxMarks: 100,
    questionText:
      'Analyze the impact of digital transformation on rural administrative structures in India.',
    questionMarks: 15,
  },
  {
    id: 'TST-FINAL-MATH',
    label: 'Final Assessment',
    subjectId: 'SUB-MATH',
    batchIds: ['BATCH-2024-A', 'BATCH-2025-UPSC', 'BATCH-GATE-25'],
    examType: 'Mains',
    maxMarks: 100,
    questionText: 'Evaluate the role of technology in modern governance frameworks.',
    questionMarks: 20,
  },
  {
    id: 'TST-MID-CS',
    label: 'Mid-Term Mains Assessment 2023',
    subjectId: 'SUB-CS402',
    batchIds: ['BATCH-2023-FALL'],
    examType: 'Mains',
    maxMarks: 100,
    questionText: 'Discuss CAP theorem trade-offs in large-scale distributed databases.',
    questionMarks: 15,
  },
  {
    id: 'TST-GS2-01',
    label: 'GS-2 Mains Test 01',
    subjectId: 'SUB-POLITY',
    batchIds: ['BATCH-2025-UPSC'],
    examType: 'Mains',
    maxMarks: 250,
    questionText: 'Examine the federal structure and cooperative federalism in India.',
    questionMarks: 15,
  },
  {
    id: 'TST-ETH-03',
    label: 'Ethics Test 03',
    subjectId: 'SUB-ETHICS',
    batchIds: ['BATCH-2025-UPSC'],
    examType: 'Mains',
    maxMarks: 250,
    questionText: 'Case study: ethical dilemmas in public administration.',
    questionMarks: 20,
  },
  {
    id: 'TST-CBT-MATH-01',
    label: 'CBT Practice Test — Set A',
    subjectId: 'SUB-MATH',
    batchIds: ['BATCH-GATE-25', 'BATCH-2024-A'],
    examType: 'CBT',
    maxMarks: 100,
    questionText: 'MCQ section + short descriptive follow-up.',
    questionMarks: 10,
  },
  {
    id: 'TST-GEO-MOCK',
    label: 'Geography Mock Mains',
    subjectId: 'SUB-GEO',
    batchIds: ['BATCH-2025-UPSC', 'BATCH-2024-B'],
    examType: 'Mains',
    maxMarks: 250,
    questionText: 'Discuss monsoon variability and agricultural policy in India.',
    questionMarks: 15,
  },
  {
    id: 'TST-PHY-UNIT',
    label: 'Physics Unit Test 2',
    subjectId: 'SUB-PHY',
    batchIds: ['BATCH-NEET-24'],
    examType: 'CBT',
    maxMarks: 180,
    questionText: 'Problems on rotational dynamics and conservation laws.',
    questionMarks: 25,
  },
  {
    id: 'TST-ENG-ESSAY',
    label: 'Essay Writing — Test 4',
    subjectId: 'SUB-ENG',
    batchIds: ['BATCH-2024-A', 'BATCH-2024-B'],
    examType: 'Descriptive',
    maxMarks: 100,
    questionText: 'The future of federalism in a digital India.',
    questionMarks: 20,
  },
]

export const SEED_OVERSIGHT_MENTORS = [
  { id: 'MEN-001', name: 'Dr. Sarah Chen', subjectIds: ['SUB-MATH'], title: 'Associate Professor', available: true, pendingCount: 18 },
  { id: 'MEN-002', name: 'Prof. James Wilson', subjectIds: ['SUB-MATH'], title: 'Professor', available: true, pendingCount: 24 },
  { id: 'MEN-003', name: 'Dr. Marcus Vance', subjectIds: ['SUB-MATH'], title: 'Senior Faculty', available: true, pendingCount: 12 },
  { id: 'MEN-004', name: 'Prof. Aris Thorne', subjectIds: ['SUB-CS402'], title: 'Associate Professor, CS', available: true, pendingCount: 42 },
  { id: 'MEN-005', name: 'Dr. Elena Rodriguez', subjectIds: ['SUB-CS402'], title: 'Assistant Professor', available: false, pendingCount: 12 },
  { id: 'MEN-006', name: 'Dr. R. Narayanan', subjectIds: ['SUB-POLITY'], title: 'Polity Expert', available: true, pendingCount: 31 },
  { id: 'MEN-007', name: 'Mr. K. Mehta', subjectIds: ['SUB-ETHICS'], title: 'Ethics Mentor', available: true, pendingCount: 9 },
  { id: 'MEN-008', name: 'Ms. A. Chatterjee', subjectIds: ['SUB-GEO', 'SUB-POLITY'], title: 'Geography & GS', available: true, pendingCount: 22 },
  { id: 'MEN-009', name: 'Dr. Vikram Desai', subjectIds: ['SUB-PHY'], title: 'Physics Faculty', available: true, pendingCount: 15 },
  { id: 'MEN-010', name: 'Prof. Linda Hayes', subjectIds: ['SUB-ENG'], title: 'English & Essay', available: true, pendingCount: 8 },
]

export const DEFAULT_WORKSPACE_RUBRIC = [
  {
    key: 'conceptual',
    label: 'Conceptual Clarity',
    max: 10,
    score: 0,
    feedback: '',
    remarksLabel: 'Section Remarks',
    placeholder: 'Specific feedback on concepts...',
  },
  {
    key: 'language',
    label: 'Language & Tone',
    max: 5,
    score: 0,
    feedback: '',
    remarksLabel: 'Grammar & Syntax notes',
    placeholder: 'Feedback on language...',
  },
  {
    key: 'structure',
    label: 'Structure',
    max: 5,
    score: 0,
    feedback: '',
    remarksLabel: 'Flow & Continuity',
    placeholder: 'Feedback on logical flow...',
  },
]

function mentorInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function buildPaper(partial) {
  const mentor = partial.mentorId
    ? SEED_OVERSIGHT_MENTORS.find((m) => m.id === partial.mentorId)
    : null
  const test = SEED_OVERSIGHT_TESTS.find((t) => t.id === partial.testId)
  const subject = SEED_OVERSIGHT_SUBJECTS.find((s) => s.id === partial.subjectId)
  const center = SEED_OVERSIGHT_CENTERS.find((c) => c.id === partial.centerId)
  const program = SEED_OVERSIGHT_PROGRAMS.find((p) => p.id === partial.programId)
  const max = test?.maxMarks ?? partial.scoreMax ?? 100
  const status = partial.status || 'Not Started'
  let scoreDisplay = partial.scoreDisplay
  if (!scoreDisplay) {
    if (status === 'Evaluated' && partial.scoreObtained != null) {
      scoreDisplay = `${partial.scoreObtained}/${max}`
    } else if (status === 'In Progress' || status === 'Overdue') {
      scoreDisplay = 'Pending'
    } else {
      scoreDisplay = '--'
    }
  }
  return {
    rubric: DEFAULT_WORKSPACE_RUBRIC.map((r) => ({ ...r })),
    annotations: [],
    answerSheet: { fileName: null, url: null, dataUrl: null, pages: 12, pageImages: [] },
    locked: false,
    remarks: '',
    internalComments: '',
    highlightNotes: '',
    priority: 'Normal',
    examType: test?.examType || 'Mains',
    programId: subject?.programId || 'PROG-UPSC',
    programName: program?.label || 'UPSC Civil Services',
    centerId: 'CTR-DELHI',
    centerName: 'Delhi — Rajendra Place',
    ...partial,
    mentorName: mentor?.name ?? partial.mentorName ?? null,
    mentorInitials: mentor ? mentorInitials(mentor.name) : partial.mentorInitials ?? null,
    mentorAvailable: mentor?.available ?? true,
    scoreMax: max,
    scoreDisplay,
    updatedAt: partial.updatedAt || '2026-05-28 10:00',
    createdAt: partial.createdAt || '2026-05-26 09:00',
  }
}

const FIRST_NAMES = [
  'Arjun', 'Priya', 'David', 'Michael', 'Sneha', 'Rahul', 'Ananya', 'Mohit', 'Kavya', 'Vikram',
  'Emma', 'James', 'Aisha', 'Rohan', 'Ishita', 'Aditya', 'Neha', 'Karan', 'Divya', 'Arnav',
  'Meera', 'Sanjay', 'Pooja', 'Nikhil', 'Tanvi', 'Varun', 'Shreya', 'Aman', 'Ritu', 'Kunal',
]
const LAST_NAMES = [
  'Malhotra', 'Sharma', 'Thompson', 'Chen', 'Kapoor', 'Verma', 'Iyer', 'Singh', 'Nair', 'Patel',
  'Wilson', 'Rodriguez', 'Khan', 'Gupta', 'Reddy', 'Joshi', 'Menon', 'Das', 'Pillai', 'Bose',
]

function generateBulkPapers(count = 55) {
  const statuses = OVERSIGHT_STATUSES
  const priorities = OVERSIGHT_PRIORITIES
  const papers = []
  const batches = SEED_OVERSIGHT_BATCHES
  const subjects = SEED_OVERSIGHT_SUBJECTS
  const centers = SEED_OVERSIGHT_CENTERS
  const mentors = SEED_OVERSIGHT_MENTORS

  for (let i = 0; i < count; i++) {
    const batch = batches[i % batches.length]
    const subject = subjects[i % subjects.length]
    const subTopics = SEED_OVERSIGHT_SUBTOPICS.filter((st) => st.subjectId === subject.id)
    const subTopic = subTopics[i % subTopics.length] || subTopics[0]
    const tests = SEED_OVERSIGHT_TESTS.filter(
      (t) => t.subjectId === subject.id && t.batchIds.includes(batch.id),
    )
    const test = tests[0] || SEED_OVERSIGHT_TESTS.find((t) => t.subjectId === subject.id) || SEED_OVERSIGHT_TESTS[0]
    const status = statuses[i % statuses.length]
    const priority = priorities[i % priorities.length]
    const center = centers[i % centers.length]
    const subjectMentors = mentors.filter((m) => m.subjectIds.includes(subject.id))
    const mentor = i % 5 === 0 ? null : subjectMentors[i % Math.max(subjectMentors.length, 1)]
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length]
    const studentName = `${fn} ${ln}`
    const rollNumber = `#ER-2024-${String(1000 + i).slice(-4)}`
    const day = String((i % 28) + 1).padStart(2, '0')
    const submittedAt = `2026-05-${day}T${String(9 + (i % 8)).padStart(2, '0')}:30:00.000Z`
    const evaluated = status === 'Evaluated'
    const score = evaluated ? 62 + (i % 38) : null
    const program = SEED_OVERSIGHT_PROGRAMS.find((p) => p.id === subject.programId)

    papers.push(
      buildPaper({
        id: `PAPER-GEN-${String(i + 1).padStart(3, '0')}`,
        studentName,
        rollNumber,
        batchId: batch.id,
        batchName: batch.label,
        subjectId: subject.id,
        subjectName: subject.label,
        subTopicId: subTopic?.id || 'ST-ALL',
        subTopicName: subTopic?.label || 'All Sub-topics',
        testId: test.id,
        testName: test.label,
        examType: test.examType,
        mentorId: mentor?.id ?? null,
        status,
        priority,
        centerId: center.id,
        centerName: center.label,
        programId: program?.id || 'PROG-UPSC',
        programName: program?.label || 'UPSC Civil Services',
        scoreObtained: score,
        submittedAt,
        evaluatedAt: evaluated ? `2026-05-${String(Math.min(Number(day) + 2, 28)).padStart(2, '0')}T14:00:00.000Z` : null,
        locked: evaluated,
      }),
    )
  }
  return papers
}

/** Hand-crafted showcase rows + bulk generated dataset */
export const SEED_EVALUATION_PAPERS = [
  buildPaper({
    id: 'PAPER-001',
    studentName: 'Arjun Malhotra',
    rollNumber: '#ER-2024-0892',
    batchId: 'BATCH-2024-A',
    batchName: 'Batch 2024-A',
    subjectId: 'SUB-MATH',
    subjectName: 'Advanced Mathematics',
    subTopicId: 'ST-ALL',
    subTopicName: 'All Sub-topics',
    testId: 'TST-MID-MATH',
    testName: 'Mid-Term Assessment',
    examType: 'Descriptive',
    mentorId: 'MEN-001',
    priority: 'Normal',
    centerId: 'CTR-DELHI',
    centerName: 'Delhi — Rajendra Place',
    programId: 'PROG-GATE',
    programName: 'GATE Engineering',
    status: 'Evaluated',
    scoreObtained: 88,
    submittedAt: '2026-05-25T14:00:00.000Z',
    evaluatedAt: '2026-05-27T16:05:00.000Z',
    locked: true,
    rubric: [
      { key: 'conceptual', label: 'Conceptual Clarity', max: 10, score: 8, feedback: 'Strong conceptual base.', remarksLabel: 'Section Remarks', placeholder: 'Specific feedback on concepts...' },
      { key: 'language', label: 'Language & Tone', max: 5, score: 4, feedback: 'Clear academic tone.', remarksLabel: 'Grammar & Syntax notes', placeholder: 'Feedback on language...' },
      { key: 'structure', label: 'Structure', max: 5, score: 3.5, feedback: 'Logical flow with minor gaps.', remarksLabel: 'Flow & Continuity', placeholder: 'Feedback on logical flow...' },
    ],
  }),
  buildPaper({
    id: 'PAPER-002',
    studentName: 'Priya Sharma',
    rollNumber: '#ER-2024-0412',
    batchId: 'BATCH-2024-A',
    batchName: 'Batch 2024-A',
    subjectId: 'SUB-MATH',
    subjectName: 'Advanced Mathematics',
    subTopicId: 'ST-CALC',
    subTopicName: 'Calculus',
    testId: 'TST-MID-MATH',
    testName: 'Mid-Term Assessment',
    mentorId: 'MEN-002',
    priority: 'High',
    centerId: 'CTR-MUMBAI',
    centerName: 'Mumbai — Andheri',
    status: 'In Progress',
    submittedAt: '2026-05-26T11:30:00.000Z',
    rubric: [
      { key: 'conceptual', label: 'Conceptual Clarity', max: 10, score: 8, feedback: '', remarksLabel: 'Section Remarks', placeholder: 'Specific feedback on concepts...' },
      { key: 'language', label: 'Language & Tone', max: 5, score: 4, feedback: '', remarksLabel: 'Grammar & Syntax notes', placeholder: 'Feedback on language...' },
      { key: 'structure', label: 'Structure', max: 5, score: 3.5, feedback: '', remarksLabel: 'Flow & Continuity', placeholder: 'Feedback on logical flow...' },
    ],
  }),
  buildPaper({
    id: 'PAPER-003',
    studentName: 'David Thompson',
    rollNumber: '#ER-2024-1201',
    batchId: 'BATCH-2024-A',
    batchName: 'Batch 2024-A',
    subjectId: 'SUB-MATH',
    subjectName: 'Advanced Mathematics',
    testId: 'TST-MID-MATH',
    testName: 'Mid-Term Assessment',
    mentorId: null,
    mentorName: null,
    priority: 'High',
    centerId: 'CTR-ONLINE',
    centerName: 'Online / Remote',
    status: 'Not Started',
    submittedAt: '2026-05-27T09:00:00.000Z',
  }),
  buildPaper({
    id: 'PAPER-004',
    studentName: 'Michael Chen',
    rollNumber: '#ER-2024-0773',
    batchId: 'BATCH-2024-A',
    subjectId: 'SUB-MATH',
    subjectName: 'Advanced Mathematics',
    subTopicId: 'ST-ALG',
    subTopicName: 'Linear Algebra',
    testId: 'TST-MID-MATH',
    testName: 'Mid-Term Assessment',
    mentorId: 'MEN-002',
    priority: 'High',
    status: 'Overdue',
    centerId: 'CTR-BLR',
    centerName: 'Bangalore — Koramangala',
    submittedAt: '2026-05-20T08:00:00.000Z',
  }),
  buildPaper({
    id: 'PAPER-005',
    studentName: 'Sneha Kapoor',
    rollNumber: '#ER-2024-0555',
    batchId: 'BATCH-2024-A',
    subjectId: 'SUB-MATH',
    subjectName: 'Advanced Mathematics',
    testId: 'TST-MID-MATH',
    testName: 'Mid-Term Assessment',
    mentorId: 'MEN-003',
    status: 'Evaluated',
    scoreObtained: 94,
    priority: 'Normal',
    submittedAt: '2026-05-24T16:00:00.000Z',
    evaluatedAt: '2026-05-26T14:20:00.000Z',
    locked: true,
  }),
  buildPaper({
    id: 'PAPER-020',
    studentName: 'Aisha Khan',
    rollNumber: '#ER-2023-2201',
    batchId: 'BATCH-2023-FALL',
    batchName: '2023 Fall - Computer Science',
    subjectId: 'SUB-CS402',
    subjectName: 'CS402: Distributed Systems',
    subTopicId: 'ST-DIST',
    subTopicName: 'Distributed Consensus',
    testId: 'TST-MID-CS',
    testName: 'Mid-Term Mains Assessment 2023',
    examType: 'Mains',
    mentorId: 'MEN-004',
    priority: 'Normal',
    centerId: 'CTR-HYD',
    centerName: 'Hyderabad — Gachibowli',
    programId: 'PROG-CS',
    programName: 'Computer Science Degree',
    status: 'In Progress',
    submittedAt: '2026-05-22T13:00:00.000Z',
  }),
  buildPaper({
    id: 'PAPER-021',
    studentName: 'Rohan Gupta',
    rollNumber: '#ER-2025-0101',
    batchId: 'BATCH-2025-UPSC',
    batchName: 'UPSC Foundation 2026',
    subjectId: 'SUB-POLITY',
    subjectName: 'GS-2 Polity & Governance',
    testId: 'TST-GS2-01',
    testName: 'GS-2 Mains Test 01',
    examType: 'Mains',
    mentorId: 'MEN-006',
    priority: 'High',
    centerId: 'CTR-DELHI',
    status: 'Evaluated',
    scoreObtained: 198,
    scoreMax: 250,
    submittedAt: '2026-05-18T10:00:00.000Z',
    evaluatedAt: '2026-05-24T11:00:00.000Z',
    locked: true,
  }),
  buildPaper({
    id: 'PAPER-022',
    studentName: 'Ishita Reddy',
    rollNumber: '#ER-2025-0102',
    batchId: 'BATCH-2025-UPSC',
    subjectId: 'SUB-ETHICS',
    subjectName: 'Ethics & Integrity',
    testId: 'TST-ETH-03',
    testName: 'Ethics Test 03',
    mentorId: 'MEN-007',
    priority: 'Normal',
    centerId: 'CTR-CHN',
    centerName: 'Chennai — Anna Nagar',
    status: 'Not Started',
    submittedAt: '2026-05-28T08:00:00.000Z',
  }),
  ...generateBulkPapers(55),
]

export const SEED_OVERSIGHT_STATS = {
  totalPapers: 12482,
  totalPapersTrend: '+12% from last batch',
  pendingEvaluation: 1245,
  pendingLabel: 'High Priority',
  evaluatedToday: 418,
  evaluatedTodayLabel: 'Last updated 2m ago',
  avgEvaluationTime: '14.2m',
  avgTimeTrend: '-2.4m improvement',
}
