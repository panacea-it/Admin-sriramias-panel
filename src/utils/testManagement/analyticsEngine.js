function clamp01(n) {
  const v = Number(n) || 0
  return Math.max(0, Math.min(1, v))
}

export function calcPercentage(score, total) {
  const s = Number(score) || 0
  const t = Math.max(Number(total) || 0, 1)
  return Math.round((s / t) * 1000) / 10
}

export function calcPercentile(rank, total) {
  const r = Math.max(Number(rank) || 0, 1)
  const n = Math.max(Number(total) || 0, 1)
  if (n === 1) return 100
  // Higher is better: rank 1 => 100, last => ~0
  const pct = (n - r) / (n - 1)
  return Math.round(clamp01(pct) * 1000) / 10
}

/**
 * Simple weak-area detector: lowest subject averages from given result rows.
 * @param {Array<{subject:string,percentage:number}>} rows
 */
export function getWeakSubjects(rows = [], { top = 3 } = {}) {
  const map = new Map()
  for (const r of rows) {
    const subject = r.subject || 'General'
    const cur = map.get(subject) || { subject, sum: 0, count: 0 }
    cur.sum += Number(r.percentage) || 0
    cur.count += 1
    map.set(subject, cur)
  }
  return Array.from(map.values())
    .map((x) => ({ subject: x.subject, avg: Math.round((x.sum / Math.max(x.count, 1)) * 10) / 10 }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, top)
}

