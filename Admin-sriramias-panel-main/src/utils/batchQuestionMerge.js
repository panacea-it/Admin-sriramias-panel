import { normalizeTestSeriesQuestion } from './batchTestSeriesForm'

export const MERGE_REPLACE = 'replace'
export const MERGE_SKIP = 'skip'
export const MERGE_RENAME = 'rename'

/** Find incoming questions that conflict on questionNo with existing list. */
export function findQuestionConflicts(existing = [], incoming = []) {
  const byNo = new Map(existing.map((q) => [String(q.questionNo), q]))
  const conflicts = []
  for (const q of incoming) {
    const key = String(q.questionNo)
    if (byNo.has(key)) {
      conflicts.push({
        questionNo: q.questionNo,
        existing: byNo.get(key),
        incoming: q,
      })
    }
  }
  return conflicts
}

function nextFreeQuestionNo(existing = [], incoming = []) {
  const used = new Set([
    ...existing.map((q) => q.questionNo),
    ...incoming.map((q) => q.questionNo),
  ])
  let n = 1
  while (used.has(n)) n += 1
  return n
}

/** Apply merge strategy for bulk import conflicts. */
export function mergeQuestionsWithStrategy(
  existing = [],
  incoming = [],
  strategy = MERGE_REPLACE,
) {
  const map = new Map(existing.map((q) => [String(q.questionNo), { ...q }]))

  for (const raw of incoming) {
    const q = normalizeTestSeriesQuestion(raw, incoming.length)
    const key = String(q.questionNo)

    if (!map.has(key)) {
      map.set(key, q)
      continue
    }

    if (strategy === MERGE_SKIP) continue

    if (strategy === MERGE_RENAME) {
      const newNo = nextFreeQuestionNo([...map.values()], incoming)
      map.set(String(newNo), { ...q, questionNo: newNo, id: `q-${newNo}-${Date.now()}` })
      continue
    }

    map.set(key, { ...q, id: map.get(key).id })
  }

  return [...map.values()].sort((a, b) => a.questionNo - b.questionNo)
}

export function chunkArray(arr, size = 100) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

/** Process large question arrays without blocking the main thread. */
export async function processQuestionsInChunks(items, processor, chunkSize = 100) {
  const chunks = chunkArray(items, chunkSize)
  const out = []
  for (let i = 0; i < chunks.length; i++) {
    out.push(...chunks[i].map((item, j) => processor(item, i * chunkSize + j)))
    await new Promise((r) => setTimeout(r, 0))
  }
  return out.filter(Boolean)
}
