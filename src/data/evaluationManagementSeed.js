export const EVALUATION_STATUSES = ['Pending', 'In Review', 'Draft Saved', 'Published', 'Rechecking']

export const SEED_EVALUATION_STUDENTS = [
  { id: 'STU-1001', name: 'Ananya Sharma', batch: 'UPSC Foundation 2026', rollNo: 'FND-026-118' },
  { id: 'STU-1002', name: 'Rahul Verma', batch: 'UPSC Foundation 2026', rollNo: 'FND-026-042' },
  { id: 'STU-1003', name: 'Priya Iyer', batch: 'GS Mains 2026', rollNo: 'MNS-026-009' },
  { id: 'STU-1004', name: 'Mohit Singh', batch: 'GS Mains 2026', rollNo: 'MNS-026-071' },
  { id: 'STU-1005', name: 'Sneha Nair', batch: 'Ethics 2026', rollNo: 'ETH-026-015' },
]

export const SEED_EVALUATION_EVALUATORS = [
  { id: 'EVL-7001', name: 'Dr. R. Narayanan', speciality: 'Polity', rating: 4.7 },
  { id: 'EVL-7002', name: 'Ms. A. Chatterjee', speciality: 'Governance', rating: 4.6 },
  { id: 'EVL-7003', name: 'Mr. K. Mehta', speciality: 'Ethics', rating: 4.5 },
  { id: 'EVL-7004', name: 'Prof. S. Kulkarni', speciality: 'Geography', rating: 4.4 },
]

export const SEED_EVALUATION_TESTS = [
  { id: 'TST-3001', name: 'GS-2 Mains Test 01 (Polity + Governance)', subject: 'GS-2', maxMarks: 250 },
  { id: 'TST-3002', name: 'GS-1 Mains Test 02 (Geography + Society)', subject: 'GS-1', maxMarks: 250 },
  { id: 'TST-3003', name: 'Ethics Test 03 (Case Studies)', subject: 'Ethics', maxMarks: 250 },
]

const nowISO = new Date().toISOString()

export const SEED_EVALUATIONS = [
  {
    id: 'EVAL-50001',
    studentId: 'STU-1001',
    testId: 'TST-3001',
    evaluatorId: 'EVL-7001',
    status: 'Pending',
    marks: null,
    remarks: '',
    rubric: [
      { key: 'content', label: 'Content Quality', max: 10, score: 0, feedback: '' },
      { key: 'structure', label: 'Structure', max: 5, score: 0, feedback: '' },
      { key: 'accuracy', label: 'Accuracy', max: 10, score: 0, feedback: '' },
      { key: 'presentation', label: 'Presentation', max: 5, score: 0, feedback: '' },
    ],
    internalComments: '',
    highlightNotes: '',
    recheck: null,
    answerSheet: {
      fileName: 'Ananya_GS2_Test01.pdf',
      // This is intentionally null in seed; upload/attach in workspace.
      url: null,
      pages: 12,
    },
    annotations: [],
    history: [
      { id: 'H-1', type: 'ASSIGNED', actor: 'Admin', at: nowISO, message: 'Evaluation assigned to Dr. R. Narayanan' },
    ],
    updatedAt: '2026-05-27 18:22',
    createdAt: '2026-05-26 12:05',
    deadline: '2026-05-30',
    priority: 'Normal',
  },
  {
    id: 'EVAL-50002',
    studentId: 'STU-1002',
    testId: 'TST-3001',
    evaluatorId: 'EVL-7002',
    status: 'Draft Saved',
    marks: 116,
    remarks: 'Good constitutional grounding. Needs sharper examples & better conclusion.',
    rubric: [
      { key: 'content', label: 'Content Quality', max: 10, score: 7.5, feedback: 'Relevant points; add committee refs.' },
      { key: 'structure', label: 'Structure', max: 5, score: 3.5, feedback: 'Use sub-headings for readability.' },
      { key: 'accuracy', label: 'Accuracy', max: 10, score: 7, feedback: 'Mostly correct; avoid vague claims.' },
      { key: 'presentation', label: 'Presentation', max: 5, score: 3, feedback: 'Underline keywords; cleaner diagrams.' },
    ],
    internalComments: 'Draft saved; revisit Q3 annotation.',
    highlightNotes: 'Check evaluation rubric totals before publish.',
    recheck: null,
    answerSheet: { fileName: 'Rahul_GS2_Test01.pdf', url: null, pages: 10 },
    annotations: [],
    history: [
      { id: 'H-1', type: 'ASSIGNED', actor: 'Admin', at: '2026-05-24T09:30:00.000Z', message: 'Assigned to Ms. A. Chatterjee' },
      { id: 'H-2', type: 'DRAFT_SAVED', actor: 'Ms. A. Chatterjee', at: '2026-05-27T11:20:00.000Z', message: 'Draft saved with partial remarks & rubric.' },
    ],
    updatedAt: '2026-05-27 11:20',
    createdAt: '2026-05-24 09:30',
    deadline: '2026-05-29',
    priority: 'High',
  },
  {
    id: 'EVAL-50003',
    studentId: 'STU-1003',
    testId: 'TST-3003',
    evaluatorId: 'EVL-7003',
    status: 'Published',
    marks: 142,
    remarks: 'Solid ethical reasoning. Strengthen stakeholder mapping and add ethical thinkers briefly.',
    rubric: [
      { key: 'content', label: 'Content Quality', max: 10, score: 8.5, feedback: 'Good coverage of dimensions.' },
      { key: 'structure', label: 'Structure', max: 5, score: 4, feedback: 'Well structured; keep it consistent.' },
      { key: 'accuracy', label: 'Accuracy', max: 10, score: 8, feedback: 'Arguments mostly sound.' },
      { key: 'presentation', label: 'Presentation', max: 5, score: 4, feedback: 'Neat; improve diagram clarity.' },
    ],
    internalComments: '',
    highlightNotes: '',
    recheck: { requested: false, requestedAt: null, secondaryEvaluatorId: null, originalMarks: 142, revisedMarks: null, remarks: '' },
    answerSheet: { fileName: 'Priya_Ethics_Test03.pdf', url: null, pages: 14 },
    annotations: [],
    history: [
      { id: 'H-1', type: 'ASSIGNED', actor: 'Admin', at: '2026-05-20T09:12:00.000Z', message: 'Assigned to Mr. K. Mehta' },
      { id: 'H-2', type: 'PUBLISHED', actor: 'Mr. K. Mehta', at: '2026-05-23T16:05:00.000Z', message: 'Published final evaluation.' },
    ],
    updatedAt: '2026-05-23 16:05',
    createdAt: '2026-05-20 09:12',
    deadline: '2026-05-24',
    priority: 'Normal',
    locked: true,
  },
  {
    id: 'EVAL-50004',
    studentId: 'STU-1004',
    testId: 'TST-3002',
    evaluatorId: 'EVL-7004',
    status: 'Rechecking',
    marks: 128,
    remarks: 'Decent coverage but needs stronger map-based argument and better intro.',
    rubric: [
      { key: 'content', label: 'Content Quality', max: 10, score: 7, feedback: 'Add case studies/regions.' },
      { key: 'structure', label: 'Structure', max: 5, score: 3.5, feedback: 'Keep flow consistent.' },
      { key: 'accuracy', label: 'Accuracy', max: 10, score: 7.5, feedback: 'Ok; verify statistics.' },
      { key: 'presentation', label: 'Presentation', max: 5, score: 3.5, feedback: 'Neat diagrams needed.' },
    ],
    internalComments: 'Recheck requested by student.',
    highlightNotes: '',
    recheck: {
      requested: true,
      requestedAt: '2026-05-26T12:10:00.000Z',
      secondaryEvaluatorId: 'EVL-7001',
      originalMarks: 128,
      revisedMarks: null,
      remarks: 'Please verify Q2 map analysis and award appropriate marks.',
    },
    answerSheet: { fileName: 'Mohit_GS1_Test02.pdf', url: null, pages: 13 },
    annotations: [],
    history: [
      { id: 'H-1', type: 'ASSIGNED', actor: 'Admin', at: '2026-05-21T09:05:00.000Z', message: 'Assigned to Prof. S. Kulkarni' },
      { id: 'H-2', type: 'DRAFT_SAVED', actor: 'Prof. S. Kulkarni', at: '2026-05-24T14:35:00.000Z', message: 'Draft saved.' },
      { id: 'H-3', type: 'RECHECK_REQUESTED', actor: 'Admin', at: '2026-05-26T12:10:00.000Z', message: 'Recheck requested; secondary evaluator assigned.' },
    ],
    updatedAt: '2026-05-26 12:10',
    createdAt: '2026-05-21 09:05',
    deadline: '2026-05-26',
    priority: 'High',
  },
]

