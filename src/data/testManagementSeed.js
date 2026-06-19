export const QUESTION_CATEGORIES = ['Prelims', 'Mains']
export const QUESTION_BANK_TYPES = ['MCQ', 'Numerical', 'Match the Following', 'Assertion Reason', 'Descriptive']
// Legacy (kept for backward compatibility with older stored data)
export const QUESTION_TYPES = ['MCQ', 'Descriptive', 'True/False', 'Paragraph']
export const QUESTION_DIFFICULTIES = ['Easy', 'Medium', 'Hard']
export const QUESTION_STATUSES = ['Active', 'Deactivated']
export const QUESTION_TAG_SUGGESTIONS = ['polity', 'constitution', 'economy', 'geography', 'environment', 'ethics', 'science-tech', 'history']

export const TEST_CONFIG_STATUSES = ['Active', 'Draft', 'In Active']
export const INTEGRATION_STATUSES = ['Published', 'Draft', 'Unpublished']

export const SEED_QUESTIONS = [
  {
    id: 'Q-2001',
    category: 'Prelims',
    type: 'MCQ',
    subject: 'Polity',
    topic: 'Basics',
    difficulty: 'Easy',
    tags: ['polity', 'prelims'],
    usageCount: 3,
    status: 'Active',
    content: {
      question: 'Which of the following is the capital of India?',
      options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
      correctOptionIndex: 1,
      explanation: 'New Delhi is the capital of India.',
    },
  },
  {
    id: 'Q-2002',
    category: 'Prelims',
    type: 'Assertion Reason',
    subject: 'Polity',
    topic: 'Preamble',
    difficulty: 'Medium',
    tags: ['polity', 'constitution'],
    usageCount: 1,
    status: 'Active',
    content: {
      assertion: 'The Preamble is a part of the Constitution of India.',
      reason: 'The Preamble was adopted on 26 November 1949 and came into force on 26 January 1950.',
      correctAnswer: 'Both A and R are true, and R is the correct explanation of A',
      explanation: 'The Preamble is part of the Constitution; R provides relevant context.',
    },
  },
  {
    id: 'Q-2003',
    category: 'Prelims',
    type: 'Numerical',
    subject: 'Geography',
    topic: 'Indian Geography',
    difficulty: 'Easy',
    tags: ['geography', 'prelims'],
    usageCount: 2,
    status: 'Deactivated',
    content: {
      question: 'The Tropic of Cancer passes through how many Indian states?',
      numericalAnswer: '8',
      explanation: 'It passes through 8 Indian states.',
    },
  },
  {
    id: 'Q-2004',
    category: 'Prelims',
    type: 'Match the Following',
    subject: 'Geography',
    topic: 'Rivers',
    difficulty: 'Medium',
    tags: ['geography'],
    usageCount: 0,
    status: 'Active',
    content: {
      prompt: 'Match the rivers with their associated regions.',
      left: ['Kosi', 'Narmada', 'Godavari', 'Brahmaputra'],
      right: ['Assam', 'Central India', 'Bihar', 'Deccan'],
      mapping: [2, 1, 3, 0],
      explanation: 'Kosi–Bihar, Narmada–Central India, Godavari–Deccan, Brahmaputra–Assam.',
    },
  },
  {
    id: 'Q-2005',
    category: 'Prelims',
    status: 'Deactivated',
    type: 'MCQ',
    subject: 'Polity',
    topic: 'Judiciary',
    difficulty: 'Easy',
    tags: ['polity'],
    usageCount: 4,
    content: {
      question: 'Who is the final authority to interpret the Constitution of India?',
      options: ['Parliament', 'Supreme Court', 'President', 'Council of Ministers'],
      correctOptionIndex: 1,
      explanation: 'Judicial review and final interpretation lie with the Supreme Court.',
    },
  },
  {
    id: 'Q-3001',
    category: 'Mains',
    type: 'Descriptive',
    subject: 'Polity',
    topic: 'Constitution',
    difficulty: 'Medium',
    tags: ['constitution', 'mains'],
    usageCount: 2,
    status: 'Active',
    content: {
      question: 'Discuss the doctrine of Separation of Powers in the Indian constitutional framework. Explain its significance with suitable examples.',
      explanation: 'Cover checks and balances, separation in Indian context, and case/examples.',
    },
  },
  {
    id: 'Q-3002',
    category: 'Mains',
    type: 'Descriptive',
    subject: 'Polity',
    topic: 'Elections',
    difficulty: 'Medium',
    tags: ['election', 'governance'],
    usageCount: 1,
    status: 'Active',
    content: {
      question: 'Evaluate the role of the Election Commission of India in ensuring free and fair elections. Highlight challenges and reforms needed.',
      explanation: 'Mention autonomy, MCC, reforms, transparency, and technology concerns.',
    },
  },
  {
    id: 'Q-3003',
    category: 'Mains',
    type: 'Descriptive',
    subject: 'Governance',
    topic: 'Public Policy',
    difficulty: 'Hard',
    tags: ['governance', 'policy'],
    usageCount: 0,
    status: 'Deactivated',
    content: {
      question: '“Public policy in India is often constrained by implementation capacity.” Critically examine this statement with examples and suggest measures to strengthen implementation.',
      explanation: 'Discuss capacity constraints, institutions, accountability, tech, and implementation gaps.',
    },
  },
  {
    id: 'Q-3004',
    category: 'Mains',
    type: 'Descriptive',
    subject: 'Polity',
    topic: 'Federalism',
    difficulty: 'Medium',
    tags: ['federalism'],
    usageCount: 3,
    status: 'Active',
    content: {
      question: 'Explain the concept of federalism in India. How have fiscal arrangements shaped Centre–State relations in recent years?',
      explanation: 'Include GST, Finance Commission, grants, and cooperative/competitive federalism.',
    },
  },
  {
    id: 'Q-3005',
    category: 'Mains',
    type: 'Descriptive',
    subject: 'Ethics',
    topic: 'AI & Governance',
    difficulty: 'Hard',
    tags: ['ethics', 'ai'],
    usageCount: 1,
    status: 'Deactivated',
    content: {
      question: 'Discuss the ethical issues in the use of artificial intelligence in governance. Suggest a framework to ensure accountability and transparency.',
      explanation: 'Bias, accountability, transparency, privacy, human oversight.',
    },
  },
]

export const SEED_TEST_CONFIGS = [
  {
    id: 'TC-2001',
    testName: 'Polity Mini Test - Basics',
    subject: 'Polity',
    totalQuestions: 20,
    totalMarks: 20,
    difficultyMix: 'E:10 / M:8 / H:2',
    status: 'Active',
    updatedAt: '2026-05-20',
    taggedQuestionIds: ['Q-1001', 'Q-1002'],
    tags: { topics: ['Basics', 'Constitution'], category: 'Mini Test' },
  },
]

export const SEED_TEST_INTEGRATIONS = [
  {
    id: 'TI-3001',
    testName: 'Polity Mini Test - Basics',
    course: 'UPSC Foundation',
    batch: 'Batch A',
    faculty: 'Dr. Rao',
    subject: 'Polity',
    scheduleDate: '2026-06-05',
    durationMins: 30,
    status: 'Draft',
  },
]

export const SEED_RESULTS = [
  {
    id: 'R-4001',
    testName: 'Polity Mini Test - Basics',
    student: 'Student 01',
    score: 14,
    total: 20,
    rank: 12,
    status: 'Pass',
    attemptedAt: '2026-05-22',
  },
]

