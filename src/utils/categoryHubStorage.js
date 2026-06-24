import { loadExamCategories } from './examCategoriesStorage'
import { loadExamSubCategories } from './examSubCategoriesStorage'
import { loadSubjects } from './subjectsStorage'
import { loadTopics } from './topicsStorage'
import { loadTeachers } from './teachersStorage' /** Load all hub section lists from localStorage (with seed fallback). */
export function buildCategoryHubDataState() { return { 'exam-category': loadExamCategories(), 'exam-sub-category': loadExamSubCategories(), subject: loadSubjects(), topic: loadTopics(), teachers: loadTeachers(), }
}
