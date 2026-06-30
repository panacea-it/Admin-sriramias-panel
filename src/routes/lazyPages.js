import { lazyRoute } from './lazyRoute'

export const BatchesPage = lazyRoute(() => import('../pages/academics/BatchesPage'))
export const BatchDetailsPage = lazyRoute(() => import('../pages/academics/BatchDetailsPage'))
export const BatchManagementLayout = lazyRoute(() => import('../layouts/BatchManagementLayout'))
export const SubjectsPage = lazyRoute(() => import('../pages/academics/SubjectsPage'))
export const SubjectViewListPage = lazyRoute(() => import('../pages/academics/SubjectViewListPage'))
export const SubjectContentManagementPage = lazyRoute(
  () => import('../modules/academics/facultySubjects/pages/FacultySubjectContentPage'),
)
export const FacultySubjectContentPage = SubjectContentManagementPage
export const CoursesPage = BatchesPage
export const LiveClassesPage = lazyRoute(() => import('../pages/academics/LiveClassesPage'))
export const LiveClassesLayout = lazyRoute(() => import('../layouts/LiveClassesLayout'))
export const ScheduleClassPage = lazyRoute(() => import('../pages/academics/live-classes/ScheduleClassPage'))
export const RecordedClassesPage = lazyRoute(
  () => import('../pages/academics/live-classes/RecordedClassesPage'),
)
export const LiveSessionsPage = lazyRoute(() => import('../pages/academics/live-classes/LiveSessionsPage'))
export const CalendarViewPage = lazyRoute(() => import('../pages/academics/live-classes/CalendarViewPage'))
export const LiveClassDetailPage = lazyRoute(
  () => import('../pages/academics/live-classes/LiveClassDetailPage'),
)
export const ContentLibraryPage = lazyRoute(() => import('../pages/academics/ContentLibraryPage'))
export const ContentLibraryLayout = lazyRoute(() => import('../layouts/ContentLibraryLayout'))
export const FreeResourcesPage = lazyRoute(
  () => import('../pages/academics/FreeResourcesPage'),
  'Free Resources',
)
export const CurrentAffairsPage = lazyRoute(() => import('../pages/academics/CurrentAffairsPage'))
export const CategoriesLayout = lazyRoute(() => import('../layouts/CategoriesLayout'))
export const CategoriesHubPage = lazyRoute(() => import('../pages/academics/categories/CategoriesHubPage'))
export const MainCategoryPage = lazyRoute(() => import('../pages/academics/categories/MainCategoryPage'))
export const SubjectCategoryPage = lazyRoute(() => import('../pages/academics/categories/SubjectCategoryPage'))
export const BooksPage = lazyRoute(() => import('../pages/marketing/BooksPage'))
export const HomePageManagementLayout = lazyRoute(
  () => import('../layouts/HomePageManagementLayout'),
)
export const QuickLinksLayout = lazyRoute(() => import('../layouts/QuickLinksLayout'))
export const WebsitePage = lazyRoute(
  () => import('../pages/marketing/YoutubeManagementPage'),
)
export const BlogsPage = lazyRoute(() => import('../pages/marketing/BlogsPage'))
export const QuickLinksPage = lazyRoute(() => import('../pages/marketing/QuickLinksPage'))
export const QuickLinksSectionViewPage = lazyRoute(
  () => import('../pages/marketing/QuickLinksSectionViewPage'),
)
export const QuickLinksSectionEditPage = lazyRoute(
  () => import('../pages/marketing/QuickLinksSectionEditPage'),
)
export const CouponsPage = lazyRoute(() => import('../pages/users/CouponsPage'))
export const EnquiriesPage = lazyRoute(() => import('../pages/crm/EnquiriesPage'))
export const LeadsPage = lazyRoute(() => import('../pages/crm/LeadsPage'))
export const HelpDeskPage = lazyRoute(() => import('../pages/crm/HelpDeskPage'))
export const PushNotificationsPage = lazyRoute(() => import('../pages/crm/PushNotificationsPage'))
export const AnalyticsPage = lazyRoute(() => import('../pages/AnalyticsPage'))
export const AdminManagementPage = lazyRoute(() => import('../pages/users/AdminManagementPage'))
export const AdminAccessTypesPage = lazyRoute(() => import('../pages/users/AdminAccessTypesPage'))
export const RoleAccessMatrixPage = lazyRoute(() => import('../pages/users/RoleAccessMatrixPage'))
export const CenterManagementPage = lazyRoute(() => import('../pages/users/CenterManagementPage'))
export const ManageUsersPage = lazyRoute(() => import('../pages/users/ManageUsersPage'))
export const StudentDetailPage = lazyRoute(() => import('../pages/users/StudentDetailPage'))
export const ModuleListPage = lazyRoute(() => import('../pages/ModuleListPage'))
export const ActivityHistoryPage = lazyRoute(
  () => import('../pages/operations/ActivityHistoryPage'),
)
export const FinanceLayout = lazyRoute(
  () => import('../layouts/FinanceLayout'),
  'Finance layout',
)
export const SalesAnalyticsLayout = lazyRoute(() => import('../layouts/SalesAnalyticsLayout'))
export const BookstoreLayout = lazyRoute(() => import('../layouts/BookstoreLayout'))
export const TestManagementLayout = lazyRoute(() => import('../layouts/TestManagementLayout'), 'Test Management layout')
export const RewardsLayout = lazyRoute(() => import('../layouts/RewardsLayout'), 'Rewards layout')
export const StudentRewardsLayout = lazyRoute(
  () => import('../layouts/StudentRewardsLayout'),
  'Student rewards layout',
)
