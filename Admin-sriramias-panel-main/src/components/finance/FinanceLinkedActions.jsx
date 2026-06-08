import { Eye, Receipt, ShieldCheck, UserCircle, History, MessageSquare } from 'lucide-react'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { cn } from '../../utils/cn'

export default function FinanceLinkedActions({ row, className, onView, compact = false }) {
  const { openStudentProfile, goToFinance } = useFinanceOperations()
  const studentId = row.studentId || row.id

  const btn = compact
    ? 'rounded p-1.5 text-[#246392] hover:bg-[#eef6fc]'
    : 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc]'

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {onView && (
        <button type="button" onClick={() => onView(row)} className={btn} title="View payment">
          <Eye className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => openStudentProfile(studentId, row)}
        className={btn}
        title="Student finance profile"
      >
        <UserCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToFinance('verification', { q: row.id || '' })}
        className={btn}
        title="Verification"
      >
        <ShieldCheck className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToFinance('receipts', { q: row.receiptNumber || row.id || '' })}
        className={btn}
        title="Receipts"
      >
        <Receipt className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToFinance('attempts', { student: studentId })}
        className={btn}
        title="Attempt logs"
      >
        <History className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToFinance('communication', { student: studentId })}
        className={btn}
        title="Communication"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
    </div>
  )
}
