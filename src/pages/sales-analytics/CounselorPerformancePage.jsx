import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesStatCard from '../../components/sales-analytics/SalesStatCard'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchCounselorPerformance } from '../../api/salesAnalyticsAPI'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'
import PermissionGate from '../../components/common/PermissionGate'
import { ROLES } from '../../constants/roles'

export default function CounselorPerformancePage() {
  const { canTeamAnalytics, isCounselor } = useSalesPermissions()
  const [counselors, setCounselors] = useState([])

  useEffect(() => {
    if (canTeamAnalytics || isCounselor) {
      fetchCounselorPerformance().then((res) => setCounselors(res.counselors || []))
    }
  }, [canTeamAnalytics, isCounselor])

  if (!canTeamAnalytics && !isCounselor) {
    return (
      <SalesPageShell icon={UserCheck} title="Counselor Performance">
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#686868] shadow">
          Team analytics are not available for your role.
        </p>
      </SalesPageShell>
    )
  }

  const totals = counselors.reduce(
    (acc, c) => ({
      assigned: acc.assigned + c.assignedLeads,
      converted: acc.converted + c.converted,
    }),
    { assigned: 0, converted: 0 },
  )

  const columns = [
    { key: 'name', label: 'Counselor', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'team', label: 'Team' },
    { key: 'center', label: 'Center' },
    { key: 'assignedLeads', label: 'Assigned' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'converted', label: 'Converted' },
    { key: 'conversionRate', label: 'Conversion %' },
    { key: 'avgResponseTime', label: 'Avg Response' },
    { key: 'pendingFollowUps', label: 'Pending F/U' },
  ]

  return (
    <SalesPageShell icon={UserCheck} title="Counselor Performance">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SalesStatCard label="Total Assigned" value={totals.assigned} index={0} />
        <SalesStatCard label="Total Converted" value={totals.converted} index={1} />
        <SalesStatCard
          label="Team Conversion"
          value={totals.assigned ? `${((totals.converted / totals.assigned) * 100).toFixed(1)}%` : '—'}
          index={2}
        />
      </div>
      <PermissionGate roles={[ROLES.SUPER_ADMIN, ROLES.MENTOR_ADMIN, ROLES.CENTER_ADMIN, ROLES.COUNSELING_ADMIN]}>
        <PaginatedFigmaTable columns={columns} data={counselors} />
      </PermissionGate>
    </SalesPageShell>
  )
}
