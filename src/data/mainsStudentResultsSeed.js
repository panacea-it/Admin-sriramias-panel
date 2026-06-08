import { hashCode } from '../utils/evaluationProgressMetrics'

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Karthik', 'Divya',
  'Arjun', 'Meera', 'Aditya', 'Isha', 'Nikhil', 'Kavya', 'Rahul', 'Pooja',
]
const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Nair', 'Menon',
]
const EVALUATORS = ['Narasimha', 'Nikita', 'Darshana', 'Meghana', 'Arjun']

function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length]
}

export function generateMainsStudentResults(testItemId, testTitle = 'Mains Test', count = 48) {
  const seed = hashCode(String(testItemId))
  const rows = []

  for (let i = 0; i < count; i += 1) {
    const s = seed + i * 19
    const uploaded = s % 5 !== 0
    const evaluated = uploaded && s % 4 !== 0
    const marks = evaluated ? 45 + (s % 55) : null
    const maxMarks = 100
    const passFail =
      !evaluated ? 'Pending' : marks >= 50 ? 'Passed' : 'Failed'

    rows.push({
      id: `mains-res-${testItemId}-${i}`,
      studentName: `${pick(FIRST_NAMES, s)} ${pick(LAST_NAMES, s, 2)}`,
      registerNumber: `REG-${2026}-${String(1000 + i).padStart(4, '0')}`,
      uploadedStatus: uploaded ? 'Uploaded' : 'Not Uploaded',
      marks: marks ?? '—',
      maxMarks,
      rank: evaluated ? i + 1 : '—',
      passFailStatus: passFail,
      evaluatedBy: evaluated ? pick(EVALUATORS, s, 1) : '—',
      evaluationDate: evaluated
        ? `2026-0${1 + (s % 6)}-${String(12 + (s % 16)).padStart(2, '0')}`
        : '—',
      testTitle,
      filterEvaluated: evaluated ? 'Evaluated' : 'Pending',
      filterPassFail: passFail === 'Pending' ? 'Pending' : passFail,
    })
  }

  const evaluatedRows = rows.filter((r) => r.filterEvaluated === 'Evaluated' && typeof r.marks === 'number')
  evaluatedRows.sort((a, b) => b.marks - a.marks)
  evaluatedRows.forEach((r, idx) => {
    r.rank = idx + 1
  })

  return rows
}

export function summarizeMainsResults(rows = []) {
  const evaluated = rows.filter((r) => r.filterEvaluated === 'Evaluated' && typeof r.marks === 'number')
  const uploaded = rows.filter((r) => r.uploadedStatus === 'Uploaded')
  const passed = evaluated.filter((r) => r.passFailStatus === 'Passed')
  const failed = evaluated.filter((r) => r.passFailStatus === 'Failed')
  const marksList = evaluated.map((r) => r.marks)
  const avg =
    marksList.length > 0 ? marksList.reduce((s, m) => s + m, 0) / marksList.length : 0
  const top =
    evaluated.length > 0
      ? [...evaluated].sort((a, b) => b.marks - a.marks)[0]
      : null

  return {
    totalStudents: rows.length,
    totalDownloads: Math.min(rows.length, uploaded.length + Math.floor(rows.length * 0.05)),
    totalUploaded: uploaded.length,
    totalEvaluated: evaluated.length,
    pendingEvaluations: uploaded.length - evaluated.length,
    highestMarks: marksList.length ? Math.max(...marksList) : 0,
    lowestMarks: marksList.length ? Math.min(...marksList) : 0,
    averageMarks: Number(avg.toFixed(1)),
    topRanker: top ? top.studentName : '—',
    totalPassed: passed.length,
    totalFailed: failed.length,
    evaluationPct:
      uploaded.length > 0 ? Math.round((evaluated.length / uploaded.length) * 100) : 0,
  }
}
