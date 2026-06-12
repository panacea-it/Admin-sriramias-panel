import Course from '../models/Course.js'
import { getCourseCatalog } from './academicCourseController.js'

function buildListQuery(query) {
  const filter = {}
  const { search, category, status } = query

  if (category && category !== 'all') {
    filter.category = category
  }

  if (status && status !== 'all') {
    filter.status = status
  }

  if (search && String(search).trim()) {
    const q = String(search).trim()
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [
      { courseName: regex },
      { batchName: regex },
      { batchId: regex },
      { batchCode: regex },
      { courseId: regex },
      { linkedCourseName: regex },
      { mentorName: regex },
      { trainerName: regex },
      { category: regex },
      { center: regex },
    ]
  }

  return filter
}

function normalizeFeeDetails(fee = {}) {
  return {
    courseFee: Number(fee.courseFee) || 0,
    discountFee: Number(fee.discountFee) || 0,
    installmentAvailable: Boolean(fee.installmentAvailable),
    currency: fee.currency || 'INR',
  }
}

function pickBatchFields(body = {}) {
  const batchName = (body.batchName || body.courseName || '').trim()
  const feeDetails = normalizeFeeDetails(body.feeDetails ?? body.formData?.feeDetails)
  const { subjects: _legacySubjects, ...formDataRest } = body.formData || {}
  void _legacySubjects
  return {
    courseName: batchName,
    batchId: body.batchId?.trim() || '',
    batchCode: body.batchCode?.trim() || body.batchId?.trim() || '',
    batchName,
    courseId: body.courseId?.trim() || '',
    academicCourseId: body.academicCourseId?.trim() || '',
    linkedCourseName: body.linkedCourseName?.trim() || '',
    commencement: body.commencement || '',
    durationLabel: body.durationLabel?.trim() || '',
    batchStartFrom: body.batchStartFrom || '',
    batchEndTo: body.batchEndTo || '',
    bannerUrl: body.bannerUrl || body.bannerPreview || '',
    bannerFileName: body.bannerFileName?.trim() || '',
    brochureUrl: body.brochureUrl || body.formData?.brochureUrl || '',
    brochureFileName: body.brochureFileName?.trim() || body.formData?.brochureFileName?.trim() || '',
    brochureFileSize:
      body.brochureFileSize ?? body.formData?.brochureFileSize ?? null,
    mentorEmail: body.mentorEmail?.trim() || body.formData?.mentorEmail?.trim() || '',
    mentorEmployeeId:
      body.mentorEmployeeId?.trim() || body.formData?.mentorEmployeeId?.trim() || '',
    mentorName: body.mentorName?.trim() || body.formData?.mentorName?.trim() || '',
    mentorRoleId: body.mentorRoleId?.trim() || body.formData?.mentorRoleId?.trim() || '',
    mentorRoleLabel:
      body.mentorRoleLabel?.trim() || body.formData?.mentorRoleLabel?.trim() || '',
    trainerName:
      body.trainerName?.trim() ||
      body.formData?.trainerName?.trim() ||
      body.mentorName?.trim() ||
      body.formData?.mentorName?.trim() ||
      '',
    status: body.status || 'Active',
    category: body.category?.trim() || 'Batch',
    center: body.center?.trim() || '—',
    price: body.price?.trim() || '—',
    feeDetails,
    formData: body.formData ? { ...formDataRest, feeDetails } : { feeDetails },
  }
}

export async function getCourses(req, res, next) {
  try {
    if (req.query.purpose === 'catalog') {
      return getCourseCatalog(req, res, next)
    }

    const filter = buildListQuery(req.query)
    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean()

    res.json({
      success: true,
      count: courses.length,
      data: courses,
    })
  } catch (error) {
    next(error)
  }
}

export async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).lean()
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    res.json({ success: true, data: course })
  } catch (error) {
    next(error)
  }
}

export async function createCourse(req, res, next) {
  try {
    const fields = pickBatchFields(req.body)
    if (!fields.courseName) {
      return res.status(400).json({ success: false, message: 'Batch name is required' })
    }

    const course = await Course.create(fields)

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateCourse(req, res, next) {
  try {
    const fields = pickBatchFields(req.body)
    const updates = { ...fields }
    if (!updates.courseName) delete updates.courseName

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    res.json({
      success: true,
      message: 'Batch deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
