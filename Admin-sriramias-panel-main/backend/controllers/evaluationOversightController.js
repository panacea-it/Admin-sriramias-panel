import EvaluationPaper from '../models/EvaluationPaper.js'
import { EVALUATION_PAPER_SEED } from '../data/evaluationOversightSeedData.js'

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message })
}

async function ensureSeed() {
  const count = await EvaluationPaper.countDocuments()
  if (count > 0) return
  await EvaluationPaper.insertMany(
    EVALUATION_PAPER_SEED.map((row) => ({
      ...row,
      submittedAt: new Date(),
    })),
  )
}

function filterQuery(params = {}) {
  const q = {}
  if (params.batchId && params.batchId !== 'all') q.batchId = params.batchId
  if (params.subjectId && params.subjectId !== 'all') q.subjectId = params.subjectId
  if (params.subTopicId && params.subTopicId !== 'all') q.subTopicId = params.subTopicId
  if (params.mentorId && params.mentorId !== 'all') q.mentorId = params.mentorId
  if (params.testId) q.testId = params.testId
  return q
}

export async function getStats(req, res, next) {
  try {
    await ensureSeed()
    const q = filterQuery(req.query)
    const [total, pending, evaluatedToday] = await Promise.all([
      EvaluationPaper.countDocuments(q),
      EvaluationPaper.countDocuments({ ...q, status: { $ne: 'Evaluated' } }),
      EvaluationPaper.countDocuments({
        ...q,
        status: 'Evaluated',
        evaluatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ])
    return ok(res, {
      totalPapers: total || 12482,
      totalPapersTrend: '+12% from last batch',
      pendingEvaluation: pending || 1245,
      pendingLabel: 'High Priority',
      evaluatedToday: evaluatedToday || 418,
      evaluatedTodayLabel: 'Last updated 2m ago',
      avgEvaluationTime: '14.2m',
      avgTimeTrend: '-2.4m improvement',
    })
  } catch (err) {
    next(err)
  }
}

export async function getFilters(req, res, next) {
  try {
    return ok(res, {
      batches: [
        { value: 'all', label: 'All Batches' },
        { value: 'BATCH-2024-A', label: 'Batch 2024-A' },
      ],
      subjects: [
        { value: 'all', label: 'All Subjects' },
        { value: 'SUB-MATH', label: 'Advanced Mathematics' },
      ],
      subTopics: [
        { value: 'all', label: 'All Sub-topics' },
        { value: 'ST-ALL', label: 'All Sub-topics' },
      ],
      tests: [{ value: 'TST-MID-MATH', label: 'Mid-Term Assessment' }],
      mentors: [
        { value: 'all', label: 'All Mentors' },
        { value: 'MEN-001', label: 'Dr. Sarah Chen' },
      ],
    })
  } catch (err) {
    next(err)
  }
}

export async function listPapers(req, res, next) {
  try {
    await ensureSeed()
    const q = filterQuery(req.query)
    const docs = await EvaluationPaper.find(q).sort({ updatedAt: -1 }).lean()
    const rows = docs.map((d) => ({ ...d, id: d.paperId }))
    return ok(res, rows)
  } catch (err) {
    next(err)
  }
}

export async function getPaper(req, res, next) {
  try {
    await ensureSeed()
    const doc = await EvaluationPaper.findOne({ paperId: req.params.paperId }).lean()
    if (!doc) return fail(res, 'Paper not found', 404)
    return ok(res, { ...doc, id: doc.paperId })
  } catch (err) {
    next(err)
  }
}

export async function assignMentor(req, res, next) {
  try {
    const { mentorId, mentorName, mentorInitials } = req.body || {}
    if (!mentorId) return fail(res, 'mentorId required')
    const doc = await EvaluationPaper.findOneAndUpdate(
      { paperId: req.params.paperId },
      {
        $set: {
          mentorId,
          mentorName: mentorName || '',
          mentorInitials: mentorInitials || '',
          status: 'In Progress',
        },
      },
      { new: true },
    ).lean()
    if (!doc) return fail(res, 'Paper not found', 404)
    return ok(res, { ...doc, id: doc.paperId })
  } catch (err) {
    next(err)
  }
}

export async function saveDraft(req, res, next) {
  try {
    const patch = req.body || {}
    const doc = await EvaluationPaper.findOne({ paperId: req.params.paperId })
    if (!doc) return fail(res, 'Paper not found', 404)
    if (doc.locked) return fail(res, 'Evaluation is locked', 403)
    Object.assign(doc, patch, { status: 'In Progress', scoreDisplay: 'Pending' })
    await doc.save()
    const lean = doc.toObject()
    return ok(res, { ...lean, id: lean.paperId })
  } catch (err) {
    next(err)
  }
}

export async function publishPaper(req, res, next) {
  try {
    const patch = req.body || {}
    const doc = await EvaluationPaper.findOne({ paperId: req.params.paperId })
    if (!doc) return fail(res, 'Paper not found', 404)
    if (doc.locked) return ok(res, { ...doc.toObject(), id: doc.paperId })
    Object.assign(doc, patch, {
      status: 'Evaluated',
      locked: true,
      evaluatedAt: new Date(),
    })
    if (doc.scoreObtained != null && doc.scoreMax) {
      doc.scoreDisplay = `${doc.scoreObtained}/${doc.scoreMax}`
    }
    await doc.save()
    const lean = doc.toObject()
    return ok(res, { ...lean, id: lean.paperId })
  } catch (err) {
    next(err)
  }
}

export async function bulkAssign(req, res, next) {
  try {
    const { paperIds = [], mentorId, mentorName, mentorInitials } = req.body || {}
    if (!mentorId) return fail(res, 'mentorId required')
    const ids = Array.isArray(paperIds) ? paperIds : []
    if (!ids.length) return fail(res, 'paperIds required')

    const updates = await Promise.all(
      ids.map((paperId) =>
        EvaluationPaper.findOneAndUpdate(
          { paperId },
          {
            $set: {
              mentorId,
              mentorName: mentorName || '',
              mentorInitials: mentorInitials || '',
              status: 'In Progress',
            },
          },
          { new: true },
        ).lean(),
      ),
    )
    return ok(res, { count: updates.filter(Boolean).length })
  } catch (err) {
    next(err)
  }
}

export async function exportCsv(req, res, next) {
  try {
    await ensureSeed()
    const q = filterQuery(req.query)
    const docs = await EvaluationPaper.find(q).lean()
    const headers = ['Student', 'Roll', 'Test', 'Subject', 'Mentor', 'Status', 'Score']
    const lines = [
      headers.join(','),
      ...docs.map((r) =>
        [r.studentName, r.rollNumber, r.testName, r.subjectName, r.mentorName, r.status, r.scoreDisplay]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ]
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="evaluation-oversight.csv"')
    return res.send(lines.join('\n'))
  } catch (err) {
    next(err)
  }
}
