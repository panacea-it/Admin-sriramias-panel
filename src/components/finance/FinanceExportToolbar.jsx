import { Download } from 'lucide-react'
import { exportFinanceCsv } from '../../utils/financeExport'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function FinanceExportToolbar({
  rows = [],
  filenameBase = 'finance-export',
  columnDefs,
  canExport = true,
  className,
  variant = 'light',
}) {
  if (!canExport) return null

  const handleCsv = () => {
    if (!rows.length) {
      toast.error('No records to export')
      return
    }
    const ok = exportFinanceCsv(rows, `${filenameBase}-${Date.now()}.csv`, columnDefs)
    if (ok !== false) toast.success('CSV ready')
  }

  const btn =
    variant === 'banner'
      ? 'inline-flex h-10 items-center gap-2 rounded-lg bg-white/20 px-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/30'
      : 'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc]'

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button type="button" onClick={handleCsv} className={btn}>
        <Download className="h-4 w-4" /> CSV
      </button>
    </div>
  )
}
