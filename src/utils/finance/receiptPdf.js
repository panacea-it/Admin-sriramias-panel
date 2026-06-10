import { formatINR } from '../financeFilters'
import { calcReceiptGst, resolveBranchGstSettings } from './receiptGst'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function buildReceiptDocumentHtml(row, gstSettings = {}) {
  const branch = resolveBranchGstSettings(row, gstSettings)
  const gst = calcReceiptGst(row, gstSettings)
  const isEmi = row.receiptStatus === 'EMI Completed' || row.paymentTypeLabel === 'EMI Completed'
  const watermark = gstSettings.watermarkEnabled !== false
  const refId = row.verificationHash || row.transactionId || row.id

  const taxRows = branch.gstEnabled
    ? `
    <tr><td>Taxable Amount</td><td style="text-align:right">${formatINR(gst.baseAmount)}</td></tr>
    ${gst.interState
      ? `<tr><td>IGST @ ${gst.gstPercent}%</td><td style="text-align:right">${formatINR(gst.igst)}</td></tr>`
      : `<tr><td>CGST @ ${gst.gstPercent / 2}%</td><td style="text-align:right">${formatINR(gst.cgst)}</td></tr>
         <tr><td>SGST @ ${gst.gstPercent / 2}%</td><td style="text-align:right">${formatINR(gst.sgst)}</td></tr>`}
    `
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receipt ${escapeHtml(row.receiptNumber)}</title>
<style>
@page{size:A4;margin:16mm}
body{font-family:Poppins,system-ui,sans-serif;padding:32px;color:#111;max-width:210mm;margin:0 auto;position:relative}
.watermark{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72px;color:rgba(36,99,146,0.06);font-weight:800;pointer-events:none;z-index:0}
.content{position:relative;z-index:1}
.hdr{border-bottom:2px solid #1a3a5c;padding-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:22px;font-weight:800;color:#1a3a5c}
.meta{text-align:right;font-size:13px;color:#555}
.note{margin-top:16px;padding:12px;background:#eef6fc;border-radius:8px;font-size:13px;color:#246392}
.tax-box{margin-top:20px;margin-left:auto;max-width:280px;font-size:14px}
.tax-box table{width:100%;border:none}
.tax-box td{padding:4px 0;border:none}
.tax-box .total{border-top:2px solid #1a3a5c;padding-top:8px;font-size:16px;font-weight:700;color:#1a3a5c}
table.items{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
table.items th{background:#246392;color:#fff;text-align:left;padding:8px}
table.items td{border-bottom:1px solid #e2e8f0;padding:8px}
.footer{margin-top:32px;text-align:center;font-size:11px;color:#888}
.sign{margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px}
.sign div{width:42%}
.sign img{max-height:48px;margin-bottom:4px}
.sign-line{border-top:1px solid #333;padding-top:8px}
.qr{margin-top:16px;text-align:center;font-size:10px;color:#686868}
@media print{body{padding:16px}.no-print{display:none}}
</style></head><body>
${watermark ? '<div class="watermark">SRIram IAS</div>' : ''}
<div class="content">
<div class="hdr">
  <div>
    ${branch.logoUrl ? `<img src="${escapeHtml(branch.logoUrl)}" alt="Logo" style="max-height:48px;margin-bottom:8px"/>` : ''}
    <div class="logo">${escapeHtml(branch.companyName)}</div>
    <div style="font-size:13px;color:#686868">${escapeHtml(branch.companyAddress)}</div>
    <div style="font-size:12px;color:#686868;margin-top:4px">Tax Invoice / Fee Receipt</div>
  </div>
  <div class="meta">
    <strong style="font-size:15px;color:#246392">${escapeHtml(row.invoiceNumber || row.receiptNumber)}</strong><br/>
    Receipt: ${escapeHtml(row.receiptNumber)}<br/>
    ${formatDate(row.receiptGeneratedAt || row.paymentDate)}<br/>
    GSTIN: ${escapeHtml(branch.gstNumber)}
  </div>
</div>
<div style="margin-top:20px;font-size:14px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <div>
    <strong style="color:#55ace7;font-size:11px;text-transform:uppercase">Bill To</strong><br/>
    <strong>${escapeHtml(row.studentName)}</strong> (${escapeHtml(row.studentId)})<br/>
    ${escapeHtml(row.mobile || '—')} · ${escapeHtml(row.email || '—')}
  </div>
  <div style="text-align:right">
    <strong style="color:#55ace7;font-size:11px;text-transform:uppercase">Course</strong><br/>
    <strong>${escapeHtml(row.courseName)}</strong><br/>
    ${escapeHtml(row.paymentTypeLabel || row.paymentType || '')} · ${escapeHtml(row.paymentMode || '—')}<br/>
    ${escapeHtml(row.centerName || row.branch || '')} · Branch ${escapeHtml(row.branchCode || '—')}
  </div>
</div>
${isEmi ? `<div class="note"><strong>EMI Completed:</strong> ${escapeHtml(row.emiCompletionNote || 'All installments settled.')}</div>` : ''}
<table class="items"><thead><tr><th>Description</th><th>Transaction ID</th><th style="text-align:right">Amount</th></tr></thead>
<tbody><tr>
  <td>${escapeHtml(row.courseName)}<br/><small>${escapeHtml(row.paymentTypeLabel || '')}</small></td>
  <td>${escapeHtml(row.transactionId || '—')}</td>
  <td style="text-align:right">${formatINR(row.amountPaid ?? row.totalAmount)}</td>
</tr></tbody></table>
<div class="tax-box">
  <table>${taxRows}
  <tr class="total"><td>Total Paid</td><td style="text-align:right">${formatINR(gst.totalAmount)}</td></tr>
  </table>
</div>
<div class="sign">
  <div><div class="sign-line">Student / Parent</div></div>
  <div style="text-align:right">
    ${branch.signatureUrl ? `<img src="${escapeHtml(branch.signatureUrl)}" alt="Signature"/>` : ''}
    <div class="sign-line">${escapeHtml(branch.signatoryName)}<br/><small>${escapeHtml(branch.signatoryDesignation)}</small><br/>
    <small>Signed: ${formatDate(row.signatureSignedAt || row.receiptGeneratedAt)}</small></div>
  </div>
</div>
<div class="qr">Reference ID: ${escapeHtml(refId)}${row.verificationHash ? ` · Verify: ${escapeHtml(row.verificationHash)}` : ''}</div>
<div class="footer">${escapeHtml(branch.footerText)}<br/>${escapeHtml(branch.termsAndConditions)}<br/>Computer-generated receipt · ${escapeHtml(branch.companyName)}</div>
</div></body></html>`
}

export function printReceiptDocument(row, gstSettings = {}) {
  const html = buildReceiptDocumentHtml(row, gstSettings)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
  return true
}

export function downloadReceiptHtml(row, gstSettings = {}) {
  const html = buildReceiptDocumentHtml(row, gstSettings)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(row.receiptNumber || 'receipt').replace(/[^\w-]+/g, '_')}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
  return true
}

export function openReceiptPdfPreview(row, gstSettings = {}) {
  const html = buildReceiptDocumentHtml(row, gstSettings)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  win.focus()
  return true
}
