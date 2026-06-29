import { fetchTestManagementDashboard } from '../services/testManagementDashboardService'

/** @deprecated Prefer useTestManagementDashboard hook */
export async function fetchLiveTMData(signal) {
  return fetchTestManagementDashboard({}, { signal })
}
