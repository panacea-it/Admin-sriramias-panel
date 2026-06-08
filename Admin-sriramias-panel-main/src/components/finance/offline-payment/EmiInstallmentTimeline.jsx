import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate } from '../../../utils/emiSchedule'

const STATUS_DOT = {
  Paid: 'bg-emerald-500 ring-emerald-200',
  Overdue: 'bg-[#dc2626] ring-red-200',
  Pending: 'bg-[#55ace7] ring-blue-200',
  Partial: 'bg-[#efb36d] ring-amber-200',
  Scheduled: 'bg-slate-400 ring-slate-200',
}

export default function EmiInstallmentTimeline({ installments }) {
  if (!installments?.length) return null

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-[#246392]">
        Installment timeline
      </h4>
      <div className="relative overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-0 px-2">
          {installments.map((row, idx) => (
            <div key={row.installmentNo} className="flex items-start">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="flex w-[100px] flex-col items-center text-center sm:w-[110px]"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-4',
                    STATUS_DOT[row.status] || STATUS_DOT.Scheduled,
                  )}
                >
                  {row.installmentNo}
                </span>
                <p className="mt-2 text-[10px] font-semibold uppercase text-[#686868]">
                  {row.emiMonth}
                </p>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-[#111]">
                  {formatINR(row.emiAmount)}
                </p>
                <p className="mt-0.5 text-[10px] tabular-nums text-[#888]">
                  {formatDisplayDate(row.dueDate)}
                </p>
                <span
                  className={cn(
                    'mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                    row.status === 'Paid' && 'bg-emerald-100 text-emerald-800',
                    row.status === 'Overdue' && 'bg-red-100 text-red-800',
                    row.status === 'Pending' && 'bg-blue-100 text-blue-800',
                    row.status === 'Scheduled' && 'bg-slate-100 text-slate-600',
                    row.status === 'Partial' && 'bg-amber-100 text-amber-900',
                  )}
                >
                  {row.status}
                </span>
              </motion.div>
              {idx < installments.length - 1 && (
                <div
                  className="mt-4 h-0.5 w-6 shrink-0 bg-gradient-to-r from-[#55ace7]/50 to-[#246392]/30 sm:w-8"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
