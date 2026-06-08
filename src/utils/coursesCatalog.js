import { fetchCourses } from '../api/coursesAPI'
import { INITIAL_COURSES, SUB_CATEGORIES_BY_CATEGORY } from '../data/coursesData'
import { loadAcademicCourses } from './academicCoursesStorage'
import { loadExamCategories } from './examCategoriesStorage'
import { loadExamSubCategories } from './examSubCategoriesStorage'
import { getCourseMarketingSectionTitles } from './academicCourseForm'

/** Map course category name to exam category / subcategory for program linking UI */
function resolveExamHierarchy(categoryName) {
  const examCategories = loadExamCategories()
  const examSubCategories = loadExamSubCategories()
  const matchedExam = examCategories.find(
    (e) =>
      categoryName?.toLowerCase().includes(e.name.toLowerCase()) ||
      e.name.toLowerCase().includes(categoryName?.toLowerCase()?.split(' ')[0] || ''),
  )
  const examCategory = matchedExam?.name || 'UPSC'
  const subs = SUB_CATEGORIES_BY_CATEGORY[categoryName] || []
  const matchedSub = examSubCategories.find(
    (s) =>
      s.parentCategory === examCategory &&
      subs.some((sub) => sub.includes(s.name) || s.name.includes(sub)),
  )
  const examSubcategory = matchedSub?.name || subs[0] || 'Foundation'
  return { examCategory, examSubcategory }
}

function mapHubCourseToCatalog(row) {
  const sectionTitles = getCourseMarketingSectionTitles(row)
  return {
    id: row.id,
    courseId: row.courseId,
    name: row.name,
    category: row.program || 'General',
    examCategory: row.examCategory?.split(' - ').pop() || row.examCategory,
    examSubcategory: row.examSubCategory?.split(' - ').pop() || row.examSubCategory,
    center: 'Delhi',
    price: '—',
    status: row.status || 'Active',
    sectionTitles,
    marketingSectionTitles: sectionTitles,
  }
}

function mapRowToCatalog(row, index) {
  const category = row.category || row.formData?.category || 'General'
  const { examCategory, examSubcategory } = resolveExamHierarchy(category)
  const numericId = row.id ?? index + 1
  return {
    id: numericId,
    courseId: row.courseId || `CRS${String(numericId).padStart(3, '0')}`,
    name: row.name || row.courseName || 'Untitled Course',
    category,
    examCategory,
    examSubcategory,
    center: row.center || 'Delhi',
    price: row.price || '—',
    status: row.status || 'Active',
  }
}

/** Load all courses for Programs multi-select (API with mock fallback). */
export async function getCoursesCatalog() {
  const hub = loadAcademicCourses().filter((c) => c.status === 'Active')
  if (hub.length) return hub.map(mapHubCourseToCatalog)
  try {
    const rows = await fetchCourses()
    if (rows?.length) return rows.map(mapRowToCatalog)
  } catch {
    /* use local seed — frontend-only never throws */
  }
  return INITIAL_COURSES.map(mapRowToCatalog)
}

export function getCoursesByIds(catalog, ids = []) {
  const set = new Set(ids.map(String))
  return catalog.filter((c) => set.has(String(c.id)))
}
