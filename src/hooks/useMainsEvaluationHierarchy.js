import { useMainsDashboardManagement } from './useMainsDashboardManagement'

/** @deprecated Use useMainsDashboardManagement */
export function useMainsEvaluationHierarchy() {
  const {
    latestEvaluations,
    dashboardLoading,
    facultyRows,
    facultySubjectsLoading,
    refetchDashboard,
    refetchFacultySubjects,
  } = useMainsDashboardManagement()

  return {
    facultyRows,
    latestEvaluations,
    loading: dashboardLoading || facultySubjectsLoading,
    loadError: null,
    refresh: async () => {
      await Promise.all([refetchDashboard(), refetchFacultySubjects()])
    },
  }
}
