import { Download, Eye, Upload } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { installmentRemaining } from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'
import { OFFLINE_PAYMENT_MODES } from '../../../constants/offlinePaymentEmi'

const cellInput =
  'h-8 w-full min-w-0 rounded border border-slate-200 bg-white px-2 text-xs tabular-nums outline-none focus:border-[#55ace7] focus:ring-1 focus:ring-[#55ace7]/30 disabled:bg-slate-50 disabled:text-slate-500'

export default function EmiEditInstallmentTable({
  installments,
  planClosed,
  onFieldChange,
  onUploadProof,
  onViewProof,
  onDownloadProof,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[min(420px,50vh)] overflow-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#246392] to-[#1a4d73] text-[10px] font-bold uppercase tracking-wide text-white">
            <tr>
              <th className="px-2 py-2.5">#</th>
              <th className="px-2 py-2.5">EMI month</th>
              <th className="px-2 py-2.5">Due date</th>
              <th className="px-2 py-2.5 text-right">EMI amt</th>
              <th className="px-2 py-2.5 text-right">Paid</th>
              <th className="px-2 py-2.5 text-right">Balance</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">Mode</th>
              <th className="px-2 py-2.5">Receipt</th>
              <th className="px-2 py-2.5">UTR</th>
              <th className="px-2 py-2.5 text-center">Proof</th>
              <th className="px-2 py-2.5">Paid date</th>
              <th className="px-2 py-2.5 min-w-[100px]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((row, index) => {
              const isPaid = ['Paid', 'Closed'].includes(row.status)
              const isPartial = row.status === 'Partial'
              const locked = planClosed || row.status === 'Closed'
              const remaining = installmentRemaining(row)

              return (
                <tr
                  key={`${row.installmentNo}-${index}`}
                  className={cn(
                    'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]/80',
                    index % 2 === 1 && 'bg-slate-50/60',
                    row.status === 'Overdue' && 'bg-red-50/40',
                    isPaid && 'bg-emerald-50/30',
                    isPartial && 'bg-amber-50/40',
                    row.status === 'Closed' && 'opacity-70',
                  )}
                >
                  <td className="px-2 py-2 font-bold text-[#246392]">{row.installmentNo}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-[#333]">{row.emiMonth}</td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      disabled={locked}
                      value={row.dueDate || ''}
                      onChange={(e) => onFieldChange(index, 'dueDate', e.target.value)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={row.emiAmount}
                      onChange={(e) => onFieldChange(index, 'emiAmount', e.target.value)}
                      className={cn(cellInput, 'text-right')}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={row.paidAmount ?? ''}
                      onChange={(e) => onFieldChange(index, 'paidAmount', e.target.value)}
                      className={cn(cellInput, 'text-right')}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums text-[#246392]">
                    {formatINR(remaining)}
                  </td>
                  <td className="px-2 py-2">
                    <FinanceStatusBadge status={row.status} className="text-[10px] px-1.5 py-0.5" />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      disabled={locked}
                      value={row.paymentMode || ''}
                      onChange={(e) => onFieldChange(index, 'paymentMode', e.target.value)}
                      className={cellInput}
                    >
                      <option value="">—</option>
                      {OFFLINE_PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={locked}
                      value={row.receiptNumber || ''}
                      onChange={(e) => onFieldChange(index, 'receiptNumber', e.target.value)}
                      placeholder="RCP-…"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={locked}
                      value={row.utrNumber || row.referenceNumber || ''}
                      onChange={(e) => onFieldChange(index, 'utrNumber', e.target.value)}
                      placeholder="UTR"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <ProofCell
                      row={row}
                      disabled={planClosed}
                      onUpload={() => onUploadProof(index)}
                      onView={() => onViewProof(index)}
                      onDownload={() => onDownloadProof(index)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      disabled={locked}
                      value={row.paidDate || ''}
                      onChange={(e) => onFieldChange(index, 'paidDate', e.target.value)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={locked}
                      value={row.remarks || ''}
                      onChange={(e) => onFieldChange(index, 'remarks', e.target.value)}
                      className={cellInput}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {installments.length === 0 && (
        <p className="py-8 text-center text-sm text-[#686868]">No installments. Add one to begin.</p>
      )}
    </div>
  )
}

function ProofCell({ row, disabled, onUpload, onView, onDownload }) {
  const hasProof = row.proofFileName || row.proofUrl

  return (
    <div className="flex flex-col items-center gap-1">
      {!hasProof ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onUpload}
          className="inline-flex items-center gap-0.5 rounded bg-[#eef6fc] px-1.5 py-1 text-[10px] font-semibold text-[#246392] hover:bg-[#dceaf8] disabled:opacity-40"
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-semibold text-[#246392] hover:bg-[#eef6fc]"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
          <button
            type="button"
            onClick={onUpload}
            disabled={disabled}
            className="text-[10px] font-medium text-[#686868] hover:text-[#246392] disabled:opacity-40"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-0.5 text-[10px] text-[#686868] hover:text-[#246392]"
          >
            <Download className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  )
}
