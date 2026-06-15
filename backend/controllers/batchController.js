import mongoose from 'mongoose'
import Course from '../models/Course.js'

const INACTIVE_STATUSES = new Set([
  'INACTIVE',
  'IN_ACTIVE',
  'DISABLED',
  'ARCHIVED',
  'CANCELLED',
  'COMPLETED',
])

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mapUiStatusToDb(status) {
  const upper = String(status || 'Active')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  return INACTIVE_STATUSES.has(upper) || upper === 'INACTIVE' ? 'In Active' : 'Active'
}

function mapDbStatusToUi(status) {
  const upper = String(status || 'Active')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  return INACTIVE_STATUSES.has(upper) ? 'Inactive' : 'Active'
}

function normalizeFeeDetails(fee = {}) {
  let parsed = fee
  if (typeof fee === 'string') {
    try {
      parsed = JSON.parse(fee)
    } catch {
      parsed = {}
    }
  }
  return {
    currency: parsed.currency || 'INR',
    onlineAmount: Number(parsed.onlineAmount ?? parsed.onlinePaymentAmount) || 0,
    offlineAmount: Number(parsed.offlineAmount ?? parsed.offlinePaymentAmount) || 0,
    discountAmount: Number(parsed.discountAmount ?? parsed.discountFee) || 0,
    onlineBulletPoints: parsed.onlineBulletPoints ?? parsed.onlinePaymentBullets ?? [],
    offlineBulletPoints: parsed.offlineBulletPoints ?? parsed.offlinePaymentBullets ?? [],
  }
}

async function nextBatchId() {
  const rows = await Course.find({}, { batchId: 1 }).lean()
  const max = rows.reduce((m, row) => {
    const num = parseInt(String(row.batchId || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `BAT${String(max + 1).padStart(3, '0')}`
}

function buildListFilter(query = {}) {
  const filter = {}
  const { search, status } = query

  if (status && status !== 'all') {
    filter.status = mapUiStatusToDb(status)
  }

  const searchTerm = [
    search,
    query.batchId,
    query.batchName,
    query.courseName,
    query.mentorName,
  ]
    .map((v) => String(v || '').trim())
    .find(Boolean)

  if (searchTerm) {
    const q = escapeRegex(searchTerm)
    const regex = new RegExp(q, 'i')
    filter.$or = [
      { batchId: regex },
      { batchCode: regex },
      { batchName: regex },
      { courseName: regex },
      { linkedCourseName: regex },
      { mentorName: regex },
      { trainerName: regex },
    ]
  }

  return filter
}

function mapCourseToBatchApi(doc) {
  if (!doc) return null
  const fd = doc.formData || {}
  const fees = normalizeFeeDetails(doc.feeDetails || fd.feeDetails || fd.feesJson)
  const mongoId = doc._id ? String(doc._id) : ''
  const humanBatchId = doc.batchId || fd.batchId || ''
  const batchCode = doc.batchCode || fd.batchCode || humanBatchId || ''

  return {
    _id: mongoId,
    id: mongoId,
    batchId: humanBatchId,
    batchCode,
    batchName: doc.batchName || doc.courseName || '',
    name: doc.batchName || doc.courseName || '',
    courseId: doc.courseId || fd.courseId || '',
    academicCourseId: doc.academicCourseId || fd.academicCourseId || '',
    courseName: doc.linkedCourseName || doc.courseName || fd.courseName || '',
    linkedCourseName: doc.linkedCourseName || doc.courseName || '',
    commencementDate: doc.commencement || fd.commencement || '',
    commencement: doc.commencement || fd.commencement || '',
    durationLabel: doc.durationLabel || fd.durationLabel || '',
    batchStartDate: doc.batchStartFrom || fd.batchStartFrom || '',
    batchStartFrom: doc.batchStartFrom || fd.batchStartFrom || '',
    batchEndDate: doc.batchEndTo || fd.batchEndTo || '',
    batchEndTo: doc.batchEndTo || fd.batchEndTo || '',
    bannerImageUrl: doc.bannerUrl || fd.bannerUrl || '',
    bannerUrl: doc.bannerUrl || fd.bannerUrl || '',
    brochureUrl: doc.brochureUrl || fd.brochureUrl || '',
    brochureFileName: doc.brochureFileName || fd.brochureFileName || '',
    mentorName: doc.mentorName || fd.mentorName || '',
    mentorEmail: doc.mentorEmail || fd.mentorEmail || '',
    mentorEmployeeId: doc.mentorEmployeeId || fd.mentorEmployeeId || '',
    mentorRoleLabel: doc.mentorRoleLabel || fd.mentorRoleLabel || '',
    trainerName: doc.trainerName || doc.mentorName || fd.trainerName || '',
    status: mapDbStatusToUi(doc.status),
    fees,
    feeDetails: fees,
    totalStudents: doc.totalStudents ?? fd.totalStudents ?? 0,
    studentCount: doc.totalStudents ?? fd.totalStudents ?? 0,
    formData: { ...fd, feeDetails: fees },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    modifiedAt: doc.updatedAt,
  }
}

function extractBodyFields(body = {}) {
  let feesJson = body.feesJson
  if (typeof feesJson === 'string') {
    try {
      feesJson = JSON.parse(feesJson)
    } catch {
      feesJson = {}
    }
  }
  const fees = normalizeFeeDetails(feesJson || body.feeDetails || {})
  const batchName = String(body.batchName || body.courseName || '').trim()
  const batchCode = String(body.batchCode || '').trim()
  return {
    batchName,
    courseName: batchName,
    batchCode,
    courseId: String(body.courseId || '').trim(),
    academicCourseId: String(body.academicCourseId || body.courseId || '').trim(),
    linkedCourseName: String(body.linkedCourseName || body.courseName || '').trim(),
    commencement: body.commencementDate || body.commencement || '',
    durationLabel: body.durationLabel || (body.durationInMonths ? `${body.durationInMonths} Months` : ''),
    batchStartFrom: body.batchStartDate || body.batchStartFrom || '',
    batchEndTo: body.batchEndDate || body.batchEndTo || '',
    mentorEmail: String(body.mentorEmail || '').trim(),
    mentorEmployeeId: String(body.mentorEmployeeId || '').trim(),
    mentorName: String(body.mentorName || '').trim(),
    mentorRoleId: String(body.mentorRoleId || '').trim(),
    mentorRoleLabel: String(body.mentorRoleLabel || '').trim(),
    trainerName: String(body.trainerName || body.mentorName || '').trim(),
    status: mapUiStatusToDb(body.status || 'Active'),
    bannerUrl: body.bannerUrl || body.bannerPreview || '',
    bannerFileName: body.bannerFileName || '',
    brochureUrl: body.brochureUrl || '',
    brochureFileName: body.brochureFileName || '',
    brochureFileSize: body.brochureFileSize ?? null,
    feeDetails: {
      courseFee: fees.onlineAmount,
      discountFee: fees.discountAmount,
      installmentAvailable: false,
      currency: fees.currency,
      onlineAmount: fees.onlineAmount,
      offlineAmount: fees.offlineAmount,
      onlineBulletPoints: fees.onlineBulletPoints,
      offlineBulletPoints: fees.offlineBulletPoints,
    },
    formData: {
      ...body,
      batchName,
      batchCode,
      feeDetails: fees,
      status: mapDbStatusToUi(mapUiStatusToDb(body.status || 'Active')),
    },
  }
}

async function findBatchByParam(idParam) {
  const param = String(idParam || '').trim()
  if (!param) return null

  if (mongoose.Types.ObjectId.isValid(param)) {
    const byMongo = await Course.findById(param).lean()
    if (byMongo) return byMongo
  }

  return (
    (await Course.findOne({ batchId: param }).lean()) ||
    (await Course.findOne({ batchCode: param }).lean())
  )
}

async function assertUniqueBatch({ batchName, batchCode, batchId, excludeId }) {
  const filterName = { batchName: new RegExp(`^${escapeRegex(batchName)}$`, 'i') }
  const filterCode = batchCode ? { batchCode: new RegExp(`^${escapeRegex(batchCode)}$`, 'i') } : null
  const filterId = batchId ? { batchId: new RegExp(`^${escapeRegex(batchId)}$`, 'i') } : null

  if (excludeId) {
    filterName._id = { $ne: excludeId }
    if (filterCode) filterCode._id = { $ne: excludeId }
    if (filterId) filterId._id = { $ne: excludeId }
  }

  if (batchName) {
    const nameHit = await Course.findOne(filterName).lean()
    if (nameHit) {
      return { ok: false, message: 'This Batch Name already exists.' }
    }
  }
  if (filterCode) {
    const codeHit = await Course.findOne(filterCode).lean()
    if (codeHit) {
      return { ok: false, message: 'This Batch Code already exists.' }
    }
  }
  if (filterId) {
    const idHit = await Course.findOne(filterId).lean()
    if (idHit) {
      return { ok: false, message: 'This Batch ID already exists.' }
    }
  }
  return { ok: true }
}

function validateBatchPayload(fields, { isEdit = false } = {}) {
  const errors = []
  if (!fields.batchName) errors.push('Batch name is required')
  if (!fields.batchCode && !isEdit) errors.push('Batch code is required')
  if (!fields.courseId && !fields.academicCourseId) errors.push('Course is required')
  if (!fields.commencement) errors.push('Date of commencement is required')
  if (!fields.durationLabel) errors.push('Duration is required')
  if (!fields.batchStartFrom) errors.push('Batch start date is required')
  if (!fields.batchEndTo) errors.push('Batch end date is required')
  if (!fields.status) errors.push('Status is required')
  if (!fields.brochureUrl && !fields.brochureFileName) errors.push('Batch brochure is required')

  const fees = fields.feeDetails || {}
  if (!fees.onlineAmount && fees.onlineAmount !== 0) errors.push('Online payment amount is required')
  if (!fees.offlineAmount && fees.offlineAmount !== 0) errors.push('Offline payment amount is required')
  if (!(fees.onlineBulletPoints || []).length) errors.push('Online payment bullet points are required')
  if (!(fees.offlineBulletPoints || []).length) errors.push('Offline payment bullet points are required')

  return errors
}

export async function listBatches(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 20))
    const filter = buildListFilter(req.query)
    const total = await Course.countDocuments(filter)
    const rows = await Course.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    res.json({
      success: true,
      data: rows.map(mapCourseToBatchApi),
      total,
      count: total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    next(error)
  }
}

export async function getBatchById(req, res, next) {
  try {
    const doc = await findBatchByParam(req.params.batchId)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }
    res.json({ success: true, data: mapCourseToBatchApi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function getBatchQuickView(req, res, next) {
  return getBatchById(req, res, next)
}

export async function createBatch(req, res, next) {
  try {
    const fields = extractBodyFields(req.body)
    const validationErrors = validateBatchPayload(fields)
    if (validationErrors.length) {
      return res.status(400).json({ success: false, message: validationErrors[0], errors: validationErrors })
    }

    const generatedBatchId = await nextBatchId()
    const unique = await assertUniqueBatch({
      batchName: fields.batchName,
      batchCode: fields.batchCode,
      batchId: generatedBatchId,
    })
    if (!unique.ok) {
      return res.status(409).json({ success: false, message: unique.message })
    }

    const doc = await Course.create({
      ...fields,
      batchId: generatedBatchId,
      category: 'Batch',
      center: '—',
      price: '—',
    })

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: mapCourseToBatchApi(doc.toObject()),
    })
  } catch (error) {
    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0]
      const message =
        key === 'batchCode'
          ? 'This Batch Code already exists.'
          : key === 'batchId'
            ? 'This Batch ID already exists.'
            : 'Duplicate batch record'
      return res.status(409).json({ success: false, message })
    }
    next(error)
  }
}

export async function updateBatch(req, res, next) {
  try {
    const existing = await findBatchByParam(req.params.batchId)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    const fields = extractBodyFields(req.body)
    const validationErrors = validateBatchPayload(fields, { isEdit: true })
    if (validationErrors.length) {
      return res.status(400).json({ success: false, message: validationErrors[0], errors: validationErrors })
    }

    const unique = await assertUniqueBatch({
      batchName: fields.batchName,
      batchCode: existing.batchCode,
      batchId: existing.batchId,
      excludeId: existing._id,
    })
    if (!unique.ok) {
      return res.status(409).json({ success: false, message: unique.message })
    }

    const updates = { ...fields, batchCode: existing.batchCode, batchId: existing.batchId }
    const doc = await Course.findByIdAndUpdate(existing._id, updates, {
      new: true,
      runValidators: true,
    }).lean()

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: mapCourseToBatchApi(doc),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateBatchStatus(req, res, next) {
  try {
    const existing = await findBatchByParam(req.params.batchId)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    const nextStatus = mapUiStatusToDb(req.body?.status || 'Active')

    const doc = await Course.findByIdAndUpdate(
      existing._id,
      { status: nextStatus },
      { new: true, runValidators: true },
    ).lean()

    res.json({
      success: true,
      message: 'Batch status updated',
      data: mapCourseToBatchApi(doc),
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteBatch(req, res, next) {
  try {
    const existing = await findBatchByParam(req.params.batchId)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    await Course.findByIdAndDelete(existing._id)

    res.json({
      success: true,
      message: 'Batch deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function duplicateBatch(req, res, next) {
  try {
    const source = await findBatchByParam(req.params.batchId)
    if (!source) {
      return res.status(404).json({ success: false, message: 'Source batch not found' })
    }

    const fields = extractBodyFields(req.body)
    const validationErrors = validateBatchPayload(fields)
    if (validationErrors.length) {
      return res.status(400).json({ success: false, message: validationErrors[0], errors: validationErrors })
    }

    const generatedBatchId = await nextBatchId()
    const unique = await assertUniqueBatch({
      batchName: fields.batchName,
      batchCode: fields.batchCode,
      batchId: generatedBatchId,
    })
    if (!unique.ok) {
      return res.status(409).json({ success: false, message: unique.message })
    }

    const doc = await Course.create({
      ...fields,
      batchId: generatedBatchId,
      category: source.category || 'Batch',
      center: source.center || '—',
      price: source.price || '—',
    })

    res.status(201).json({
      success: true,
      message: 'Batch duplicated successfully',
      data: mapCourseToBatchApi(doc.toObject()),
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate batch record' })
    }
    next(error)
  }
}

export async function getBatchesDropdown(req, res, next) {
  try {
    const filter = {}
    if (String(req.query.activeOnly || '').toLowerCase() === 'true') {
      filter.status = { $in: ['Active', 'ACTIVE'] }
    }

    const rows = await Course.find(filter).sort({ batchName: 1 }).lean()
    res.json({
      success: true,
      data: rows.map((doc) => {
        const fd = doc.formData || {}
        return {
          _id: doc._id,
          id: String(doc._id),
          batchId: doc.batchId,
          batchCode: doc.batchCode,
          batchName: doc.batchName || doc.courseName,
          courseName: doc.linkedCourseName || doc.courseName,
          linkedCourseName: doc.linkedCourseName || doc.courseName,
          courseId: doc.courseId || fd.courseId || '',
          academicCourseId: doc.academicCourseId || fd.academicCourseId || '',
          center: doc.center || fd.center || '',
          mentorName: doc.mentorName || fd.mentorName || doc.trainerName || '',
          status: doc.status || 'Active',
          capacity: Number(fd.capacity) > 0 ? Number(fd.capacity) : 50,
          totalStudents: doc.totalStudents ?? fd.totalStudents ?? 0,
        }
      }),
    })
  } catch (error) {
    next(error)
  }
}
