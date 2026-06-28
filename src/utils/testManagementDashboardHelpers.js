export function asArray(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeAccuracyHeatmap(accuracyHeatmap) {
  const empty = { subjects: [], difficulties: [], values: [] }
  if (!accuracyHeatmap) return empty

  if (Array.isArray(accuracyHeatmap)) {
    if (accuracyHeatmap.length === 0) return empty
    return {
      subjects: accuracyHeatmap.map((item) => item?.subject ?? ''),
      difficulties: ['easy', 'medium', 'hard'],
      values: accuracyHeatmap.map((item) => [
        item?.easy ?? 0,
        item?.medium ?? 0,
        item?.hard ?? 0,
      ]),
    }
  }

  if (typeof accuracyHeatmap === 'object') {
    return {
      subjects: asArray(accuracyHeatmap.subjects),
      difficulties: asArray(accuracyHeatmap.difficulties).length
        ? asArray(accuracyHeatmap.difficulties)
        : ['Easy', 'Medium', 'Hard'],
      values: asArray(accuracyHeatmap.values).map((row) => asArray(row)),
    }
  }

  return empty
}

export function normalizeSubjectWisePerformance(rows) {
  return asArray(rows).map((item) => ({
    ...item,
    subject: item?.subject ?? '',
    avgPercentage: item?.avgPercentage ?? item?.avg ?? 0,
    attempts: item?.attempts ?? 0,
  }))
}

export function normalizeTopScorers(rows) {
  return asArray(rows).map((item) => ({
    ...item,
    rank: item?.rank ?? '—',
    studentName: item?.studentName ?? item?.name ?? '—',
    rollNumber: item?.rollNumber ?? item?.roll ?? '—',
    score: item?.score ?? 0,
    subject: item?.subject ?? '',
  }))
}

export function normalizeWeakAreas(rows) {
  return asArray(rows).map((item) => ({
    ...item,
    topic: item?.topic ?? '',
    subject: item?.subject ?? '',
    accuracy: item?.accuracy ?? 0,
  }))
}

export function normalizeDashboardAnalytics(raw = {}) {
  const summary =
    raw?.summary && typeof raw.summary === 'object' ? raw.summary : {}

  return {
    summary: {
      avgAttemptRate: summary.avgAttemptRate ?? 0,
      topScorerAvg: summary.topScorerAvg ?? 0,
      accuracyIndex: summary.accuracyIndex ?? 0,
      ...summary,
    },
    subjectWisePerformance: normalizeSubjectWisePerformance(raw.subjectWisePerformance),
    accuracyHeatmap: normalizeAccuracyHeatmap(raw.accuracyHeatmap),
    topScorers: normalizeTopScorers(raw.topScorers),
    weakAreas: normalizeWeakAreas(raw.weakAreas),
  }
}

export function normalizeFacultyOverview(rows) {
  return asArray(rows).map((item) => ({
    facultyName: item?.facultyName ?? item?.faculty ?? '—',
    subject: item?.subject ?? '',
    testsConducted: item?.testsConducted ?? item?.tests ?? 0,
    avgPerformance: item?.avgPerformance ?? item?.avgScore ?? 0,
    studentsHandled: item?.studentsHandled ?? item?.participation ?? 0,
  }))
}

export function normalizeRecentActivities(rows) {
  return asArray(rows).map((act) => ({
    test: act?.test ?? act?.testName ?? '',
    faculty: act?.faculty ?? '',
    action: act?.action ?? act?.activity ?? '',
    time: act?.time ?? act?.timeAgo ?? '',
    status: act?.status ?? '',
  }))
}
