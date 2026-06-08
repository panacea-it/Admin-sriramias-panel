import { Printer, Download, MessageCircle } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { calcReceiptGst, resolveBranchGstSettings } from '../../utils/finance/receiptGst'
import ReceiptStatusBadge from './receipt-center/ReceiptStatusBadge'
import { cn } from '../../utils/cn'

export default function ReceiptPreview({
  payment,
  payments = [],
  installments = [],
  gstSettings = null,
  className,
  onPrint,
  onDownload,
  onWhatsApp,
  hideActions = false,
}) {
  const rows = payments.length ? payments : payment ? [payment] : []
  const primary = payment || rows[0]
  if (!primary) return null

  const branch = resolveBranchGstSettings(primary, gstSettings || {})
  const totalFees = primary.totalFees ?? rows.reduce((s, p) => s + (p.amountPaid || 0), 0)
  const gst = primary.gstBreakup || calcReceiptGst({ ...primary, totalFees }, gstSettings || {})
  const totalPaid = rows.reduce((s, p) => s + (p.amountPaid || 0), primary.amountPaid || totalFees)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        className="relative mx-auto w-full max-w-[210mm] rounded-sm border border-slate-200 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.1)] print:shadow-none"
        style={{ fontFamily: 'Poppins, sans-serif', minHeight: '297mm' }}
      >
        {gstSettings?.watermarkEnabled !== false && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.04]"
            aria-hidden
          >
            <span className="rotate-[-25deg] text-7xl font-black text-[#246392]">SRIram IAS</span>
          </div>
        )}

        <div className="relative border-b-2 border-[#1a3a5c] pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {branch.logoUrl ? (
                <img src={branch.logoUrl} alt="" className="h-12 w-auto object-contain" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#246392] to-[#1a4d73] text-lg font-bold text-white">
                  SI
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#1a3a5c]">{branch.companyName}</h1>
                <p className="text-sm text-[#686868]">{branch.companyAddress}</p>
                <p className="text-sm text-[#686868]">Tax Invoice / Fee Receipt</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-[#246392]">{primary.invoiceNumber || primary.receiptNumber || 'DRAFT'}</p>
              <p className="text-xs text-[#686868]">Receipt: {primary.receiptNumber || '—'}</p>
              <p className="text-[#686868]">{formatCategoryDateTime(primary.receiptGeneratedAt || primary.paymentDate || new Date().toISOString())}</p>
              <ReceiptStatusBadge status={primary.receiptLifecycleStatus || 'Generated'} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[#55ace7]">Bill To</p>
            <p className="mt-1 font-bold text-[#222]">{primary.studentName}</p>
            <p className="text-[#686868]">ID: {primary.studentId}</p>
            <p className="text-[#686868]">{primary.mobile}</p>
            <p className="text-[#686868]">{primary.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase text-[#55ace7]">Course & Payment</p>
            <p className="mt-1 font-bold text-[#222]">{primary.courseName}</p>
            <p className="text-[#686868]">{primary.courseType} · {primary.branchCode || primary.branch}</p>
            <p className="text-[#686868]">{primary.paymentMode} · {primary.transactionId || '—'}</p>
          </div>
        </div>

        <table className="relative mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-left text-white">
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold">Mode</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-3 py-2">
                  {p.courseName}
                  <span className="block text-xs text-[#9ca0a8]">{p.paymentTypeLabel || p.paymentType}</span>
                </td>
                <td className="px-3 py-2">{p.paymentMode}</td>
                <td className="px-3 py-2 text-right font-medium">{formatINR(p.amountPaid)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {installments.length > 0 && (
          <div className="relative mt-6">
            <p className="mb-2 text-xs font-semibold uppercase text-[#55ace7]">EMI Schedule</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#eef2fc] text-[#246392]">
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Due</th>
                  <th className="px-2 py-1.5 text-right">Amount</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((emi) => (
                  <tr key={emi.emiNo} className="border-b border-slate-100">
                    <td className="px-2 py-1.5">{emi.emiNo}</td>
                    <td className="px-2 py-1.5">{emi.dueDate}</td>
                    <td className="px-2 py-1.5 text-right">{formatINR(emi.emiAmount)}</td>
                    <td className="px-2 py-1.5">{emi.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="relative mt-8 ml-auto max-w-xs space-y-1 text-sm">
          <p className="mb-2 text-xs font-bold uppercase text-[#55ace7]">Tax Summary</p>
          <div className="flex justify-between">
            <span className="text-[#686868]">Base Amount</span>
            <span className="font-medium">{formatINR(gst.baseAmount)}</span>
          </div>
          {branch.gstEnabled && gst.gstAmount > 0 && (
            <>
              {gst.interState ? (
                <div className="flex justify-between">
                  <span className="text-[#686868]">IGST @ {gst.gstPercent}%</span>
                  <span className="font-medium">{formatINR(gst.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#686868]">CGST @ {gst.gstPercent / 2}%</span>
                    <span className="font-medium">{formatINR(gst.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#686868]">SGST @ {gst.gstPercent / 2}%</span>
                    <span className="font-medium">{formatINR(gst.sgst)}</span>
                  </div>
                </>
              )}
            </>
          )}
          <div className="flex justify-between border-t border-[#1a3a5c] pt-2 text-base font-bold text-[#1a3a5c]">
            <span>Total Paid</span>
            <span>{formatINR(totalPaid)}</span>
          </div>
        </div>

        <div className="relative mt-10 flex items-end justify-between gap-4">
          <div className="w-[40%] border-t border-slate-300 pt-2 text-xs text-[#555]">Student / Parent</div>
          <div className="w-[42%] text-right">
            {branch.signatureUrl && (
              <img src={branch.signatureUrl} alt="" className="ml-auto mb-1 max-h-12 object-contain" />
            )}
            <div className="border-t border-slate-300 pt-2 text-xs text-[#555]">
              <strong>{branch.signatoryName}</strong>
              <br />
              {branch.signatoryDesignation}
              <br />
              <span className="text-[10px] text-[#888]">
                Signed: {formatCategoryDateTime(primary.signatureSignedAt || primary.receiptGeneratedAt)}
              </span>
            </div>
          </div>
        </div>

        {primary.verificationHash && (
          <p className="relative mt-4 text-center text-[10px] text-[#686868]">
            Verification: {primary.verificationHash}
          </p>
        )}

        <p className="relative mt-6 text-center text-xs text-[#9ca0a8]">
          {branch.footerText}
          <br />
          GSTIN: {branch.gstNumber}
          {gstSettings?.termsAndConditions && (
            <>
              <br />
              <span className="text-[10px]">{gstSettings.termsAndConditions}</span>
            </>
          )}
        </p>
      </div>

      {!hideActions && (
        <div className="flex flex-wrap justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#246392] px-4 py-2 text-sm font-semibold text-white"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onWhatsApp}
            className="inline-flex items-center gap-2 rounded-lg border border-[#25D366] bg-white px-4 py-2 text-sm font-semibold text-[#128C7E]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
