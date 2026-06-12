import FinanceStatCard from '../FinanceStatCard'
import { ShieldAlert } from 'lucide-react'

export default function PaymentAttemptOverview({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FinanceStatCard label="Total attempts" value={summary?.total ?? 0} />
      <FinanceStatCard label="Successful" value={summary?.success ?? 0} accent="from-[#69df66] to-[#55ace7]" />
      <FinanceStatCard label="Failed" value={summary?.failed ?? 0} accent="from-[#df8284] to-[#b8887a]" />
      <FinanceStatCard icon={ShieldAlert} label="Fraud flags" value={summary?.suspicious ?? 0} accent="from-[#df8284] to-[#686868]" />
    </div>
  )
}
