import mongoose from 'mongoose'
import BatchEnrollment from '../models/BatchEnrollment.js'
import Course from '../models/Course.js'

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function nextEnrollmentId() {
  const rows = await BatchEnrollment.find({}, { enrollmentId: 1 }).lean()
  const max = rows.reduce((m, row) => {
    const num = parseInt(String(row.enrollmentId || '').replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `ENR${String(max + 1).padStart(3, '0')}`
}

async function resolveBatchMongoId(batchIdParam) {
  const param = String(batchIdParam || '').trim()
  if (!param) return null

  if (mongoose.Types.ObjectId.isValid(param)) {
    const byMongo = await Course.findById(param).select('_id').lean()
    if (byMongo?._id) return byMongo._id
    return new mongoose.Types.ObjectId(param)
  }

  const byCode =
    (await Course.findOne({ batchId: param }).select('_id').lean()) ||
    (await Course.findOne({ batchCode: param }).select('_id').lean())
  return byCode?._id || null
}

function mapEnrollmentToApi(doc) {
  if (!doc) return null
  const row = doc.toObject ? doc.toObject() : doc
  return {
    _id: String(row._id),
    id: String(row._id),
    enrollmentId: row.enrollmentId || '—',
    studentName: row.studentName || '',
    email: row.email || '',
    mobileNumber: row.mobileNumber || '',
    batchId: row.batchId ? String(row.batchId) : '',
    paymentStatus: row.paymentStatus || 'PENDING',
    attendancePercentage: Number(row.attendancePercentage) || 0,
    courseProgressPercentage: Number(row.courseProgressPercentage) || 0,
    status: row.status || 'ACTIVE',
    enrolledAt: row.enrolledAt || row.createdAt || null,
    transferDate: row.transferDate || '',
    transferReason: row.transferReason || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function buildListFilter(batchMongoId, query = {}) {
  const filter = { batchId: batchMongoId }

  const search = String(query.search || '').trim()
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [
      { studentName: regex },
      { email: regex },
      { mobileNumber: regex },
      { enrollmentId: regex },
    ]
  }

  const paymentStatus = String(query.paymentStatus || '').trim().toUpperCase()
  if (paymentStatus && paymentStatus !== 'ALL') {
    filter.paymentStatus = paymentStatus
  }

  const status = String(query.status || '').trim().toUpperCase()
  if (status && status !== 'ALL') {
    filter.status = status === 'IN_ACTIVE' ? 'INACTIVE' : status
  }

  return filter
}

export async function listEnrollmentsByBatch(req, res, next) {
  try {
    const batchMongoId = await resolveBatchMongoId(req.params.batchId)
    if (!batchMongoId) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
    const filter = buildListFilter(batchMongoId, req.query)
    const total = await BatchEnrollment.countDocuments(filter)
    const rows = await BatchEnrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    res.json({
      success: true,
      data: rows.map(mapEnrollmentToApi),
      total,
      count: total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    next(error)
  }
}

export async function getEnrollmentById(req, res, next) {
  try {
    const id = String(req.params.enrollmentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment id' })
    }

    const doc = await BatchEnrollment.findById(id).lean()
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    res.json({ success: true, data: mapEnrollmentToApi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function createEnrollment(req, res, next) {
  try {
    const {
      studentName,
      email,
      mobileNumber,
      batchId,
      paymentStatus = 'PENDING',
      attendancePercentage = 0,
      courseProgressPercentage = 0,
    } = req.body || {}

    if (!studentName?.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required' })
    }
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Batch id is required' })
    }

    const batchMongoId = await resolveBatchMongoId(batchId)
    if (!batchMongoId) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    const enrollmentId = await nextEnrollmentId()
    const doc = await BatchEnrollment.create({
      enrollmentId,
      studentName: studentName.trim(),
      email: String(email || '').trim(),
      mobileNumber: String(mobileNumber || '').trim(),
      batchId: batchMongoId,
      paymentStatus: String(paymentStatus || 'PENDING').trim().toUpperCase() || 'PENDING',
      attendancePercentage: Math.min(100, Math.max(0, Number(attendancePercentage) || 0)),
      courseProgressPercentage: Math.min(100, Math.max(0, Number(courseProgressPercentage) || 0)),
      status: 'ACTIVE',
    })

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: mapEnrollmentToApi(doc),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateEnrollment(req, res, next) {
  try {
    const id = String(req.params.enrollmentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment id' })
    }

    const doc = await BatchEnrollment.findById(id)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    const {
      studentName,
      email,
      mobileNumber,
      paymentStatus,
      attendancePercentage,
      courseProgressPercentage,
    } = req.body || {}

    if (studentName?.trim()) doc.studentName = studentName.trim()
    if (email != null) doc.email = String(email).trim()
    if (mobileNumber != null) doc.mobileNumber = String(mobileNumber).trim()
    if (paymentStatus != null) {
      doc.paymentStatus = String(paymentStatus).trim().toUpperCase() || doc.paymentStatus
    }
    if (attendancePercentage != null) {
      doc.attendancePercentage = Math.min(100, Math.max(0, Number(attendancePercentage) || 0))
    }
    if (courseProgressPercentage != null) {
      doc.courseProgressPercentage = Math.min(
        100,
        Math.max(0, Number(courseProgressPercentage) || 0),
      )
    }

    await doc.save()
    res.json({ success: true, data: mapEnrollmentToApi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function updateEnrollmentStatus(req, res, next) {
  try {
    const id = String(req.params.enrollmentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment id' })
    }

    const doc = await BatchEnrollment.findById(id)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    const status = String(req.body?.status || 'ACTIVE')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
    doc.status = status === 'INACTIVE' || status === 'IN_ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await doc.save()

    res.json({ success: true, data: mapEnrollmentToApi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function moveEnrollment(req, res, next) {
  try {
    const id = String(req.params.enrollmentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment id' })
    }

    const doc = await BatchEnrollment.findById(id)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    const targetBatchId = req.body?.batchId || req.body?.targetBatchId
    const targetMongoId = await resolveBatchMongoId(targetBatchId)
    if (!targetMongoId) {
      return res.status(404).json({ success: false, message: 'Target batch not found' })
    }

    doc.batchId = targetMongoId
    if (req.body?.transferDate) doc.transferDate = String(req.body.transferDate).slice(0, 10)
    if (req.body?.reason) doc.transferReason = String(req.body.reason).trim()
    await doc.save()

    res.json({ success: true, data: mapEnrollmentToApi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function deleteEnrollment(req, res, next) {
  try {
    const id = String(req.params.enrollmentId || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment id' })
    }

    const doc = await BatchEnrollment.findByIdAndDelete(id)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    res.json({ success: true, message: 'Enrollment deleted' })
  } catch (error) {
    next(error)
  }
}
