/**
 * Receipt generation, numbering, and communication service.
 */

import Payment from '../models/Payment.js'
import GstSettings from '../models/GstSettings.js'
import ReceiptSequence from '../models/ReceiptSequence.js'
import CommunicationLog from '../models/CommunicationLog.js'

const BRANCH_MAP = {
  'Delhi Center': 'DEL',
  'Delhi HQ': 'DEL',
  'Hyderabad Center': 'HYD',
  'Pune Center': 'PUN',
  'Mumbai Center': 'PUN',
}

function financialYear(date = new Date()) {
  const d = new Date(date)
  return d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1
}

function resolveBranchCode(payment, gstSettings) {
  const center = payment.centerName || payment.branch || ''
  const branch = (gstSettings.branchGst || []).find(
    (b) => b.branchName === center || b.centerName === center,
  )
  if (branch?.branchCode) return branch.branchCode
  if (branch?.branchId && BRANCH_MAP[branch.branchId]) return BRANCH_MAP[branch.branchId]
  return BRANCH_MAP[center] || 'SRI'
}

function formatNumber(branchCode, type, fy, seq) {
  const padded = String(seq).padStart(5, '0')
  return `${branchCode}-${type}-${fy}-${padded}`
}

export async function loadGstSettings() {
  let doc = await GstSettings.findOne({ key: 'default' })
  if (!doc) {
    doc = await GstSettings.create({ key: 'default' })
  }
  return doc.toObject()
}

export async function nextInvoiceSequence(branchCode, fy) {
  const doc = await ReceiptSequence.findOneAndUpdate(
    { branchCode, financialYear: fy },
    { $inc: { counter: 1 } },
    { new: true, upsert: true },
  )
  return doc.counter
}

export async function generateReceiptForPayment(paymentId, { generatedBy = 'System' } = {}) {
  const payment = await Payment.findOne({
    $or: [{ paymentId }, { _id: paymentId }],
  })
  if (!payment) return null

  if (payment.receiptNumber && payment.receiptLifecycleStatus !== 'Cancelled') {
    return payment.toObject()
  }

  const gstSettings = await loadGstSettings()
  const branchCode = resolveBranchCode(payment, gstSettings)
  const fy = gstSettings.financialYear || financialYear()
  const seq = await nextInvoiceSequence(branchCode, fy)

  const receiptNumber = formatNumber(branchCode, 'RCP', fy, seq)
  const invoiceNumber = formatNumber(branchCode, 'INV', fy, seq)
  const now = new Date()

  payment.receiptNumber = receiptNumber
  payment.invoiceNumber = invoiceNumber
  payment.branchCode = branchCode
  payment.receiptGeneratedAt = now
  payment.receiptGeneratedBy = generatedBy
  payment.receiptLifecycleStatus = 'Generated'
  payment.timeline = [
    ...(payment.timeline || []),
    { event: 'Receipt Generated', timestamp: now },
  ]

  await payment.save()
  return payment.toObject()
}

export async function getCompletedReceipts(filters = {}) {
  const payments = await Payment.find({
    receiptNumber: { $ne: null },
    paymentStatus: { $in: ['Paid', 'Verified'] },
  }).sort({ receiptGeneratedAt: -1 })

  return payments.map((p) => p.toObject())
}

export async function sendReceiptNotification(paymentId, { channel, mobile, email, message, sentBy }) {
  const payment = await Payment.findOne({
    $or: [{ paymentId }, { _id: paymentId }],
  })
  if (!payment) return null

  const channelKey = String(channel || 'Email').toLowerCase()
  const now = new Date()
  const comms = payment.receiptCommunications || {}
  comms[channelKey] = {
    status: 'Delivered',
    sentAt: now,
    sentBy: sentBy || 'Finance Admin',
    deliveredAt: now,
  }

  payment.receiptCommunications = comms
  payment.receiptSentAt = now
  payment.receiptSentBy = sentBy || 'Finance Admin'
  payment.receiptLifecycleStatus = 'Sent'
  payment.receiptResendHistory = [
    ...(payment.receiptResendHistory || []),
    { channel, status: 'Delivered', sentAt: now, sentBy: sentBy || 'Finance Admin' },
  ]

  await payment.save()

  await CommunicationLog.create({
    recipient: channelKey === 'email' ? email || payment.email : mobile || payment.mobile,
    type: 'Payment Receipt',
    channel: channel,
    status: 'Delivered',
    message: message || '',
    timestamp: now,
  })

  return payment.toObject()
}

export async function bulkResendReceipts(paymentIds = [], { channel, sentBy }) {
  const results = []
  for (const id of paymentIds) {
    try {
      const data = await sendReceiptNotification(id, { channel, sentBy })
      results.push({ id, success: Boolean(data), status: 'Delivered' })
    } catch (err) {
      results.push({ id, success: false, status: 'Failed', error: err.message })
    }
  }
  return results
}

export function previewInvoiceNumber(branchCode, sequence, fy) {
  return formatNumber(branchCode || 'SRI', 'INV', fy || financialYear(), sequence)
}
