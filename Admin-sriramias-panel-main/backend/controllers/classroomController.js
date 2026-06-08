import Classroom from '../models/Classroom.js'
import LiveClassBooking from '../models/LiveClassBooking.js'
import {
  buildDateTime,
  computeEnd,
  findBookingConflict,
  getOccupiedClassroomIds,
} from '../services/classroomSchedulingService.js'

function formatRow(doc) {
  if (!doc) return null
  const row = doc.toObject ? doc.toObject() : doc
  return {
    id: String(row._id),
    name: row.name,
    code: row.code,
    capacity: row.capacity,
    description: row.description,
    status: row.status,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    modifiedAt: row.updatedAt,
  }
}

export async function listClassrooms(req, res, next) {
  try {
    const filter = {}
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status
    }
    const rows = await Classroom.find(filter).sort({ name: 1 })
    res.json({ success: true, classrooms: rows.map(formatRow) })
  } catch (e) {
    next(e)
  }
}

export async function createClassroom(req, res, next) {
  try {
    const { name, code, capacity, description, status, color } = req.body
    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and code are required' })
    }
    const existing = await Classroom.findOne({
      $or: [
        { name: new RegExp(`^${name.trim()}$`, 'i') },
        { code: new RegExp(`^${code.trim()}$`, 'i') },
      ],
    })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Classroom name or code already exists',
      })
    }
    const row = await Classroom.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      capacity: capacity != null && capacity !== '' ? Number(capacity) : null,
      description: description?.trim() || '',
      status: status === 'In Active' ? 'In Active' : 'Active',
      color: color || '#246392',
    })
    res.status(201).json({ success: true, classroom: formatRow(row) })
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate classroom' })
    }
    next(e)
  }
}

export async function updateClassroom(req, res, next) {
  try {
    const { name, code, capacity, description, status, color } = req.body
    const row = await Classroom.findById(req.params.id)
    if (!row) return res.status(404).json({ success: false, message: 'Not found' })

    if (name?.trim()) {
      const dup = await Classroom.findOne({
        _id: { $ne: row._id },
        name: new RegExp(`^${name.trim()}$`, 'i'),
      })
      if (dup) return res.status(409).json({ success: false, message: 'Name already exists' })
      row.name = name.trim()
    }
    if (code?.trim()) {
      const dup = await Classroom.findOne({
        _id: { $ne: row._id },
        code: new RegExp(`^${code.trim()}$`, 'i'),
      })
      if (dup) return res.status(409).json({ success: false, message: 'Code already exists' })
      row.code = code.trim().toUpperCase()
    }
    if (capacity !== undefined) row.capacity = capacity != null && capacity !== '' ? Number(capacity) : null
    if (description !== undefined) row.description = description?.trim() || ''
    if (status) row.status = status === 'In Active' ? 'In Active' : 'Active'
    if (color) row.color = color
    await row.save()
    res.json({ success: true, classroom: formatRow(row) })
  } catch (e) {
    next(e)
  }
}

export async function deleteClassroom(req, res, next) {
  try {
    const row = await Classroom.findByIdAndDelete(req.params.id)
    if (!row) return res.status(404).json({ success: false, message: 'Not found' })
    await LiveClassBooking.deleteMany({ classroomId: row._id })
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
}

export async function availableClassrooms(req, res, next) {
  try {
    const { date, startTime, durationMinutes = 60, excludeIds } = req.query
    if (!date || !startTime) {
      return res.status(400).json({ success: false, message: 'date and startTime required' })
    }
    const excludeSourceIds = excludeIds ? String(excludeIds).split(',').filter(Boolean) : []
    const occupied = await getOccupiedClassroomIds(LiveClassBooking, {
      date,
      startTime,
      durationMinutes,
      excludeSourceIds,
    })
    const occupiedSet = new Set(occupied)
    const rows = await Classroom.find({ status: 'Active' }).sort({ name: 1 })
    res.json({
      success: true,
      classrooms: rows.map((doc) => {
        const row = formatRow(doc)
        const occ = occupiedSet.has(String(doc._id))
        return { ...row, available: !occ, occupied: occ }
      }),
    })
  } catch (e) {
    next(e)
  }
}

export async function checkAvailability(req, res, next) {
  try {
    const { classroomId, date, startTime, durationMinutes = 60, excludeIds } = req.query
    if (!classroomId || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing parameters' })
    }
    const excludeSourceIds = excludeIds ? String(excludeIds).split(',').filter(Boolean) : []
    const conflict = await findBookingConflict(LiveClassBooking, {
      classroomId,
      date,
      startTime,
      durationMinutes,
      excludeSourceIds,
    })
    res.json({ success: true, available: !conflict, conflict })
  } catch (e) {
    next(e)
  }
}

/** Upsert booking — used when live class is saved (optional sync endpoint) */
export async function upsertBooking(req, res, next) {
  try {
    const {
      classroomId,
      source,
      sourceId,
      title,
      date,
      startTime,
      durationMinutes = 60,
      center,
      teacher,
    } = req.body
    const startAt = buildDateTime(date, startTime)
    if (!startAt) return res.status(400).json({ success: false, message: 'Invalid schedule' })
    const endAt = computeEnd(startAt, durationMinutes)

    const conflict = await findBookingConflict(LiveClassBooking, {
      classroomId,
      date,
      startTime,
      durationMinutes,
      excludeSourceIds: [sourceId],
    })
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Classroom already occupied during selected time',
      })
    }

    const row = await LiveClassBooking.findOneAndUpdate(
      { source, sourceId },
      {
        classroomId,
        source,
        sourceId,
        title,
        date,
        startTime,
        durationMinutes,
        startAt,
        endAt,
        center,
        teacher,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    res.json({ success: true, booking: row })
  } catch (e) {
    next(e)
  }
}
