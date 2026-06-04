import Payment from '../models/Payment.js'
import EmiPlan from '../models/EmiPlan.js'
import GstSettings from '../models/GstSettings.js'
import CommunicationLog from '../models/CommunicationLog.js'
import {
  bulkResendReceipts,
  generateReceiptForPayment,
  getCompletedReceipts,
  previewInvoiceNumber,
  sendReceiptNotification,
} from '../services/receiptService.js'
import {
  SEED_PAYMENTS,
  SEED_OFFLINE,
  SEED_EMI_PLANS,
  SEED_COMM_LOGS,
  SEED_GST,
  buildSeedDashboard,
} from '../data/financeSeedData.js'
import {
  buildEnrichedProfiles,
  buildProfileDetail,
} from '../services/studentFinanceProfileService.js'
import {
  appendAudit,
  applyOfflineDecision,
  buildSummary,
  evaluateBranchAccess,
  mapOfflineFull,
  validateApproval,
} from '../services/offlineApprovalService.js'
import {
  enrichAttemptLogs,
  buildAttemptAnalytics,
  setAttemptOverride,
  getAttemptOverrides,
} from '../services/paymentAttemptService.js'

function toIso(value) {
  if (!value) return value === 0 ? 0 : ''
  if (value instanceof Date) return value.toISOString()
  return value
}

function mapPayment(doc) {
  if (!doc) return null
  const p = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: p.paymentId || String(p._id),
    studentId: p.studentId,
    studentName: p.studentName,
    mobile: p.mobile,
    email: p.email,
    courseId: p.courseId,
    courseName: p.courseName,
    courseType: p.courseType,
    paymentStatus: p.paymentStatus,
    paymentType: p.paymentType,
    paymentMode: p.paymentMode,
    amountPaid: p.amountPaid,
    pendingAmount: p.pendingAmount,
    totalFees: p.totalFees,
    gst: p.gst,
    transactionId: p.transactionId,
    paymentDate: toIso(p.paymentDate),
    branch: p.branch,
    attempts: (p.attempts || []).map((a) => ({
      ...a,
      dateTime: toIso(a.dateTime),
    })),
    adminLogs: (p.adminLogs || []).map((l) => ({
      ...l,
      timestamp: toIso(l.timestamp),
    })),
    timeline: (p.timeline || []).map((t) => ({
      ...t,
      timestamp: toIso(t.timestamp),
    })),
    receiptNumber: p.receiptNumber,
  }
}

function mapOffline(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: p.paymentId || String(p._id),
    studentName: p.studentName,
    studentId: p.studentId,
    course: p.courseName,
    courseId: p.courseId,
    amount: p.amountPaid || p.totalFees,
    status: p.offlineStatus || 'Pending',
    requestedDate: toIso(p.requestedDate),
    paymentProof: p.paymentProof,
    paymentMode: p.paymentMode,
  }
}

function mapEmi(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: p.planId || String(p._id),
    studentId: p.studentId,
    studentName: p.studentName,
    courseId: p.courseId,
    courseName: p.courseName,
    totalFees: p.totalFees,
    totalPaid: p.totalPaid,
    pendingAmount: p.pendingAmount,
    completionPercent: p.completionPercent,
    installments: p.installments || [],
    loanProvider: p.loanProvider,
    planStatus: p.planStatus || p.status,
    status: p.status,
    providerStatus: p.providerStatus,
    providerRefId: p.providerRefId,
    loanAmount: p.loanAmount,
    counselorName: p.counselorName,
    planHistory: p.planHistory || [],
    reminderLogs: p.reminderLogs || [],
    agreements: p.agreements || [],
    settlementRemarks: p.settlementRemarks,
    emiStartDate: p.emiStartDate,
  }
}

function mapComm(doc) {
  const c = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: c.logId || String(c._id),
    studentId: c.studentId,
    studentName: c.studentName,
    paymentReference: c.paymentReference,
    recipient: c.recipient,
    type: c.type,
    channel: c.channel,
    status: c.status,
    deliveryStatus: c.deliveryStatus || c.status,
    openStatus: c.openStatus,
    readStatus: c.readStatus,
    sentBy: c.sentBy,
    timestamp: toIso(c.timestamp),
    tracking: c.tracking,
    followUpTag: c.followUpTag,
    followUpPriority: c.followUpPriority,
    followUpNotes: c.followUpNotes,
    nextFollowUpDate: c.nextFollowUpDate ? toIso(c.nextFollowUpDate) : null,
    counselorId: c.counselorId,
    counselorName: c.counselorName,
    templateId: c.templateId,
    auditTrail: c.auditTrail,
    meta: c.meta,
  }
}

function mapGst(doc) {
  if (!doc) return { ...SEED_GST, branchGst: [...SEED_GST.branchGst] }
  const g = doc.toObject ? doc.toObject() : { ...doc }
  delete g._id
  delete g.__v
  delete g.key
  delete g.createdAt
  delete g.updatedAt
  return g
}

async function loadPayments(filter = {}) {
  const docs = await Payment.find({ isOfflineRequest: { $ne: true }, ...filter }).lean()
  if (docs.length) return docs.map((d) => mapPayment({ toObject: () => d }))
  return SEED_PAYMENTS.map(mapPayment)
}

async function loadOffline() {
  const docs = await Payment.find({ isOfflineRequest: true }).lean()
  if (docs.length) return docs.map((d) => mapOfflineFull({ toObject: () => d }))
  return SEED_OFFLINE.map((o) =>
    mapOfflineFull({
      toObject: () => ({
        ...o,
        courseName: o.courseName || o.course,
        offlineStatus: o.offlineStatus || o.status,
      }),
    }),
  )
}

async function loadEmiPlans() {
  const docs = await EmiPlan.find().lean()
  if (docs.length) return docs.map((d) => mapEmi({ toObject: () => d }))
  return SEED_EMI_PLANS.map((p) => mapEmi({ toObject: () => p }))
}

async function loadCommLogs() {
  const docs = await CommunicationLog.find().sort({ timestamp: -1 }).lean()
  if (docs.length) return docs.map((d) => mapComm({ toObject: () => d }))
  return SEED_COMM_LOGS.map((c) => mapComm({ toObject: () => c }))
}

async function loadGst() {
  const doc = await GstSettings.findOne({ key: 'default' }).lean()
  if (doc) return mapGst(doc)
  return mapGst(SEED_GST)
}

function buildProfiles(payments) {
  const byStudent = new Map()
  for (const p of payments) {
    if (!p.studentId) continue
    const existing = byStudent.get(p.studentId)
    const courseEntry = {
      courseId: p.courseId,
      courseName: p.courseName,
      courseType: p.courseType,
      paymentStatus:
        p.paymentStatus === 'Paid'
          ? 'Active'
          : p.paymentStatus === 'Partial'
            ? 'Pending Payment'
            : 'Pending Payment',
      date: p.paymentDate || '',
      paymentType: p.paymentType,
      paidAmount: p.amountPaid,
      pendingAmount: p.pendingAmount,
    }
    if (existing) {
      existing.totalPaid += p.amountPaid || 0
      existing.totalPending += p.pendingAmount || 0
      existing.courses.push(courseEntry)
    } else {
      byStudent.set(p.studentId, {
        id: p.studentId,
        studentName: p.studentName,
        mobile: p.mobile,
        email: p.email,
        branch: p.branch,
        totalPaid: p.amountPaid || 0,
        totalPending: p.pendingAmount || 0,
        courses: [courseEntry],
      })
    }
  }
  return [...byStudent.values()]
}

function buildAttemptLogs(payments) {
  return enrichAttemptLogs(payments, getAttemptOverrides())
}

export async function getPaymentAttemptLogs(req, res, next) {
  try {
    const payments = await loadPayments()
    res.json({ success: true, data: buildAttemptLogs(payments) })
  } catch (error) {
    next(error)
  }
}

export async function getPaymentAttemptAnalytics(req, res, next) {
  try {
    const payments = await loadPayments()
    res.json({ success: true, data: buildAttemptAnalytics(payments, getAttemptOverrides()) })
  } catch (error) {
    next(error)
  }
}

export async function assignPaymentAttemptCounselor(req, res, next) {
  try {
    const { ids = [], counselorId, counselorName, leadStatus, priority } = req.body || {}
    if (!ids.length || !counselorId) {
      return res.status(400).json({ success: false, message: 'ids and counselorId required' })
    }
    ids.forEach((id) => setAttemptOverride(id, { counselorId, counselorName, leadStatus, priority }))
    const payments = await loadPayments()
    res.json({ success: true, data: buildAttemptLogs(payments) })
  } catch (error) {
    next(error)
  }
}

export async function blockPaymentAttemptDevice(req, res, next) {
  try {
    const { attemptId } = req.body || {}
    if (!attemptId) return res.status(400).json({ success: false, message: 'attemptId required' })
    const by = req.user?.name || 'Finance Admin'
    const prev = getAttemptOverrides()[attemptId] || {}
    setAttemptOverride(attemptId, {
      fraudStatus: 'Blocked',
      isBlocked: true,
      fraudAudit: [...(prev.fraudAudit || []), { id: `AUD-${Date.now()}`, action: 'Blocked device/IP', by, at: new Date().toISOString() }],
    })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function unblockPaymentAttemptDevice(req, res, next) {
  try {
    const { attemptId } = req.body || {}
    if (!attemptId) return res.status(400).json({ success: false, message: 'attemptId required' })
    const by = req.user?.name || 'Finance Admin'
    const prev = getAttemptOverrides()[attemptId] || {}
    setAttemptOverride(attemptId, {
      fraudStatus: 'Safe',
      isBlocked: false,
      fraudAudit: [...(prev.fraudAudit || []), { id: `AUD-${Date.now()}`, action: 'Unblocked device/IP', by, at: new Date().toISOString() }],
    })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function sendPaymentAttemptRecoveryMessage(req, res, next) {
  try {
    const payload = req.body || {}
    if (!payload.attemptId) return res.status(400).json({ success: false, message: 'attemptId required' })
    const entry = await CommunicationLog.create({
      logId: `COM-ATT-${Date.now()}`,
      recipient: payload.mobile || payload.email || 'Student',
      type: 'Payment Recovery',
      channel: payload.channel || 'WhatsApp',
      status: `${payload.channel || 'WhatsApp'} trigger placeholder`,
      timestamp: new Date(),
      meta: payload,
    })
    res.status(201).json({ success: true, data: mapComm(entry) })
  } catch (error) {
    next(error)
  }
}

function buildVerificationQueue(payments) {
  return payments
    .filter((p) => p.paymentStatus === 'Pending' || p.paymentStatus === 'Partial')
    .map((p) => ({
      id: p.id,
      student: p.studentName,
      course: p.courseName,
      amount: p.pendingAmount || p.totalFees,
      status: p.paymentStatus,
      submittedAt: p.paymentDate || new Date().toISOString(),
    }))
}

function findPaymentById(payments, id) {
  return payments.find((p) => p.id === id || String(p._id) === id)
}

export async function getFinanceDashboard(req, res, next) {
  try {
    const payments = await loadPayments()
    const emiPlans = await loadEmiPlans()
    const offline = await loadOffline()
    const seedPayments = payments.map((p) => ({
      ...p,
      isOfflineRequest: false,
      offlineStatus: 'Pending',
    }))
    const dashboard = buildSeedDashboard(
      [...seedPayments, ...offline.map((o) => ({ amountPaid: o.amount, paymentStatus: 'Pending', isOfflineRequest: true, offlineStatus: o.status }))],
      emiPlans,
    )
    res.json({ success: true, data: dashboard })
  } catch (error) {
    next(error)
  }
}

export async function getPaymentReports(req, res, next) {
  try {
    const data = await loadPayments()
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

export async function getPaymentReportById(req, res, next) {
  try {
    const payments = await loadPayments()
    const found = findPaymentById(payments, req.params.id)
    if (!found) {
      const doc = await Payment.findOne({
        $or: [{ paymentId: req.params.id }, { _id: req.params.id }],
      })
      if (!doc) return res.status(404).json({ success: false, message: 'Payment not found' })
      return res.json({ success: true, data: mapPayment(doc) })
    }
    res.json({ success: true, data: found })
  } catch (error) {
    next(error)
  }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const { id } = req.params
    const payload = req.body || {}
    let doc = await Payment.findOne({
      $or: [{ paymentId: id }, { _id: id }],
      isOfflineRequest: { $ne: true },
    })

    if (!doc) {
      const payments = await loadPayments()
      const seed = findPaymentById(payments, id)
      if (!seed) return res.status(404).json({ success: false, message: 'Payment not found' })
      const updated = {
        ...seed,
        paymentStatus: payload.newStatus || seed.paymentStatus,
        amountPaid:
          payload.amountAdjustment != null ? Number(payload.amountAdjustment) : seed.amountPaid,
        paymentMode: payload.paymentMode || seed.paymentMode,
        transactionId: payload.transactionId || seed.transactionId,
        paymentDate: payload.paymentDate || seed.paymentDate,
        adminLogs: [
          ...(seed.adminLogs || []),
          {
            adminName: payload.adminName || 'Admin',
            action: `Status → ${payload.newStatus}`,
            comment: payload.comment,
            timestamp: new Date().toISOString(),
          },
        ],
      }
      return res.json({ success: true, data: updated })
    }

    if (payload.newStatus) doc.paymentStatus = payload.newStatus
    if (payload.amountAdjustment != null) doc.amountPaid = Number(payload.amountAdjustment)
    if (payload.paymentMode) doc.paymentMode = payload.paymentMode
    if (payload.transactionId) doc.transactionId = payload.transactionId
    if (payload.paymentDate) doc.paymentDate = payload.paymentDate
    doc.adminLogs.push({
      adminName: payload.adminName || 'Admin',
      action: `Status → ${payload.newStatus || doc.paymentStatus}`,
      comment: payload.comment,
      timestamp: new Date(),
    })
    await doc.save()
    res.json({ success: true, data: mapPayment(doc) })
  } catch (error) {
    next(error)
  }
}

export async function getOfflineApprovals(req, res, next) {
  try {
    let data = await loadOffline()
    const { branch, paymentMode, status, dateFrom, dateTo } = req.query || {}
    if (branch && branch !== 'all') data = data.filter((r) => r.branchCode === branch)
    if (paymentMode && paymentMode !== 'all') data = data.filter((r) => r.paymentMode === paymentMode)
    if (status && status !== 'all') {
      data = data.filter((r) => r.status === status || r.workflowStatus === status)
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      data = data.filter((r) => new Date(r.requestedDate) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      data = data.filter((r) => new Date(r.requestedDate) <= to)
    }
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

export async function getOfflineDailySummary(req, res, next) {
  try {
    const data = await loadOffline()
    res.json({ success: true, data: buildSummary(data) })
  } catch (error) {
    next(error)
  }
}

export async function getOfflineNotifications(req, res, next) {
  try {
    const docs = await Payment.find({ isOfflineRequest: true, 'notificationLog.0': { $exists: true } }).lean()
    const logs = docs.flatMap((d) => d.notificationLog || [])
    res.json({ success: true, data: logs })
  } catch (error) {
    next(error)
  }
}

export async function uploadOfflineProofHandler(req, res, next) {
  try {
    const { id } = req.params
    const { files = [], adminName } = req.body || {}
    const doc = await Payment.findOne({
      $or: [{ paymentId: id }, { _id: id }],
      isOfflineRequest: true,
    })
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' })

    doc.proofFiles = files
    doc.paymentProof = files.map((f) => f.name).join(', ')
    appendAudit(doc, {
      by: adminName || 'Admin',
      action: 'Re-upload',
      remark: `${files.length} file(s) uploaded`,
    })
    await doc.save()
    res.json({ success: true, data: mapOfflineFull(doc) })
  } catch (error) {
    next(error)
  }
}

export async function overrideOfflineDuplicateHandler(req, res, next) {
  try {
    const { id } = req.params
    const { adminName, comment } = req.body || {}
    const doc = await Payment.findOne({
      $or: [{ paymentId: id }, { _id: id }],
      isOfflineRequest: true,
    })
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' })

    doc.duplicateOverride = true
    doc.duplicateStatus = 'Override Approved'
    appendAudit(doc, {
      by: adminName || 'Finance Head',
      action: 'Duplicate override',
      remark: comment || 'Marked valid',
    })
    await doc.save()
    res.json({ success: true, data: mapOfflineFull(doc) })
  } catch (error) {
    next(error)
  }
}

export async function updateOfflineReconciliationHandler(req, res, next) {
  try {
    const { id } = req.params
    const { collectedAmount, verifiedAmount, notes, status, adminName } = req.body || {}
    const doc = await Payment.findOne({
      $or: [{ paymentId: id }, { _id: id }],
      isOfflineRequest: true,
    })
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' })

    if (collectedAmount != null) doc.cashCollectedAmount = Number(collectedAmount)
    if (verifiedAmount != null) doc.reconciliationVerifiedAmount = Number(verifiedAmount)
    if (notes) doc.reconciliationNotes = notes
    if (status) doc.reconciliationStatus = status
    appendAudit(doc, {
      by: adminName || 'Admin',
      action: 'Reconciliation update',
      remark: notes || `Status → ${doc.reconciliationStatus}`,
    })
    await doc.save()
    res.json({ success: true, data: mapOfflineFull(doc) })
  } catch (error) {
    next(error)
  }
}

export async function approveOfflinePayment(req, res, next) {
  try {
    const { id } = req.params
    const payload = req.body || {}
    const user = req.user || { role: payload.role, centers: payload.centers, branches: payload.branches }
    payload.adminName = payload.adminName || user.name || 'Admin'
    payload.ip = req.ip

    let doc = await Payment.findOne({
      $or: [{ paymentId: id }, { _id: id }],
      isOfflineRequest: true,
    })

    if (!doc) {
      const offline = await loadOffline()
      const found = offline.find((o) => o.id === id)
      if (!found) return res.status(404).json({ success: false, message: 'Request not found' })
      const access = evaluateBranchAccess(found, user)
      if (!access.allowed && !payload.forceOverride) {
        return res.status(403).json({ success: false, message: access.message || 'Branch restricted' })
      }
      const status = payload.newStatus === 'Approved' ? 'Approved' : 'Rejected'
      return res.json({ success: true, data: { ...found, status } })
    }

    const access = evaluateBranchAccess(mapOfflineFull(doc), user)
    if (!access.allowed && !access.override && !payload.forceOverride) {
      appendAudit(doc, {
        by: payload.adminName,
        action: 'Unauthorized attempt',
        remark: access.message,
        ip: payload.ip,
      })
      await doc.save()
      return res.status(403).json({ success: false, message: access.message || 'Branch restricted' })
    }

    const validation = validateApproval(doc, payload)
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message })
    }

    applyOfflineDecision(doc, payload)
    await doc.save()
    res.json({ success: true, data: mapOfflineFull(doc) })
  } catch (error) {
    next(error)
  }
}

export async function getEmiPlans(req, res, next) {
  try {
    const data = await loadEmiPlans()
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

export async function updateEmiPlan(req, res, next) {
  try {
    const { planId } = req.params
    const { installments } = req.body || {}

    let doc = await EmiPlan.findOne({
      $or: [{ planId }, { _id: planId }],
    })

    if (!doc) {
      const plans = await loadEmiPlans()
      const found = plans.find((p) => p.id === planId)
      if (!found) return res.status(404).json({ success: false, message: 'EMI plan not found' })
      return res.json({ success: true, data: { ...found, installments: installments || found.installments } })
    }

    if (installments) doc.installments = installments
    await doc.save()
    res.json({ success: true, data: mapEmi(doc) })
  } catch (error) {
    next(error)
  }
}

export async function getStudentFinanceProfiles(req, res, next) {
  try {
    const payments = await loadPayments()
    const emiPlans = await loadEmiPlans()
    res.json({ success: true, data: buildEnrichedProfiles(payments, emiPlans) })
  } catch (error) {
    next(error)
  }
}

export async function getStudentFinanceProfileById(req, res, next) {
  try {
    const payments = await loadPayments()
    const emiPlans = await loadEmiPlans()
    const data = buildProfileDetail(req.params.studentId, payments, emiPlans)
    if (!data) return res.status(404).json({ success: false, message: 'Student finance profile not found' })
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function creditStudentWallet(req, res, next) {
  try {
    const { amount, remarks } = req.body || {}
    const credit = Number(amount) || 0
    if (credit <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' })
    const by = req.user?.name || 'Finance Admin'
    res.json({
      success: true,
      data: {
        id: `WLT-${Date.now()}`,
        type: 'Credit',
        amount: credit,
        remarks: remarks || 'Wallet top-up',
        at: new Date().toISOString(),
        by,
        balanceAfter: credit,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function uploadStudentFinanceDocument(req, res, next) {
  try {
    const { type, fileName } = req.body || {}
    if (!type || !fileName) return res.status(400).json({ success: false, message: 'Document type and file name required' })
    const by = req.user?.name || 'Finance Admin'
    res.status(201).json({
      success: true,
      data: {
        id: `DOC-${Date.now()}`,
        type,
        fileName,
        label: type.replace(/_/g, ' '),
        uploadedAt: new Date().toISOString(),
        uploadedBy: by,
        status: 'uploaded',
      },
      audit: { action: 'document_uploaded', by, at: new Date().toISOString() },
    })
  } catch (error) {
    next(error)
  }
}


export async function getCommunicationLogs(req, res, next) {
  try {
    const data = await loadCommLogs()
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

export async function sendPaymentReminder(req, res, next) {
  try {
    const payload = req.body || {}
    const entry = await CommunicationLog.create({
      logId: `COM-${Date.now()}`,
      recipient: payload.mobile || payload.email,
      type: 'Payment Reminder',
      channel: payload.channel || 'WhatsApp',
      status: 'Queued',
      timestamp: new Date(),
      meta: payload,
    })
    res.status(201).json({ success: true, data: mapComm(entry) })
  } catch (error) {
    next(error)
  }
}

export async function getVerificationQueue(req, res, next) {
  try {
    const payments = await loadPayments()
    res.json({ success: true, data: buildVerificationQueue(payments) })
  } catch (error) {
    next(error)
  }
}

export async function getGstSettings(req, res, next) {
  try {
    const data = await loadGst()
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateGstSettings(req, res, next) {
  try {
    const payload = req.body || {}
    let doc = await GstSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: payload, key: 'default' },
      { new: true, upsert: true },
    )
    res.json({ success: true, data: mapGst(doc) })
  } catch (error) {
    next(error)
  }
}

export async function generateReceipt(req, res, next) {
  try {
    const generatedBy = req.user?.name || req.body?.generatedBy || 'Finance Admin'
    const data = await generateReceiptForPayment(req.params.paymentId, { generatedBy })
    if (!data) return res.status(404).json({ success: false, message: 'Payment not found' })
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function resendReceipt(req, res, next) {
  try {
    const { channel, mobile, email, message } = req.body || {}
    const sentBy = req.user?.name || 'Finance Admin'
    const data = await sendReceiptNotification(req.params.paymentId, {
      channel: channel || 'Email',
      mobile,
      email,
      message,
      sentBy,
    })
    if (!data) return res.status(404).json({ success: false, message: 'Payment not found' })
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getCompletedReceiptsHandler(req, res, next) {
  try {
    const data = await getCompletedReceipts(req.query || {})
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function sendReceiptHandler(req, res, next) {
  try {
    const { channel, mobile, email, message } = req.body || {}
    const sentBy = req.user?.name || 'Finance Admin'
    const data = await sendReceiptNotification(req.params.paymentId, {
      channel,
      mobile,
      email,
      message,
      sentBy,
    })
    if (!data) return res.status(404).json({ success: false, message: 'Payment not found' })
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function bulkResendReceiptsHandler(req, res, next) {
  try {
    const { paymentIds = [], channel } = req.body || {}
    if (!Array.isArray(paymentIds) || !paymentIds.length) {
      return res.status(400).json({ success: false, message: 'paymentIds required' })
    }
    const sentBy = req.user?.name || 'Finance Admin'
    const results = await bulkResendReceipts(paymentIds, { channel: channel || 'Email', sentBy })
    res.json({ success: true, data: { results, total: results.length, succeeded: results.filter((r) => r.success).length } })
  } catch (error) {
    next(error)
  }
}

export async function previewReceiptNumberHandler(req, res, next) {
  try {
    const { branchCode = 'DEL', sequence = 1, financialYear } = req.query || {}
    const fy = Number(financialYear) || new Date().getFullYear()
    const invoiceNumber = previewInvoiceNumber(branchCode, Number(sequence), fy)
    res.json({ success: true, data: { invoiceNumber, branchCode, sequence: Number(sequence), financialYear: fy } })
  } catch (error) {
    next(error)
  }
}

function verificationActionResponse(res, message, data = {}) {
  res.json({ success: true, message, data })
}

export async function verifyPaymentHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Payment verified and sent to Finance Head', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function financeHeadApproveHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Final approval granted', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function rejectVerificationHandler(req, res, next) {
  try {
    const { rejectionRemarks, comment } = req.body || {}
    const remarks = rejectionRemarks || comment || ''
    if (!remarks || String(remarks).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection remarks are required (minimum 10 characters)',
      })
    }
    verificationActionResponse(res, 'Payment rejected', { id: req.params.id, rejectionRemarks: remarks })
  } catch (error) {
    next(error)
  }
}

export async function escalateVerificationHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Escalated for senior review', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function requestVerificationReuploadHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Re-upload requested', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function requestVerificationClarificationHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Clarification requested', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function markDuplicateValidHandler(req, res, next) {
  try {
    verificationActionResponse(res, 'Duplicate marked as valid', { id: req.params.id })
  } catch (error) {
    next(error)
  }
}

export async function getVerificationNotifications(req, res, next) {
  try {
    res.json({ success: true, data: [] })
  } catch (error) {
    next(error)
  }
}
