import TestLanguage from '../models/TestLanguage.js'

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
    id: o.languageId,
    languageName: o.languageName,
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
    filter.$or = [{ languageName: regex }, { languageId: regex }]
  }
  return filter
}

function buildSort(query) {
  const sortBy = query.sortBy || 'createdAt'
  const sortDir = query.sortDir === 'asc' ? 1 : -1
  const fieldMap = {
    createdOn: 'createdAt',
    modifiedOn: 'updatedAt',
    languageName: 'languageName',
    createdAt: 'createdAt',
  }
  const field = fieldMap[sortBy] || 'createdAt'
  return { [field]: sortDir }
}

async function findDuplicateName(languageName, excludeId) {
  const filter = {
    languageName: { $regex: new RegExp(`^${escapeRegex(String(languageName).trim())}$`, 'i') },
  }
  if (excludeId) {
    filter.languageId = { $ne: excludeId }
  }
  return TestLanguage.findOne(filter).lean()
}

function nextLanguageId() {
  return `LG-${Math.floor(1000 + Math.random() * 8000)}`
}

export async function listLanguages(req, res, next) {
  try {
    const docs = await TestLanguage.find(buildFilter(req.query)).sort(buildSort(req.query)).lean()
    res.json({ success: true, data: docs.map(toClientRow) })
  } catch (err) {
    next(err)
  }
}

export async function getLanguage(req, res, next) {
  try {
    const doc = await TestLanguage.findOne({ languageId: req.params.id }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Language not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function createLanguage(req, res, next) {
  try {
    const languageName = String(req.body?.languageName ?? '').trim()
    if (!languageName) {
      return res.status(400).json({ success: false, message: 'Language is required' })
    }

    const duplicate = await findDuplicateName(languageName)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this name already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    let languageId = nextLanguageId()
    let attempts = 0
    while (attempts < 5) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await TestLanguage.findOne({ languageId }).lean()
      if (!exists) break
      languageId = nextLanguageId()
      attempts += 1
    }

    const doc = await TestLanguage.create({ languageId, languageName, status })
    res.status(201).json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function updateLanguage(req, res, next) {
  try {
    const languageName = String(req.body?.languageName ?? '').trim()
    if (!languageName) {
      return res.status(400).json({ success: false, message: 'Language is required' })
    }

    const duplicate = await findDuplicateName(languageName, req.params.id)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this name already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    const doc = await TestLanguage.findOneAndUpdate(
      { languageId: req.params.id },
      { languageName, status },
      { new: true, runValidators: true },
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Language not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function deleteLanguage(req, res, next) {
  try {
    const doc = await TestLanguage.findOneAndDelete({ languageId: req.params.id })
    if (!doc) return res.status(404).json({ success: false, message: 'Language not found' })
    res.json({ success: true, message: 'Language deleted' })
  } catch (err) {
    next(err)
  }
}
