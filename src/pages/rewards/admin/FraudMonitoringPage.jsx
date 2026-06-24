import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle2, PauseCircle, RotateCcw, Clock } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import TableActionMenu from '../../../components/common/TableActionMenu'
import FraudTimelineDrawer from '../../../components/rewards/FraudTimelineDrawer'
import { FRAUD_STATUS } from '../../../constants/rewards'
import { getFraudCases, updateFraudStatus } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { cn } from '../../../utils/cn'
import { toast } from '@/utils/toast'

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
    createActionsColumn({
      buttonCount: 1,
      render: (r) => (
        <TableActionMenu
          triggerLabel={`Actions for ${r.studentName}`}
          items={[
            { label: 'Approve', icon: CheckCircle2, onClick: () => setStatus(r.id, FRAUD_STATUS.APPROVED) },
            { label: 'Hold', icon: PauseCircle, onClick: () => setStatus(r.id, FRAUD_STATUS.HOLD) },
            { label: 'Reverse', icon: RotateCcw, onClick: () => setStatus(r.id, FRAUD_STATUS.REVERSED), danger: true },
            { label: 'Timeline', icon: Clock, onClick: () => setTimelineCase(r) },
          ]}
        />
      ),
    }),
  ]

  return (
    <RewardsPageShell icon={ShieldAlert} title="Fraud Monitoring">
      <AdminDataPanel>
        <AdminStandardTable columns={columns} data={cases} loading={loading} stickyHeader itemLabel="cases" />
      </AdminDataPanel>
      <FraudTimelineDrawer open={Boolean(timelineCase)} caseRow={timelineCase} onClose={() => setTimelineCase(null)} />
    </RewardsPageShell>
  )
}
