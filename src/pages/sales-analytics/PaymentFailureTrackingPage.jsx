import { useEffect, useState } from 'react'
import { AlertCircle, Bell } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesStatCard from '../../components/sales-analytics/SalesStatCard'
import SalesFilterToolbar from '../../components/sales-analytics/SalesFilterToolbar'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import IconActionButton from '../../components/common/IconActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'
import { fetchPaymentFailures } from '../../api/salesAnalyticsAPI'
import { toast } from '../../utils/toast'

export default function PaymentFailureTrackingPage() {
  const [failures, setFailures] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPaymentFailures().then((res) => setFailures(res.failures || []))
  }, [])

  const filtered = failures.filter(
    (f) =>
      !search.trim() ||
      f.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      f.leadId?.toLowerCase().includes(search.toLowerCase()),
  )

  const columns = [
    { key: 'leadId', label: 'Lead ID' },
    { key: 'studentName', label: 'Student' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'reason', label: 'Failure reason' },
    { key: 'retryCount', label: 'Retries' },
    { key: 'counselorName', label: 'Counselor' },
    { key: 'lastAttempt', label: 'Last attempt' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      headerClassName: 'text-center whitespace-nowrap',
      cellClassName: 'text-center align-middle',
      render: (row) => (
        <div className={TABLE_ACTIONS_WRAP_CENTER}>
          <IconActionButton
            label={`Notify counselor for ${row.studentName}`}
            onClick={() => toast.success('Reminder sent to counselor')}
            className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <SalesPageShell icon={AlertCircle} title="Payment Failure Tracking">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SalesStatCard label="Failed (7d)" value={failures.length} index={0} accent="from-[#ef4444] to-[#b91c1c]" />
        <SalesStatCard label="Avg retries" value="1.4" index={1} />
        <SalesStatCard label="Recovery rate" value="22%" index={2} accent="from-[#22c55e] to-[#15803d]" />
      </div>
      <SalesFilterToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search failures..." />
      <PaginatedFigmaTable columns={columns} data={filtered} />
    </SalesPageShell>
  )
}
