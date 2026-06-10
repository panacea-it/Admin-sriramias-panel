import AcademicCourse from '../models/AcademicCourse.js'

function toCatalogOption(doc) {
  return {
    _id: String(doc._id),
    courseId: doc.courseId,
    courseName: doc.courseName,
  }
}

/**
 * GET /api/courses?purpose=catalog
 * Returns active catalog courses for batch dropdown (sorted A–Z).
 */
export async function getCourseCatalog(req, res, next) {
  try {
    const rows = await AcademicCourse.find({ status: 'Active' })
      .select('courseName courseId')
      .sort({ courseName: 1 })
      .lean()

    const data = rows.map(toCatalogOption)
    res.json(data)
  } catch (error) {
    next(error)
  }
}

/** Sync catalog from admin Categories → Courses (bulk upsert) */
export async function syncAcademicCourses(req, res, next) {
  try {
    const { courses } = req.body
    if (!Array.isArray(courses)) {
      return res.status(400).json({ success: false, message: 'courses array required' })
    }

    const ops = courses.map((row) => ({
      updateOne: {
        filter: { courseId: row.courseId },
        update: {
          $set: {
            courseId: row.courseId,
            courseName: row.name || row.courseName,
            status: row.status || 'Active',
            centerId: row.centerId || '',
            centerName: row.centerName || '',
            programId: row.programId || '',
            program: row.program || '',
            sourceRowId: row.id || row.sourceRowId || '',
            examCategoryId: row.examCategoryId || '',
            examCategory: row.examCategory || '',
            examSubCategoryId: row.examSubCategoryId || '',
            examSubCategory: row.examSubCategory || '',
            subjects: row.subjects || [],
            feeDetails: row.feeDetails || {},
            overview: row.overview || row.courseOverview || '',
            courseOverview: row.courseOverview || row.overview || '',
            keyFeatures: row.keyFeatures || [],
            whyChooseFeatures: row.whyChooseFeatures || [],
            howWill: row.howWill || [],
            whyChooseCourse: row.whyChooseCourse || '',
            howCourseHelps: row.howCourseHelps || '',
            courseFormData: row.courseFormData || null,
            whyChooseTitle: row.whyChooseTitle || row.sectionTitleWhyChoose || '',
            whyChooseSubtitle: row.whyChooseSubtitle || '',
            sectionTitleOverview: row.sectionTitleOverview || '',
            sectionTitleKeyFeatures: row.sectionTitleKeyFeatures || '',
            sectionTitleWhyChoose:
              row.sectionTitleWhyChoose || row.whyChooseTitle || '',
            sectionTitleHowHelps: row.sectionTitleHowHelps || '',
          },
        },
        upsert: true,
      },
    }))

    if (ops.length) await AcademicCourse.bulkWrite(ops)

    res.json({ success: true, count: ops.length })
  } catch (error) {
    next(error)
  }
}
