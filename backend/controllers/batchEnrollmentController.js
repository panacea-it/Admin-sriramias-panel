import mongoose from 'mongoose'
import BatchEnrollment from '../models/BatchEnrollment.js'
import Course from '../models/Course.js'
import EnrollmentTransferAudit from '../models/EnrollmentTransferAudit.js'

const INACTIVE_BATCH_STATUSES = new Set([
  'INACTIVE',
  'IN_ACTIVE',
  'DISABLED',
  'ARCHIVED',
  'CANCELLED',
  'COMPLETED',
  'DRAFT',
])

function isActiveBatchStatus(status) {
  const upper = String(status || 'Active')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  return !INACTIVE_BATCH_STATUSES.has(upper)
}

function batchDisplayLabel(doc) {
  if (!doc) return '—'
  const fd = doc.formData || {}
  const batchId = doc.batchId || fd.batchId || doc.batchCode || fd.batchCode || ''
  const batchName = doc.batchName || doc.courseName || ''
  return batchId && batchName ? `${batchId} - ${batchName}` : batchName || batchId || '—'
}

async function syncBatchStudentCount(batchMongoId) {
  if (!batchMongoId) return 0
  const count = await BatchEnrollment.countDocuments({
    batchId: batchMongoId,
    status: 'ACTIVE',
  })
  await Course.findByIdAndUpdate(
    batchMongoId,
    {
      $set: {
        totalStudents: count,
        'formData.totalStudents': count,
      },
    },
    { strict: false },
  )
  return count
}

async function findDuplicateInTargetBatch(enrollment, targetMongoId) {
  const baseFilter = {
    batchId: targetMongoId,
    status: 'ACTIVE',
    _id: { $ne: enrollment._id },
  }

  const email = String(enrollment.email || '').trim().toLowerCase()
  const mobile = String(enrollment.mobileNumber || '').trim()
  const or = []
  if (email) or.push({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') })
  if (mobile) or.push({ mobileNumber: mobile })

  if (or.length) {
    return BatchEnrollment.findOne({ ...baseFilter, $or: or }).lean()
  }

  const name = String(enrollment.studentName || '').trim()
  if (!name) return null
  return BatchEnrollment.findOne({
    ...baseFilter,
    studentName: new RegExp(`^${escapeRegex(name)}$`, 'i'),
  }).lean()
}

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

    await syncBatchStudentCount(batchMongoId)

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

    const sourceMongoId = doc.batchId
    if (String(sourceMongoId) === String(targetMongoId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move student to the same batch',
      })
    }

    const [sourceBatch, targetBatch] = await Promise.all([
      Course.findById(sourceMongoId).lean(),
      Course.findById(targetMongoId).lean(),
    ])

    if (!targetBatch) {
      return res.status(404).json({ success: false, message: 'Target batch not found' })
    }

    if (!isActiveBatchStatus(targetBatch.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move student to an inactive batch',
      })
    }

    const duplicate = await findDuplicateInTargetBatch(doc, targetMongoId)
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Student already exists in the destination batch',
      })
    }

    const targetFd = targetBatch.formData || {}
    const capacity = Number(targetFd.capacity) > 0 ? Number(targetFd.capacity) : 50
    const activeInTarget = await BatchEnrollment.countDocuments({
      batchId: targetMongoId,
      status: 'ACTIVE',
    })
    if (activeInTarget >= capacity) {
      return res.status(400).json({
        success: false,
        message: 'Target batch has no available seats',
      })
    }

    const remarks = String(req.body?.remarks || '').trim()
    const transferReason = String(req.body?.transferReason || req.body?.reason || remarks || '').trim()
    const branch = String(req.body?.branch || req.body?.center || '').trim()
    const course = String(req.body?.course || '').trim()
    const performedBy = String(req.body?.performedBy || req.headers['x-admin-name'] || 'Admin')
      .trim()
    const transferDate =
      String(req.body?.transferDate || '').slice(0, 10) ||
      new Date().toISOString().slice(0, 10)

    doc.batchId = targetMongoId
    doc.transferDate = transferDate
    if (transferReason) doc.transferReason = transferReason
    await doc.save()

    await EnrollmentTransferAudit.create({
      enrollmentMongoId: doc._id,
      studentId: doc.enrollmentId || String(doc._id),
      studentName: doc.studentName || '',
      oldBatchId: sourceMongoId,
      oldBatchLabel: batchDisplayLabel(sourceBatch),
      newBatchId: targetMongoId,
      newBatchLabel: batchDisplayLabel(targetBatch),
      performedBy,
      remarks,
      transferReason,
      transferDate,
      branch,
      course,
      transferAttendance: req.body?.transferAttendance !== false,
      transferFee: req.body?.transferFee !== false,
      transferTests: req.body?.transferTests !== false,
    })

    await Promise.all([
      syncBatchStudentCount(sourceMongoId),
      syncBatchStudentCount(targetMongoId),
    ])

    res.json({
      success: true,
      message: 'Student moved successfully',
      data: mapEnrollmentToApi(doc),
      meta: {
        oldBatchLabel: batchDisplayLabel(sourceBatch),
        newBatchLabel: batchDisplayLabel(targetBatch),
      },
    })
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

    await syncBatchStudentCount(doc.batchId)

    res.json({ success: true, message: 'Enrollment deleted' })
  } catch (error) {
    next(error)
  }
}
