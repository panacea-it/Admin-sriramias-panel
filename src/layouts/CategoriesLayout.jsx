import { Navigate, Route, Routes } from 'react-router-dom'
import RoleRoute from '../routes/RoleRoute'
import { ROLES } from '../constants/roles'
import CategoryHubShell from '../components/categories/CategoryHubShell'
import ProgramsPage from '../pages/academics/categories/ProgramsPage'
import CategorySectionPage from '../pages/academics/categories/CategorySectionPage'
import ExamCategorySection from '../pages/academics/categories/exam-category'
import CategoryCoursesSection from '../pages/academics/categories/CategoryCoursesSection'
import CityPage from '../pages/academics/categories/CityPage'
import ClassRoomsPage from '../pages/academics/categories/ClassRoomsPage'
import ClassesPage from '../pages/academics/categories/classes'
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
          element={<ExamCategorySection section={CATEGORY_HUB_SECTIONS['exam-category']} />}
        />
        <Route path="exam-sub-category" element={<CategorySectionPage />} />
        <Route path="courses" element={<CategoryCoursesSection />} />
        <Route path="subject" element={<CategorySectionPage />} />
        <Route path="topic" element={<CategorySectionPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="faculty" element={<CategorySectionPage />} />
        <Route path="teachers" element={<Navigate to="/academics/categories/faculty" replace />} />
        <Route path="city" element={<CityPage />} />
        <Route
          path="class-rooms"
          element={
            <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <ClassRoomsPage />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="programs" replace />} />
      </Routes>
    </CategoryHubShell>
  )
}
