function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * AIR ranking per test with tie support.
 * - Higher score => better rank (1 is best)
 * - Ties share the same rank, next rank is skipped (competition ranking: 1,2,2,4)
 * - Only ranks Evaluated / Published rows; Processing gets null rank
 *
 * @param {Array<{id:string,testId:string,score:number,total:number,status:string}>} rows
 * @returns {Map<string, number>} resultId -> rank
 */
export function computeAIRRanks(rows = []) {
  const out = new Map()
  const byTest = new Map()

  for (const r of rows) {
    const status = String(r.status || '')
    if (status !== 'Evaluated' && status !== 'Published') continue
    const key = String(r.testId ?? 'unknown')
    const list = byTest.get(key) || []
    list.push(r)
    byTest.set(key, list)
  }

  for (const [testId, list] of byTest.entries()) {
    const sorted = [...list].sort((a, b) => {
      const bs = toNumber(b.score) - toNumber(a.score)
      if (bs !== 0) return bs
      // Secondary: higher percentage if totals differ
      const bp = toNumber(b.score) / Math.max(toNumber(b.total), 1)
      const ap = toNumber(a.score) / Math.max(toNumber(a.total), 1)
      const dp = bp - ap
      if (dp !== 0) return dp
      // Stable: id asc
      return String(a.id).localeCompare(String(b.id))
    })

    let rank = 1
    let seen = 0
    let prevScore = null
    let prevPct = null

    for (const r of sorted) {
      seen += 1
      const score = toNumber(r.score)
      const pct = score / Math.max(toNumber(r.total), 1)
      const isTie = prevScore != null && score === prevScore && pct === prevPct
      if (!isTie) {
        rank = seen
        prevScore = score
        prevPct = pct
      }
      out.set(String(r.id), rank)
    }

    // Keep lint happy about unused key in some tooling
    void testId
  }

  return out
}

