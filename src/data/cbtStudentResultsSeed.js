const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Karthik', 'Divya',
  'Arjun', 'Meera', 'Aditya', 'Isha', 'Nikhil', 'Kavya', 'Rahul', 'Pooja',
]
const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Nair', 'Menon',
]

const STATUSES = ['Completed', 'In Progress', 'Not Started', 'Absent']
const RESULT_STATUSES = ['Published', 'Pending', 'Under Review']

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length]
}

export function generateCbtStudentResults(testItemId, testTitle = 'Test', count = 48) {
  const seed = hashCode(String(testItemId))
  const rows = []

  for (let i = 0; i < count; i += 1) {
    const s = seed + i * 17
    const attemptStatus = pick(STATUSES, s, 1)
    const completed = attemptStatus === 'Completed'
    const score = completed ? 28 + (s % 72) : attemptStatus === 'In Progress' ? 12 + (s % 20) : 0
    const maxMarks = 50 + (s % 50)
    const accuracy = completed ? 55 + (s % 40) : attemptStatus === 'In Progress' ? 30 + (s % 25) : 0
    const negative = completed ? Number(((s % 8) * 0.66).toFixed(2)) : 0
    const mins = completed ? 18 + (s % 42) : attemptStatus === 'In Progress' ? 8 + (s % 15) : 0

    rows.push({
      id: `res-${testItemId}-${i}`,
      studentName: `${pick(FIRST_NAMES, s)} ${pick(LAST_NAMES, s, 2)}`,
      rollNumber: `UPSC-${2026}-${String(1000 + i).padStart(4, '0')}`,
      attemptStatus,
      score,
      maxMarks,
      rank: completed ? i + 1 : '—',
      accuracyPct: accuracy,
      negativeMarks: negative,
      timeTaken: completed || attemptStatus === 'In Progress' ? `${mins} min` : '—',
      submissionDate: completed
        ? `2026-0${1 + (s % 6)}-${String(10 + (s % 18)).padStart(2, '0')}`
        : '—',
      resultStatus: completed ? pick(RESULT_STATUSES, s, 3) : 'Pending',
      testTitle,
    })
  }

  const completedRows = rows.filter((r) => r.attemptStatus === 'Completed')
  completedRows.sort((a, b) => b.score - a.score)
  completedRows.forEach((r, idx) => {
    r.rank = idx + 1
  })

  return rows
}

export function summarizeCbtResults(rows = []) {
  const completed = rows.filter((r) => r.attemptStatus === 'Completed')
  const avgScore =
    completed.length > 0
      ? completed.reduce((s, r) => s + r.score, 0) / completed.length
      : 0
  const avgAccuracy =
    completed.length > 0
      ? completed.reduce((s, r) => s + r.accuracyPct, 0) / completed.length
      : 0
  return {
    totalStudents: rows.length,
    attempted: completed.length,
    inProgress: rows.filter((r) => r.attemptStatus === 'In Progress').length,
    notStarted: rows.filter((r) => r.attemptStatus === 'Not Started').length,
    avgScore: Number(avgScore.toFixed(1)),
    avgAccuracy: Number(avgAccuracy.toFixed(1)),
    topScore: completed.length ? Math.max(...completed.map((r) => r.score)) : 0,
  }
}
