import ContentLibrary from '../models/ContentLibrary.js'
import ContentSubject from '../models/ContentSubject.js'
import ContentTopic from '../models/ContentTopic.js'
import ContentCategory from '../models/ContentCategory.js'
import ContentAccessRule from '../models/ContentAccessRule.js'
import ContentVersion from '../models/ContentVersion.js'
import ContentAnalytics from '../models/ContentAnalytics.js'
import ContentBookmark from '../models/ContentBookmark.js'
import ContentView from '../models/ContentView.js'

function buildItemFilter(query) {
  const filter = {}
  if (query.status && query.status !== 'all') filter.status = query.status
  if (query.contentType && query.contentType !== 'all') filter.contentType = query.contentType
  if (query.categoryId && query.categoryId !== 'all') filter.categoryId = query.categoryId
  if (query.subjectId && query.subjectId !== 'all') filter.subjectIds = query.subjectId
  if (query.search?.trim()) {
    const q = query.search.trim()
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ title: regex }, { description: regex }, { tags: regex }]
  }
  if (query.recycle === 'true') {
    filter.status = 'Deleted'
  } else if (query.excludeDeleted !== 'false') {
    filter.status = { $ne: 'Deleted' }
  }
  return filter
}

function toPlain(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : doc
  return { ...o, id: String(o._id || o.id) }
}

export async function listItems(req, res, next) {
  try {
    const docs = await ContentLibrary.find(buildItemFilter(req.query))
      .sort({ updatedAt: -1 })
      .lean()
    res.json({ success: true, data: docs.map((d) => ({ ...d, id: String(d._id) })) })
  } catch (err) {
    next(err)
  }
}

export async function getItem(req, res, next) {
  try {
    const doc = await ContentLibrary.findById(req.params.id).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: { ...doc, id: String(doc._id) } })
  } catch (err) {
    next(err)
  }
}

export async function createItem(req, res, next) {
  try {
    const doc = await ContentLibrary.create(req.body)
    res.status(201).json({ success: true, data: toPlain(doc) })
  } catch (err) {
    next(err)
  }
}

export async function updateItem(req, res, next) {
  try {
    const doc = await ContentLibrary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: toPlain(doc) })
  } catch (err) {
    next(err)
  }
}

export async function deleteItem(req, res, next) {
  try {
    const permanent = req.query.permanent === 'true'
    if (permanent) {
      await ContentLibrary.findByIdAndDelete(req.params.id)
      return res.json({ success: true, message: 'Permanently deleted' })
    }
    const doc = await ContentLibrary.findByIdAndUpdate(
      req.params.id,
      { status: 'Deleted', deletedAt: new Date() },
      { new: true },
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: toPlain(doc) })
  } catch (err) {
    next(err)
  }
}

async function crudList(Model, res, next) {
  try {
    const docs = await Model.find().sort({ createdAt: -1 }).lean()
    res.json({ success: true, data: docs.map((d) => ({ ...d, id: String(d._id) })) })
  } catch (err) {
    next(err)
  }
}

export const listSubjects = (req, res, next) => crudList(ContentSubject, res, next)
export const listTopics = (req, res, next) => crudList(ContentTopic, res, next)
export const listCategories = (req, res, next) => crudList(ContentCategory, res, next)
export const listAccessRules = (req, res, next) => crudList(ContentAccessRule, res, next)

export async function listVersions(req, res, next) {
  try {
    const docs = await ContentVersion.find({ contentId: req.params.contentId })
      .sort({ version: -1 })
      .lean()
    res.json({ success: true, data: docs.map((d) => ({ ...d, id: String(d._id) })) })
  } catch (err) {
    next(err)
  }
}

export async function getAnalyticsSummary(req, res, next) {
  try {
    const [uploads, views, downloads] = await Promise.all([
      ContentLibrary.countDocuments({ status: { $ne: 'Deleted' } }),
      ContentAnalytics.countDocuments({ event: 'view' }),
      ContentAnalytics.countDocuments({ event: 'download' }),
    ])
    res.json({
      success: true,
      data: { totalUploads: uploads, totalViews: views, totalDownloads: downloads },
    })
  } catch (err) {
    next(err)
  }
}

export async function recordStudentView(req, res, next) {
  try {
    const { contentId, studentId, progress, watchSeconds } = req.body
    await ContentView.findOneAndUpdate(
      { contentId, studentId },
      { progress, watchSeconds, lastPosition: watchSeconds },
      { upsert: true, new: true },
    )
    await ContentAnalytics.create({
      contentId,
      studentId,
      event: 'view',
      watchSeconds,
      completionPct: progress,
    })
    await ContentLibrary.findByIdAndUpdate(contentId, { $inc: { views: 1 } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function toggleBookmark(req, res, next) {
  try {
    const { contentId, studentId } = req.body
    const existing = await ContentBookmark.findOne({ contentId, studentId })
    if (existing) {
      await existing.deleteOne()
      return res.json({ success: true, bookmarked: false })
    }
    await ContentBookmark.create({ contentId, studentId })
    res.json({ success: true, bookmarked: true })
  } catch (err) {
    next(err)
  }
}
