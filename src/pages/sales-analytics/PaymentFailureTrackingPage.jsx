import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesStatCard from '../../components/sales-analytics/SalesStatCard'
import SalesFilterToolbar from '../../components/sales-analytics/SalesFilterToolbar'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
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
      key: 'action',
      label: '',
      render: () => (
        <button
          type="button"
          onClick={() => toast.success('Reminder sent to counselor')}
          className="text-sm font-semibold text-[#246392] hover:underline"
        >
          Notify
        </button>
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
