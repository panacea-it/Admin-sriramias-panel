import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import FraudTimelineDrawer from '../../../components/rewards/FraudTimelineDrawer'
import { FRAUD_STATUS } from '../../../constants/rewards'
import { getFraudCases, updateFraudStatus } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'
import { cn } from '../../../utils/cn'

const statusColors = {
  [FRAUD_STATUS.OPEN]: 'bg-amber-100 text-amber-800',
  [FRAUD_STATUS.HOLD]: 'bg-rose-100 text-rose-800',
  [FRAUD_STATUS.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [FRAUD_STATUS.REVERSED]: 'bg-slate-100 text-slate-700',
}

export default function FraudMonitoringPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [timelineCase, setTimelineCase] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFraudCases()
      setCases(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load fraud cases'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setStatus = async (id, status) => {
    try {
      await updateFraudStatus(id, status)
      toast.success(`Marked as ${status}`)
      refresh()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Update failed'))
    }
  }

  const columns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'activityType', label: 'Activity Type' },
    {
      key: 'riskScore',
      label: 'Risk Score',
      render: (r) => (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', r.riskScore >= 70 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800')}>
          {r.riskScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', statusColors[r.status] || statusColors[FRAUD_STATUS.OPEN])}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="text-xs font-semibold text-emerald-700" onClick={() => setStatus(r.id, FRAUD_STATUS.APPROVED)}>Approve</button>
          <button type="button" className="text-xs font-semibold text-amber-700" onClick={() => setStatus(r.id, FRAUD_STATUS.HOLD)}>Hold</button>
          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => setStatus(r.id, FRAUD_STATUS.REVERSED)}>Reverse</button>
          <button type="button" className="text-xs font-semibold text-[#246392]" onClick={() => setTimelineCase(r)}>Timeline</button>
        </div>
      ),
    },
  ]

  return (
    <RewardsPageShell icon={ShieldAlert} title="Fraud Monitoring">
      <PaginatedFigmaTable columns={columns} data={cases} loading={loading} stickyHeader />
      <FraudTimelineDrawer open={Boolean(timelineCase)} caseRow={timelineCase} onClose={() => setTimelineCase(null)} />
    </RewardsPageShell>
  )
}
