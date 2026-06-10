export function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

/** Deterministic evaluation stats for admin dashboards (demo / derived). */
export function deriveEvaluationStats(testKey, baseAssigned = 200) {
  const seed = hashCode(String(testKey))
  const assigned = baseAssigned + (seed % 40)
  const uploaded = Math.min(assigned, assigned - 5 - (seed % 25))
  const evaluated = Math.min(uploaded, uploaded - 10 - (seed % 30))
  const pending = Math.max(0, uploaded - evaluated)
  const pct = uploaded > 0 ? Math.round((evaluated / uploaded) * 100) : 0
  const downloaded = Math.min(assigned, uploaded + 8 + (seed % 12))

  return {
    studentsAssigned: assigned,
    studentsDownloaded: downloaded,
    studentsUploaded: uploaded,
    studentsEvaluated: evaluated,
    pendingEvaluations: pending,
    evaluationPct: pct,
  }
}

export function evaluationProgressLabel(pct) {
  if (pct >= 90) return 'Completed'
  if (pct >= 50) return 'In Progress'
  if (pct > 0) return 'Under Review'
  return 'Not Started'
}
