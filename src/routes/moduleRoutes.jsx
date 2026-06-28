import { Navigate, useParams } from 'react-router-dom'
import { FileSearch, Tv, SlidersHorizontal, ScrollText, Database, Plug, ListOrdered } from 'lucide-react'
import RoleRoute from './RoleRoute'
import { ROLES } from '../constants/roles'
import {
  AdminManagementPage,
  AdminAccessTypesPage,
  RoleAccessMatrixPage,
  CenterManagementPage,
  ManageUsersPage,
  StudentDetailPage,
  AnalyticsPage,
  BooksPage,
  HomePageManagementLayout,
  BlogsPage,
  ContentLibraryPage,
  ContentLibraryLayout,
  FreeResourcesPage,
  CouponsPage,
  BatchManagementLayout,
  SubjectsPage,
  SubjectViewListPage,
  SubjectContentManagementPage,
  LiveClassesLayout,
  FinanceLayout,
  SalesAnalyticsLayout,
  BookstoreLayout,
  CurrentAffairsPage,
  CategoriesLayout,
  SubjectCategoryPage,
  EnquiriesPage,
  LeadsPage,
  HelpDeskPage,
  PushNotificationsPage,
  ModuleListPage,
  ActivityHistoryPage,
  TestManagementLayout,
  RewardsLayout,
  StudentRewardsLayout,
} from './lazyPages'

function LegacyBatchDetailRedirect() {
  const { batchId } = useParams()
  const id = encodeURIComponent(String(batchId ?? ''))
  if (!id) return <Navigate to="/academics/batch" replace />
  return <Navigate to={`/academics/batch/${id}`} replace />
}

function LegacyCoursesDetailRedirect() {
  const { batchId, courseId } = useParams()
  const id = encodeURIComponent(String(batchId ?? courseId ?? ''))
  if (!id) return <Navigate to="/academics/batch" replace />
  return <Navigate to={`/academics/batch/${id}`} replace />
}

function module(icon, title, addLabel, searchPlaceholder) {
  return (
    <ModuleListPage
      icon={icon}
      title={title}
      addLabel={addLabel}
      searchPlaceholder={searchPlaceholder}
    />
  )
}

export const MODULE_ROUTE_ELEMENTS = [
  { path: 'academics/batch/*', element: <BatchManagementLayout /> },
  { path: 'academics/batches', element: <Navigate to="/academics/batch" replace /> },
  { path: 'academics/batches/:batchId', element: <LegacyBatchDetailRedirect /> },
  { path: 'courses/:batchId', element: <LegacyCoursesDetailRedirect /> },
  { path: 'academics/faculty-subjects', element: <SubjectsPage /> },
  { path: 'academics/faculty-subjects/:subjectId/content', element: <SubjectContentManagementPage /> },
  { path: 'academics/faculty-subjects/:id', element: <SubjectViewListPage /> },
  { path: 'academics/subjects', element: <Navigate to="/academics/faculty-subjects" replace /> },
  { path: 'academics/subjects/:subjectId/content', element: <SubjectContentManagementPage /> },
  { path: 'academics/subjects/:id', element: <SubjectViewListPage /> },
  { path: 'courses', element: <Navigate to="/academics/batch" replace /> },
  { path: 'live-classes', element: <Navigate to="/academics/live-classes/schedule" replace /> },
  { path: 'academics/live-classes/*', element: <LiveClassesLayout /> },
  { path: 'content-library', element: <Navigate to="/academics/content-library/dashboard" replace /> },
  { path: 'academics/content-library/*', element: <ContentLibraryLayout /> },
  { path: 'current-affairs', element: <CurrentAffairsPage /> },
  { path: 'academics/categories', element: <Navigate to="/academics/categories/programs" replace /> },
  { path: 'academics/categories/main', element: <Navigate to="/academics/categories/exam-category" replace /> },
  { path: 'academics/categories/subject-setup', element: <SubjectCategoryPage /> },
  { path: 'academics/categories/*', element: <CategoriesLayout /> },
  { path: 'categories', element: <Navigate to="/academics/categories/programs" replace /> },
  { path: 'users/manage', element: <ManageUsersPage /> },
  { path: 'users/manage/students/:userId', element: <StudentDetailPage /> },
  { path: 'coupons', element: <CouponsPage /> },
  {
    path: 'users/admin',
    element: (
      <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <AdminManagementPage />
      </RoleRoute>
    ),
  },
  {
    path: 'users/admin-access-types',
    element: (
      <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <AdminAccessTypesPage />
      </RoleRoute>
    ),
  },
  {
    path: 'users/role-matrix',
    element: (
      <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <RoleAccessMatrixPage />
      </RoleRoute>
    ),
  },
  {
    path: 'users/centers',
    element: (
      <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.CENTER_ADMIN]}>
        <CenterManagementPage />
      </RoleRoute>
    ),
  },
  { path: 'crm/leads', element: <LeadsPage /> },
  { path: 'enquiries', element: <EnquiriesPage /> },
  { path: 'crm/help-desk', element: <HelpDeskPage /> },
  { path: 'crm/push-notifications', element: <PushNotificationsPage /> },
  { path: 'marketing/*', element: <HomePageManagementLayout /> },
  {
    path: 'marketing/seo-landing',
    element: module(FileSearch, 'SEO Landing Pages', 'Add Landing Page', 'Search pages'),
  },
  { path: 'marketing/blogs', element: <BlogsPage /> },
  { path: 'marketing/blogs/new', element: <Navigate to="/marketing/blogs" replace /> },
  { path: 'marketing/blogs/:id/edit', element: <Navigate to="/marketing/blogs" replace /> },
  { path: 'blogs', element: <Navigate to="/marketing/blogs" replace /> },
  { path: 'marketing/books', element: <BooksPage /> },
  { path: 'operations/live-module', element: module(Tv, 'Live Module', 'Add Module', 'Search modules') },
  { path: 'analytics', element: <AnalyticsPage /> },
  {
    path: 'operations/configuration',
    element: module(SlidersHorizontal, 'Configuration', 'Add Setting', 'Search settings'),
  },
  {
    path: 'operations/audit-logs',
    element: <ActivityHistoryPage title="Audit Logs" />,
  },
  {
    path: 'system/data-import-export',
    element: module(Database, 'Data Import / Export', 'Import Data', 'Search records'),
  },
  {
    path: 'system/api-integrations',
    element: module(Plug, 'API Integrations', 'Add Integration', 'Search integrations'),
  },
  {
    path: 'system/queue-monitor',
    element: module(ListOrdered, 'Queue Monitor', 'Refresh', 'Search queue'),
  },
  { path: 'free-resources', element: <FreeResourcesPage /> },
  { path: 'books', element: <Navigate to="/marketing/books" replace /> },
  { path: 'finance', element: <Navigate to="/finance/dashboard" replace /> },
  { path: 'finance/*', element: <FinanceLayout /> },
  { path: 'sales-analytics', element: <Navigate to="/sales-analytics/dashboard" replace /> },
  { path: 'sales-analytics/*', element: <SalesAnalyticsLayout /> },
  { path: 'admin/bookstore', element: <Navigate to="/admin/bookstore/dashboard" replace /> },
  { path: 'admin/bookstore/*', element: <BookstoreLayout /> },
  { path: 'test-management', element: <Navigate to="/test-management/dashboard" replace /> },
  { path: 'test-management/*', element: <TestManagementLayout /> },
  { path: 'admin/rewards', element: <Navigate to="/admin/rewards/dashboard" replace /> },
  { path: 'admin/rewards/*', element: <RewardsLayout /> },
  { path: 'student', element: <Navigate to="/student/rewards" replace /> },
  { path: 'student/*', element: <StudentRewardsLayout /> },
]
