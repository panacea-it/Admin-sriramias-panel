import TestSectionConfig from '../models/TestSectionConfig.js'

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
    id: o.sectionId,
    sectionName: o.sectionName,
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
    filter.$or = [{ sectionName: regex }, { sectionId: regex }]
  }
  return filter
}

function buildSort(query) {
  const sortBy = query.sortBy || 'createdAt'
  const sortDir = query.sortDir === 'asc' ? 1 : -1
  const fieldMap = {
    createdOn: 'createdAt',
    modifiedOn: 'updatedAt',
    sectionName: 'sectionName',
    createdAt: 'createdAt',
  }
  const field = fieldMap[sortBy] || 'createdAt'
  return { [field]: sortDir }
}

async function findDuplicateName(sectionName, excludeId) {
  const filter = {
    sectionName: { $regex: new RegExp(`^${escapeRegex(String(sectionName).trim())}$`, 'i') },
  }
  if (excludeId) {
    filter.sectionId = { $ne: excludeId }
  }
  return TestSectionConfig.findOne(filter).lean()
}

function nextSectionId() {
  return `SEC-${Math.floor(1000 + Math.random() * 8000)}`
}

export async function listSectionConfigs(req, res, next) {
  try {
    const docs = await TestSectionConfig.find(buildFilter(req.query)).sort(buildSort(req.query)).lean()
    res.json({ success: true, data: docs.map(toClientRow) })
  } catch (err) {
    next(err)
  }
}

export async function getSectionConfig(req, res, next) {
  try {
    const doc = await TestSectionConfig.findOne({ sectionId: req.params.id }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Section not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function createSectionConfig(req, res, next) {
  try {
    const sectionName = String(req.body?.sectionName ?? '').trim()
    if (!sectionName) {
      return res.status(400).json({ success: false, message: 'Section name is required' })
    }

    const duplicate = await findDuplicateName(sectionName)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this name already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    let sectionId = nextSectionId()
    let attempts = 0
    while (attempts < 5) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await TestSectionConfig.findOne({ sectionId }).lean()
      if (!exists) break
      sectionId = nextSectionId()
      attempts += 1
    }

    const doc = await TestSectionConfig.create({ sectionId, sectionName, status })
    res.status(201).json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function updateSectionConfig(req, res, next) {
  try {
    const sectionName = String(req.body?.sectionName ?? '').trim()
    if (!sectionName) {
      return res.status(400).json({ success: false, message: 'Section name is required' })
    }

    const duplicate = await findDuplicateName(sectionName, req.params.id)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A record with this name already exists' })
    }

    const status = req.body?.status === 'Inactive' ? 'Inactive' : 'Active'
    const doc = await TestSectionConfig.findOneAndUpdate(
      { sectionId: req.params.id },
      { sectionName, status },
      { new: true, runValidators: true },
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Section not found' })
    res.json({ success: true, data: toClientRow(doc) })
  } catch (err) {
    next(err)
  }
}

export async function deleteSectionConfig(req, res, next) {
  try {
    const doc = await TestSectionConfig.findOneAndDelete({ sectionId: req.params.id })
    if (!doc) return res.status(404).json({ success: false, message: 'Section not found' })
    res.json({ success: true, message: 'Section deleted' })
  } catch (err) {
    next(err)
  }
}
