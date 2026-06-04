import { useState } from 'react'
import { Download, ChevronDown, Loader2 } from 'lucide-react'
import {
  exportFinanceCsv,
  exportFinanceExcel,
  exportFinancePdf,
} from '../../utils/financeExport'
import { FINANCE_STANDARD_EXPORT_COLUMNS } from '../../constants/financeConstants'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function FinanceExportMenu({
  rows = [],
  filenameBase = 'finance-export',
  title = 'Finance Report',
  columnDefs = FINANCE_STANDARD_EXPORT_COLUMNS,
  canExport = true,
  className,
  variant = 'light',
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(null)

  if (!canExport) return null

  const runExport = async (type) => {
    if (!rows.length) {
      toast.error('No records to export')
      return
    }
    setLoading(type)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const stamp = Date.now()
      if (type === 'csv') {
        exportFinanceCsv(rows, `${filenameBase}-${stamp}.csv`, columnDefs)
        toast.success('CSV downloaded')
      } else if (type === 'excel') {
        exportFinanceExcel(rows, `${filenameBase}-${stamp}.xls`, columnDefs)
        toast.success('Excel file downloaded')
      } else if (type === 'pdf') {
        exportFinancePdf(title, rows, columnDefs)
        toast.success('PDF print dialog opened')
      }
      setOpen(false)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  const btnClass =
    variant === 'banner'
      ? 'inline-flex h-10 items-center gap-2 rounded-lg bg-white/20 px-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/30'
      : 'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc]'

  const items = [
    { id: 'csv', label: 'Export CSV' },
    { id: 'excel', label: 'Export Excel' },
    { id: 'pdf', label: 'Export PDF' },
  ]

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={btnClass}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={!!loading}
                onClick={() => runExport(item.id)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-[#222] hover:bg-[#eef6fc] disabled:opacity-50"
              >
                {loading === item.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#246392]" />}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
