export const RESULT_STATUSES = ['Processing', 'Evaluated', 'Published']

export const SEED_BATCHES = [
  { id: 'B-2026-FDN-A', name: 'UPSC Foundation 2026 - Batch A' },
  { id: 'B-2026-FDN-B', name: 'UPSC Foundation 2026 - Batch B' },
  { id: 'B-2026-ADV-A', name: 'UPSC Advanced 2026 - Batch A' },
]

export const SEED_SUBJECTS = [
  { id: 'S-POL', name: 'Polity' },
  { id: 'S-ECO', name: 'Economy' },
  { id: 'S-HIS', name: 'History' },
  { id: 'S-GEO', name: 'Geography' },
  { id: 'S-ETH', name: 'Ethics' },
]

export const SEED_TESTS = [
  { id: 'T-6101', name: 'Polity Mini Test - Basics', subjectId: 'S-POL', totalMarks: 100, date: '2026-05-06' },
  { id: 'T-6102', name: 'Economy Mini Test - Fundamentals', subjectId: 'S-ECO', totalMarks: 100, date: '2026-05-10' },
  { id: 'T-6103', name: 'History Mini Test - Modern India', subjectId: 'S-HIS', totalMarks: 100, date: '2026-05-14' },
  { id: 'T-6104', name: 'Geography Mini Test - Mapping', subjectId: 'S-GEO', totalMarks: 100, date: '2026-05-18' },
  { id: 'T-6105', name: 'Ethics Mini Test - Case Studies', subjectId: 'S-ETH', totalMarks: 100, date: '2026-05-22' },
]

export const SEED_STUDENTS = [
  { id: 'ST-9001', name: 'Ananya Sharma', rollNumber: 'IAS26A-001', batchId: 'B-2026-FDN-A' },
  { id: 'ST-9002', name: 'Rohit Verma', rollNumber: 'IAS26A-014', batchId: 'B-2026-FDN-A' },
  { id: 'ST-9003', name: 'Meera Iyer', rollNumber: 'IAS26B-006', batchId: 'B-2026-FDN-B' },
  { id: 'ST-9004', name: 'Karthik R', rollNumber: 'IAS26B-018', batchId: 'B-2026-FDN-B' },
  { id: 'ST-9005', name: 'Farhan Ali', rollNumber: 'IAS26ADV-004', batchId: 'B-2026-ADV-A' },
]

/**
 * Result: relationship support
 * Result → Student → Test → Subject → AIR → Analytics
 */
export const SEED_RESULTS_ENGINE = [
  // Polity
  { id: 'R-74001', studentId: 'ST-9001', testId: 'T-6101', status: 'Published', score: 82, evaluatedAt: '2026-05-07' },
  { id: 'R-74002', studentId: 'ST-9002', testId: 'T-6101', status: 'Published', score: 76, evaluatedAt: '2026-05-07' },
  { id: 'R-74003', studentId: 'ST-9003', testId: 'T-6101', status: 'Evaluated', score: 69, evaluatedAt: '2026-05-08' },
  { id: 'R-74004', studentId: 'ST-9004', testId: 'T-6101', status: 'Processing', score: 0, evaluatedAt: null },
  { id: 'R-74005', studentId: 'ST-9005', testId: 'T-6101', status: 'Published', score: 76, evaluatedAt: '2026-05-07' },

  // Economy
  { id: 'R-74006', studentId: 'ST-9001', testId: 'T-6102', status: 'Published', score: 71, evaluatedAt: '2026-05-11' },
  { id: 'R-74007', studentId: 'ST-9002', testId: 'T-6102', status: 'Published', score: 64, evaluatedAt: '2026-05-11' },
  { id: 'R-74008', studentId: 'ST-9003', testId: 'T-6102', status: 'Published', score: 79, evaluatedAt: '2026-05-11' },
  { id: 'R-74009', studentId: 'ST-9004', testId: 'T-6102', status: 'Evaluated', score: 58, evaluatedAt: '2026-05-12' },
  { id: 'R-74010', studentId: 'ST-9005', testId: 'T-6102', status: 'Published', score: 79, evaluatedAt: '2026-05-11' },

  // History
  { id: 'R-74011', studentId: 'ST-9001', testId: 'T-6103', status: 'Published', score: 66, evaluatedAt: '2026-05-15' },
  { id: 'R-74012', studentId: 'ST-9002', testId: 'T-6103', status: 'Published', score: 74, evaluatedAt: '2026-05-15' },
  { id: 'R-74013', studentId: 'ST-9003', testId: 'T-6103', status: 'Published', score: 74, evaluatedAt: '2026-05-15' },
  { id: 'R-74014', studentId: 'ST-9004', testId: 'T-6103', status: 'Processing', score: 0, evaluatedAt: null },
  { id: 'R-74015', studentId: 'ST-9005', testId: 'T-6103', status: 'Evaluated', score: 81, evaluatedAt: '2026-05-16' },
]

