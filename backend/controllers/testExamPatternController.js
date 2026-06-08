import TestExamPattern from '../models/TestExamPattern.js'

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function toClientRow(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : doc
  const createdOn = formatDate(o.createdAt)
  const modifiedOn = formatDate(o.updatedAt)
  return {
    id: o.instructionId,
    instructionDescription: o.instructionDescription,
    status: o.status,
    createdOn,
    modifiedOn,
    createdAt: createdOn,
  }
}

function buildFilter(query) {
  const filter = {}
  if (query.status && query.status !== 'all') {
    filter.status = query.status
  }
  if (query.search?.trim()) {
    const q = escapeRegex(query.search.trim())
    const regex = new RegExp(q, 'i')
    filter.$or = [{ instructionDescription: regex }, { instructionId: regex }]
  }
  return filter
}

function buildSort(query) {
  const sortBy = query.sortBy || 'createdAt'
  const sortDir = query.sortDir === 'asc' ? 1 : -1
  const fieldMap = {
    createdOn: 'createdAt',
    modifiedOn: 'updatedAt',
    instructionDescription: 'instructionDescription',
    createdAt: 'createdAt',
  }
  const field = fieldMap[sortBy] || 'createdAt'
  return { [field]: sortDir }
}

async function findDuplicateDescription(instructionDescription, excludeId) {
  const filter = {
    instructionDescription: {
      $regex: new RegExp(`^${escapeRegex(String(instructionDescription).trim())}$`, 'i'),
    },
  }
  if (excludeId) {
    filter.instructionId = { $ne: excludeId }
  }
  return TestExamPattern.findOne(filter).lean()
}

function nextInstructionId() {
  return `INS-${Math.floor(1000 + Math.random() * 8000)}`
}

export async function listExamPatterns(req, res, next) {
  try {
    const docs = await TestExamPattern.find(buildFilter(req.query)).sort(buildSort(req.query)).lean()
    res.json({ success: true, data: docs.map(toClientRow) })
  } catch (err) {
    next(err)
  }
}

export async function getExamPattern(req, res, next) {
  try {
    const doc = await TestExamPattern.findOne({ instructionId: req.params.id }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Instruction not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function createExamPattern(req, res, next) {
  try {
    const instructionDescription = String(req.body?.instructionDescription ?? '').trim()
    if (!instructionDescription) {
      return res.status(400).json({ success: false, message: 'Instruction description is required' })
    }

    const duplicate = await findDuplicateDescription(instructionDescription)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this description already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    let instructionId = nextInstructionId()
    let attempts = 0
    while (attempts < 5) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await TestExamPattern.findOne({ instructionId }).lean()
      if (!exists) break
      instructionId = nextInstructionId()
      attempts += 1
    }

    const doc = await TestExamPattern.create({ instructionId, instructionDescription, status })
    res.status(201).json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function updateExamPattern(req, res, next) {
  try {
    const instructionDescription = String(req.body?.instructionDescription ?? '').trim()
    if (!instructionDescription) {
      return res.status(400).json({ success: false, message: 'Instruction description is required' })
    }

    const duplicate = await findDuplicateDescription(instructionDescription, req.params.id)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this description already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    const doc = await TestExamPattern.findOneAndUpdate(
      { instructionId: req.params.id },
      { instructionDescription, status },
      { new: true, runValidators: true },
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Instruction not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function deleteExamPattern(req, res, next) {
  try {
    const doc = await TestExamPattern.findOneAndDelete({ instructionId: req.params.id })
    if (!doc) return res.status(404).json({ success: false, message: 'Instruction not found' })
    res.json({ success: true, message: 'Instruction deleted' })
  } catch (err) {
    next(err)
  }
}
