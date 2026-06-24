import { formatINR } from './financeFilters'
import { formatCategoryDateTime } from './formatDateTime'
import { withInvoiceDisplayFields } from './bookstoreInvoiceDisplay'

function pdfSafeText(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/₹/g, 'Rs.')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
}

function escapePdfString(text) {
  return pdfSafeText(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildInvoiceLines(invoice) {
  const display = withInvoiceDisplayFields(invoice)
  return [
    'SRIRAM IAS',
    'Bookstore Tax Invoice',
    '',
    `Invoice ID: ${display.id}`,
    `Order ID: ${display.orderId}`,
    `Buyer Name: ${display.buyerName}`,
    `Book Name: ${display.bookName}`,
    `Invoice Date: ${display.invoiceDate ? formatCategoryDateTime(display.invoiceDate) : '-'}`,
    `GSTIN: ${display.gstin || '-'}`,
    `Amount: ${pdfSafeText(formatINR(display.amount))}`,
    `Status: ${display.status || 'Generated'}`,
    '',
    'Thank you for your purchase.',
    'Computer-generated invoice - SRIRAM IAS',
  ]
}

function createInvoicePdfBlob(lines) {
  let stream = 'BT\n/F1 11 Tf\n'
  let y = 750

  lines.forEach((line) => {
    if (!line) {
      y -= 10
      return
    }
    stream += `1 0 0 1 50 ${y} Tm (${escapePdfString(line)}) Tj\n`
    y -= 18
  })
  stream += 'ET'

  const streamBytes = new TextEncoder().encode(stream)
  const streamLength = streamBytes.length

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += object
  })

  const xrefPosition = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadBookstoreInvoicePdf(invoice) {
  if (!invoice?.id) return false

  const display = withInvoiceDisplayFields(invoice)
  const blob = createInvoicePdfBlob(buildInvoiceLines(display))
  const filename = `${display.id.replace(/[^\w-]+/g, '_')}.pdf`
  triggerDownload(blob, filename)
  return true
}
