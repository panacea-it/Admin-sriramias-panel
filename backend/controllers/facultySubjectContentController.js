import FacultySubjectContent from '../models/FacultySubjectContent.js'

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message })
}

export async function getSubjectContent(req, res, next) {
  try {
    const { subjectId } = req.params
    let doc = await FacultySubjectContent.findOne({ subjectId }).lean()
    if (!doc) {
      doc = await FacultySubjectContent.create({
        subjectId,
        folders: [],
      })
      doc = doc.toObject()
    }
    return ok(res, doc)
  } catch (err) {
    next(err)
  }
}

export async function upsertSubjectContent(req, res, next) {
  try {
    const { subjectId } = req.params
    const payload = req.body || {}
    const doc = await FacultySubjectContent.findOneAndUpdate(
      { subjectId },
      {
        $set: {
          subjectId,
          subjectName: payload.subjectName ?? '',
          categoryIds: payload.categoryIds ?? [],
          facultyId: payload.facultyId ?? '',
          facultyName: payload.facultyName ?? '',
          folders: payload.folders ?? [],
          categories: payload.categories ?? [],
          publishStatus: payload.publishStatus ?? 'draft',
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean()
    return ok(res, doc)
  } catch (err) {
    next(err)
  }
}

export async function deleteSubjectContent(req, res, next) {
  try {
    const { subjectId } = req.params
    await FacultySubjectContent.deleteOne({ subjectId })
    return ok(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
