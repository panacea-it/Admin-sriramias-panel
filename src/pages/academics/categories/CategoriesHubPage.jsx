import { Navigate, useSearchParams } from 'react-router-dom'
import { DEFAULT_CATEGORY_TAB } from '../../../constants/categoryHubSections'

/** Legacy entry — redirect query tabs to route-based URLs */
const TAB_PATHS = {
  programs: '/academics/categories/programs',
  'exam-category': '/academics/categories/exam-category',
  'exam-sub-category': '/academics/categories/exam-sub-category',
  courses: '/academics/categories/courses',
  subject: '/academics/categories/subject',
  topic: '/academics/categories/topic',
  teachers: '/academics/categories/teachers',
  'class-rooms': '/academics/categories/class-rooms',
}

export default function CategoriesHubPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || DEFAULT_CATEGORY_TAB
  const target = TAB_PATHS[tab] || TAB_PATHS[DEFAULT_CATEGORY_TAB]
  return <Navigate to={target} replace />
}
