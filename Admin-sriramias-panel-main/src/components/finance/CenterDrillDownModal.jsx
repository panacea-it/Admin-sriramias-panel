import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import FinanceStatusBadge from './FinanceStatusBadge'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

export default function CenterDrillDownModal({ center, data, onClose }) {
  if (!center) return null

  const stats = data?.stats
  const payments = data?.recentPayments || []

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'courseName', label: 'Course' },
    { key: 'amountPaid', label: 'Amount', render: (r) => formatINR(r.amountPaid) },
    { key: 'paymentStatus', label: 'Status', render: (r) => <FinanceStatusBadge status={r.paymentStatus} /> },
    { key: 'paymentDate', label: 'Date', render: (r) => formatCategoryDateTime(r.paymentDate) },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#111]">{center.centerName}</h2>
            <p className="text-xs text-slate-500">{center.centerCode} · Center analytics drill-down</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Revenue', value: formatINR(stats?.totalRevenue || center.totalRevenue) },
              { label: 'Students', value: center.activeStudents },
              { label: 'Pending', value: stats?.pendingPayments ?? center.pendingPayments },
              { label: 'Success rate', value: `${data?.paymentSuccessRate ?? center.conversionPct}%` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            ))}
          </div>
          {data?.counselorCollections?.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-bold text-[#246392]">Counselor-wise collections</h4>
              <ul className="space-y-1 text-sm">
                {data.counselorCollections.map((c) => (
                  <li key={c.counselor} className="flex justify-between rounded bg-slate-50 px-3 py-2">
                    <span>{c.counselor}</span>
                    <span className="font-semibold">{formatINR(c.collected)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h4 className="mb-2 text-sm font-bold text-[#246392]">Recent payments</h4>
          <PaginatedFigmaTable columns={columns} data={payments} itemLabel="payments" initialPageSize={5} />
        </div>
      </motion.div>
    </div>
  )
}
