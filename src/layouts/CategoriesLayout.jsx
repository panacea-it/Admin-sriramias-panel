import { Navigate, Route, Routes } from 'react-router-dom'
import CategoryHubShell from '../components/categories/CategoryHubShell'
import ProgramsPage from '../pages/academics/categories/ProgramsPage'
import CategorySectionPage from '../pages/academics/categories/CategorySectionPage'
import ExamCategorySection from '../pages/academics/categories/exam-category'
import CategoryCoursesSection from '../pages/academics/categories/CategoryCoursesSection'
import CityPage from '../pages/academics/categories/CityPage'
import ClassRoomsPage from '../pages/academics/categories/ClassRoomsPage'
import { CATEGORY_HUB_SECTIONS } from '../constants/categoryHubSections'

export default function CategoriesLayout() {
  return (
    <CategoryHubShell>
      <Routes>
        <Route index element={<Navigate to="programs" replace />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="programs/:id" element={<ProgramsPage />} />
        <Route path="programs/edit/:id" element={<ProgramsPage />} />
        <Route
          path="exam-category"
          element={
            <ExamCategorySection
              section={CATEGORY_HUB_SECTIONS['exam-category']}
              Icon={CATEGORY_HUB_SECTIONS['exam-category'].icon}
            />
          }
        />
        <Route path="exam-sub-category" element={<CategorySectionPage />} />
        <Route path="courses" element={<CategoryCoursesSection />} />
        <Route path="subject" element={<CategorySectionPage />} />
        <Route path="topic" element={<CategorySectionPage />} />
        <Route path="teachers" element={<CategorySectionPage />} />
        <Route path="city" element={<CityPage />} />
        <Route path="class-rooms" element={<ClassRoomsPage />} />
        <Route path="*" element={<Navigate to="programs" replace />} />
      </Routes>
    </CategoryHubShell>
  )
}
