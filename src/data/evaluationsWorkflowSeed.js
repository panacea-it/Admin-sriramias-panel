export const EVALUATIONS_PENDING = [
  { id: 'eval-101', student: 'Aarav Sharma', test: 'Making of Constitution Test Series', faculty: 'Narasimha', assignedTo: 'Narasimha', due: '2026-05-28', priority: 'High' },
  { id: 'eval-102', student: 'Priya Patel', test: 'GS Paper II Essay', faculty: 'Nikita', assignedTo: 'Nikita', due: '2026-05-29', priority: 'Medium' },
  { id: 'eval-103', student: 'Rohan Reddy', test: 'Climate Change Test Series', faculty: 'Meghana', assignedTo: 'Meghana', due: '2026-05-30', priority: 'Low' },
]

export const EVALUATIONS_COMPLETED = [
  { id: 'eval-201', student: 'Ananya Iyer', test: 'President Test Series', faculty: 'Narasimha', completedOn: '2026-05-26', score: '42/50' },
  { id: 'eval-202', student: 'Vikram Singh', test: 'Medieval India Test Series', faculty: 'Nikita', completedOn: '2026-05-25', score: '38/50' },
]

export const REEVALUATION_REQUESTS = [
  { id: 'reeval-1', student: 'Karthik Nair', test: 'Salient Features Test Series', reason: 'OMR mismatch', status: 'Open', requestedOn: '2026-05-27' },
  { id: 'reeval-2', student: 'Divya Menon', test: 'Budget 2026 Test Series', reason: 'Technical glitch during submission', status: 'Under Review', requestedOn: '2026-05-26' },
]

export const EVALUATION_TIMELINE = [
  { step: 'Test Conducted', date: '2026-05-20', status: 'done' },
  { step: 'Answer Scripts Uploaded', date: '2026-05-21', status: 'done' },
  { step: 'Evaluator Assigned', date: '2026-05-22', status: 'done' },
  { step: 'Evaluation In Progress', date: '2026-05-25', status: 'active' },
  { step: 'Marks Published', date: '—', status: 'pending' },
]
