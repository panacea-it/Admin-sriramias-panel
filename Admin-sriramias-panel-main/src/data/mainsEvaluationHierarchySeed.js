/** Demo hierarchy for Mains Management when faculty CMS has sparse Mains Answer Writing data. */
export const MAINS_DEMO_FACULTY_ROWS = [
  {
    id: 'mains-fac-physics',
    subjectId: 'mains-physics',
    subjectName: 'Physics',
    subjectNameRaw: 'Physics',
    facultyName: 'Nikhita',
    totalTopics: 4,
    totalTests: 6,
    lastUpdated: '2026-05-26T14:00:00.000Z',
    topics: [
      {
        id: 'topic-solar',
        title: 'Solar System',
        testCount: 3,
        tests: [
          {
            id: 'test-solar-1',
            title: 'Solar System Test 1',
            uploadedDate: '2026-05-24',
            conductedAt: '2026-05-24T10:00:00.000Z',
            evaluationStatus: 'In Progress',
          },
          {
            id: 'test-solar-weekly',
            title: 'Solar System Weekly Test',
            uploadedDate: '2026-05-20',
            conductedAt: '2026-05-20T09:00:00.000Z',
            evaluationStatus: 'Completed',
          },
          {
            id: 'test-solar-grand',
            title: 'Solar System Grand Test',
            uploadedDate: '2026-05-18',
            conductedAt: '2026-05-18T11:00:00.000Z',
            evaluationStatus: 'Completed',
          },
        ],
      },
      {
        id: 'topic-gravitation',
        title: 'Gravitation',
        testCount: 1,
        tests: [
          {
            id: 'test-grav-1',
            title: 'Gravitation Mains Test',
            uploadedDate: '2026-05-15',
            conductedAt: '2026-05-15T10:00:00.000Z',
            evaluationStatus: 'Under Review',
          },
        ],
      },
      {
        id: 'topic-motion',
        title: 'Motion',
        testCount: 1,
        tests: [
          {
            id: 'test-motion-1',
            title: 'Motion Answer Writing Test',
            uploadedDate: '2026-05-12',
            conductedAt: '2026-05-12T10:00:00.000Z',
            evaluationStatus: 'Completed',
          },
        ],
      },
      {
        id: 'topic-waves',
        title: 'Waves',
        testCount: 1,
        tests: [
          {
            id: 'test-waves-1',
            title: 'Waves Descriptive Test',
            uploadedDate: '2026-05-10',
            conductedAt: '2026-05-10T10:00:00.000Z',
            evaluationStatus: 'Not Started',
          },
        ],
      },
    ],
  },
  {
    id: 'mains-fac-polity',
    subjectId: 'mains-polity',
    subjectName: 'Polity',
    subjectNameRaw: 'Indian Polity',
    facultyName: 'Rahul',
    totalTopics: 2,
    totalTests: 2,
    lastUpdated: '2026-05-25T12:00:00.000Z',
    topics: [
      {
        id: 'topic-constitution',
        title: 'Constitution',
        testCount: 1,
        tests: [
          {
            id: 'test-constitution-essay',
            title: 'Constitutional Development Essay',
            uploadedDate: '2026-05-22',
            conductedAt: '2026-05-22T10:00:00.000Z',
            evaluationStatus: 'In Progress',
          },
        ],
      },
      {
        id: 'topic-governance',
        title: 'Governance',
        testCount: 1,
        tests: [
          {
            id: 'test-governance-1',
            title: 'Polity Governance Test',
            uploadedDate: '2026-05-19',
            conductedAt: '2026-05-19T10:00:00.000Z',
            evaluationStatus: 'Completed',
          },
        ],
      },
    ],
  },
  {
    id: 'mains-fac-economy',
    subjectId: 'mains-economy',
    subjectName: 'Economy',
    subjectNameRaw: 'Indian Economy',
    facultyName: 'Suresh',
    totalTopics: 1,
    totalTests: 1,
    lastUpdated: '2026-05-27T16:00:00.000Z',
    topics: [
      {
        id: 'topic-economy-macro',
        title: 'Macroeconomics',
        testCount: 1,
        tests: [
          {
            id: 'test-economy-grand',
            title: 'Indian Economy Grand Test',
            uploadedDate: '2026-05-27',
            conductedAt: '2026-05-27T14:00:00.000Z',
            evaluationStatus: 'In Progress',
          },
        ],
      },
    ],
  },
  {
    id: 'mains-fac-history',
    subjectId: 'mains-history',
    subjectName: 'History',
    subjectNameRaw: 'History',
    facultyName: 'Anitha',
    totalTopics: 1,
    totalTests: 1,
    lastUpdated: '2026-05-21T09:00:00.000Z',
    topics: [
      {
        id: 'topic-modern',
        title: 'Modern India',
        testCount: 1,
        tests: [
          {
            id: 'test-history-modern',
            title: 'Modern India Long Answers',
            uploadedDate: '2026-05-21',
            conductedAt: '2026-05-21T09:00:00.000Z',
            evaluationStatus: 'Completed',
          },
        ],
      },
    ],
  },
  {
    id: 'mains-fac-ethics',
    subjectId: 'mains-ethics',
    subjectName: 'Ethics',
    subjectNameRaw: 'Ethics',
    facultyName: 'Meghana',
    totalTopics: 1,
    totalTests: 1,
    lastUpdated: '2026-05-28T08:00:00.000Z',
    topics: [
      {
        id: 'topic-ethics-case',
        title: 'Case Studies',
        testCount: 1,
        tests: [
          {
            id: 'test-ethics-upsc',
            title: 'UPSC Ethics Test',
            uploadedDate: '2026-05-28',
            conductedAt: '2026-05-28T08:00:00.000Z',
            evaluationStatus: 'In Progress',
          },
        ],
      },
    ],
  },
]
