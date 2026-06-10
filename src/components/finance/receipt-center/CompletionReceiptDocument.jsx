import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { calcReceiptGst, resolveBranchGstSettings } from '../../../utils/finance/receiptGst'
import ReceiptStatusBadge from './ReceiptStatusBadge'
import { cn } from '../../../utils/cn'

export default function CompletionReceiptDocument({ row, gstSettings = null, className, compact = false }) {
  if (!row) return null

  const branch = resolveBranchGstSettings(row, gstSettings || {})
  const totalFees = row.totalFees ?? row.amountPaid ?? 0
  const gst = row.gstBreakup || calcReceiptGst({ ...row, totalFees }, gstSettings || {})
  const isEmi = row.receiptStatus === 'EMI Completed'

  return (
    <div
      className={cn(
        'mx-auto w-full rounded-lg border border-slate-200 bg-white shadow-inner',
        compact ? 'p-4 text-xs' : 'p-6 sm:p-8 text-sm',
        className,
      )}
      style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
    >
      <div className="flex items-start justify-between gap-3 border-b-2 border-[#1a3a5c] pb-3">
        <div className="flex items-start gap-3">
          {branch.logoUrl ? (
            <img src={branch.logoUrl} alt="" className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#246392] to-[#1a4d73] text-lg font-bold text-white">
              SI
            </div>
          )}
          <div>
            <h2 className={cn('font-bold text-[#1a3a5c]', compact ? 'text-base' : 'text-xl')}>
              {branch.companyName}
            </h2>
            <p className="text-[#686868]">Official Fee Receipt</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#246392]">{row.invoiceNumber || row.receiptNumber}</p>
          <p className="text-[10px] text-[#686868]">{row.receiptNumber}</p>
          <p className="text-[#686868]">{formatCategoryDateTime(row.receiptGeneratedAt || row.paymentDate)}</p>
          <ReceiptStatusBadge status={row.receiptLifecycleStatus || row.receiptStatus} className="mt-1" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#55ace7]">Student</p>
          <p className="font-bold text-[#222]">{row.studentName}</p>
          <p className="text-[#686868]">ID: {row.studentId}</p>
          <p className="text-[#686868]">{row.mobile}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#55ace7]">Course</p>
          <p className="font-bold text-[#222]">{row.courseName}</p>
          <p className="text-[#686868]">
            {row.paymentTypeLabel} · {row.paymentMode} · {row.branchCode}
          </p>
        </div>
      </div>

      {isEmi && (
        <div className="mt-3 rounded-lg border border-[#246392]/20 bg-[#eef6fc] px-3 py-2 text-xs text-[#246392]">
          <strong>EMI completion:</strong>{' '}
          {row.emiCompletionNote || 'All EMI installments have been successfully completed.'}
        </div>
      )}

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-left text-white">
            <th className="px-2 py-1.5 font-semibold">Description</th>
            <th className="px-2 py-1.5 font-semibold">Mode</th>
            <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="px-2 py-2">{row.courseName}</td>
            <td className="px-2 py-2">{row.paymentMode}</td>
            <td className="px-2 py-2 text-right font-semibold">{formatINR(row.amountPaid)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-[220px] space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-[#686868]">Base</span>
          <span>{formatINR(gst.baseAmount)}</span>
        </div>
        {branch.gstEnabled && gst.gstAmount > 0 && (
          gst.interState ? (
            <div className="flex justify-between">
              <span className="text-[#686868]">IGST {gst.gstPercent}%</span>
              <span>{formatINR(gst.igst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-[#686868]">CGST {gst.gstPercent / 2}%</span>
                <span>{formatINR(gst.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#686868]">SGST {gst.gstPercent / 2}%</span>
                <span>{formatINR(gst.sgst)}</span>
              </div>
            </>
          )
        )}
        <div className="flex justify-between border-t border-[#1a3a5c] pt-1 text-sm font-bold text-[#1a3a5c]">
          <span>Total paid</span>
          <span>{formatINR(row.amountPaid)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-[10px] text-[#555]">
        <span className="w-[40%] border-t border-slate-300 pt-2">Student signature</span>
        <span className="w-[40%] border-t border-slate-300 pt-2 text-right">
          {branch.signatureUrl && <img src={branch.signatureUrl} alt="" className="ml-auto mb-1 max-h-8" />}
          {branch.signatoryName}
          <br />
          <small>{branch.signatoryDesignation}</small>
        </span>
      </div>

      <p className="mt-4 text-center text-[10px] text-[#9ca0a8]">
        GSTIN: {branch.gstNumber}
        {row.verificationHash && ` · Verify: ${row.verificationHash}`}
      </p>
    </div>
  )
}
