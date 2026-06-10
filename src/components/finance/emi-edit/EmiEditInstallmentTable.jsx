<<<<<<< HEAD
import { Download, Eye, Upload } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { installmentRemaining } from '../../../utils/emiSchedule'
=======
import {
  Banknote,
  Download,
  Eye,
  FileUp,
  History,
  Pencil,
  Receipt,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate, installmentRemaining } from '../../../utils/emiSchedule'
import { canDeleteInstallment } from '../../../utils/emiEditModel'
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
import { cn } from '../../../utils/cn'
import { OFFLINE_PAYMENT_MODES } from '../../../constants/offlinePaymentEmi'

const cellInput =
  'h-8 w-full min-w-0 rounded border border-slate-200 bg-white px-2 text-xs tabular-nums outline-none focus:border-[#55ace7] focus:ring-1 focus:ring-[#55ace7]/30 disabled:bg-slate-50 disabled:text-slate-500'

<<<<<<< HEAD
export default function EmiEditInstallmentTable({
  installments,
  planClosed,
  onFieldChange,
  onUploadProof,
  onViewProof,
  onDownloadProof,
=======
const EMI_STATUSES = ['Due', 'Scheduled', 'Pending', 'Paid', 'Partial', 'Overdue', 'Closed', 'Cancelled']

export default function EmiEditInstallmentTable({
  installments,
  planClosed,
  editingRow,
  onStartEdit,
  onAdvancedEdit,
  onCancelEdit,
  onSaveRow,
  onFieldChange,
  onCollect,
  onUploadProof,
  onViewProof,
  onDownloadProof,
  onViewReceipt,
  onGenerateReceipt,
  onViewHistory,
  onDelete,
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[min(420px,50vh)] overflow-auto">
<<<<<<< HEAD
        <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
=======
        <table className="w-full min-w-[1400px] border-collapse text-left text-xs">
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
=======
              <th className="sticky right-0 z-20 bg-[#1a4d73] px-2 py-2.5 text-center shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">
                Actions
              </th>
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
            </tr>
          </thead>
          <tbody>
            {installments.map((row, index) => {
<<<<<<< HEAD
              const isPaid = ['Paid', 'Closed'].includes(row.status)
              const isPartial = row.status === 'Partial'
              const locked = planClosed || row.status === 'Closed'
=======
              const isEditing = editingRow === index
              const isPaid = ['Paid', 'Closed'].includes(row.status)
              const isPartial = row.status === 'Partial'
              const locked = planClosed || (isPaid && !isEditing)
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.dueDate || ''}
                      onChange={(e) => onFieldChange(index, 'dueDate', e.target.value)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.emiAmount}
                      onChange={(e) => onFieldChange(index, 'emiAmount', e.target.value)}
                      className={cn(cellInput, 'text-right')}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={!isEditing && locked}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.paidAmount ?? ''}
                      onChange={(e) => onFieldChange(index, 'paidAmount', e.target.value)}
                      className={cn(cellInput, 'text-right')}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums text-[#246392]">
                    {formatINR(remaining)}
                  </td>
                  <td className="px-2 py-2">
<<<<<<< HEAD
                    <FinanceStatusBadge status={row.status} className="text-[10px] px-1.5 py-0.5" />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      disabled={locked}
=======
                    {isEditing ? (
                      <select
                        value={row.status}
                        onChange={(e) => onFieldChange(index, 'status', e.target.value)}
                        className={cellInput}
                      >
                        {EMI_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <FinanceStatusBadge status={row.status} className="text-[10px] px-1.5 py-0.5" />
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <select
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.receiptNumber || ''}
                      onChange={(e) => onFieldChange(index, 'receiptNumber', e.target.value)}
                      placeholder="RCP-…"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.paidDate || ''}
                      onChange={(e) => onFieldChange(index, 'paidDate', e.target.value)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
<<<<<<< HEAD
                      disabled={locked}
=======
                      disabled={locked && !isEditing}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                      value={row.remarks || ''}
                      onChange={(e) => onFieldChange(index, 'remarks', e.target.value)}
                      className={cellInput}
                    />
                  </td>
<<<<<<< HEAD
=======
                  <td
                    className={cn(
                      'sticky right-0 z-[5] border-l border-slate-100 bg-white px-1 py-2',
                      index % 2 === 1 && 'bg-slate-50/95',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                      {isEditing ? (
                        <>
                          <IconBtn title="Save row" onClick={() => onSaveRow(index)} accent>
                            <Save className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn title="Cancel" onClick={onCancelEdit}>
                            <span className="text-[10px] font-bold">✕</span>
                          </IconBtn>
                        </>
                      ) : (
                        <>
                          {!planClosed && !isPaid && (
                            <>
                              <IconBtn title="Edit" onClick={() => onStartEdit(index)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </IconBtn>
                              <IconBtn title="Fees & discounts" onClick={() => onAdvancedEdit(index)}>
                                <span className="text-[9px] font-bold">Adv</span>
                              </IconBtn>
                            </>
                          )}
                          {!planClosed && remaining > 0 && !isPaid && (
                            <IconBtn title="Collect payment" onClick={() => onCollect(index)} accent>
                              <Banknote className="h-3.5 w-3.5" />
                            </IconBtn>
                          )}
                          {(row.receiptNumber || isPaid) && (
                            <IconBtn title="View receipt" onClick={() => onViewReceipt(index)}>
                              <Receipt className="h-3.5 w-3.5" />
                            </IconBtn>
                          )}
                          {!row.receiptNumber && isPaid && (
                            <IconBtn title="Generate receipt" onClick={() => onGenerateReceipt(index)}>
                              <FileUp className="h-3.5 w-3.5" />
                            </IconBtn>
                          )}
                          <IconBtn title="Row history" onClick={() => onViewHistory(index)}>
                            <History className="h-3.5 w-3.5" />
                          </IconBtn>
                          {canDeleteInstallment(row) && !planClosed && (
                            <IconBtn title="Delete" onClick={() => onDelete(index)} danger>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconBtn>
                          )}
                        </>
                      )}
                    </div>
                  </td>
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
=======

function IconBtn({ children, title, onClick, accent, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md transition',
        accent && 'bg-[#246392] text-white hover:bg-[#1a4d73]',
        danger && 'text-red-600 hover:bg-red-50',
        !accent && !danger && 'text-[#246392] hover:bg-[#eef6fc]',
      )}
    >
      {children}
    </button>
  )
}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
