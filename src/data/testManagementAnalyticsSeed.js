export const TM_SUBJECT_PERFORMANCE = [
  { subject: 'Polity', avg: 72, attempts: 1240 },
  { subject: 'History', avg: 65, attempts: 890 },
  { subject: 'Geography', avg: 68, attempts: 720 },
  { subject: 'Economy', avg: 61, attempts: 540 },
  { subject: 'Environment', avg: 70, attempts: 480 },
]

export const TM_STUDENT_RANKINGS = [
  { rank: 1, name: 'Aarav Sharma', roll: 'UPSC-2026-1001', score: 94, subject: 'Polity' },
  { rank: 2, name: 'Priya Patel', roll: 'UPSC-2026-1002', score: 91, subject: 'History' },
  { rank: 3, name: 'Ananya Iyer', roll: 'UPSC-2026-1003', score: 89, subject: 'Polity' },
  { rank: 4, name: 'Rohan Reddy', roll: 'UPSC-2026-1004', score: 87, subject: 'Economy' },
  { rank: 5, name: 'Vikram Singh', roll: 'UPSC-2026-1005', score: 85, subject: 'Environment' },
]

export const TM_WEAK_AREAS = [
  { topic: 'Fundamental Rights – Exceptions', accuracy: 42, subject: 'Polity' },
  { topic: 'Monetary Policy Tools', accuracy: 48, subject: 'Economy' },
  { topic: 'Climate Protocols', accuracy: 51, subject: 'Environment' },
  { topic: 'Medieval Administration', accuracy: 53, subject: 'History' },
]

export const TM_ACCURACY_HEATMAP = {
  subjects: ['Polity', 'History', 'Geography', 'Economy', 'Environment'],
  difficulties: ['Easy', 'Medium', 'Hard'],
  values: [
    [88, 72, 58],
    [82, 68, 52],
    [85, 70, 55],
    [78, 62, 45],
    [84, 69, 50],
  ],
}
