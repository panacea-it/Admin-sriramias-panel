import EmiPlan from '../models/EmiPlan.js'
import CommunicationLog from '../models/CommunicationLog.js'
import { SEED_EMI_PLANS } from '../data/financeSeedData.js'
import { generateLoanEmiSchedule } from '../services/emiManagementService.js'

const DEFAULT_SETTINGS = {
  suspensionDays: 15,
  gracePeriodDays: 3,
  warningDaysBeforeSuspend: 5,
  reminderDaysBeforeDue: 3,
  reminderFrequencyDays: 2,
  autoReactivateOnPayment: true,
}

let runtimeSettings = { ...DEFAULT_SETTINGS }

function mapEmi(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: p.planId || String(p._id),
    ...p,
    installments: p.installments || [],
  }
}

async function loadEmiPlans() {
  const docs = await EmiPlan.find().lean()
  if (docs.length) return docs.map((d) => mapEmi({ toObject: () => d }))
  return SEED_EMI_PLANS.map((p) => mapEmi({ toObject: () => p }))
}

async function findPlan(planId) {
  let doc = await EmiPlan.findOne({ $or: [{ planId: planId }, { _id: planId }] })
  if (doc) return doc
  const plans = await loadEmiPlans()
  return plans.find((p) => p.id === planId) || null
}

export async function getEmiSettings(req, res, next) {
  try {
    res.json({ success: true, data: runtimeSettings })
  } catch (error) {
    next(error)
  }
}

export async function updateEmiSettings(req, res, next) {
  try {
    runtimeSettings = { ...runtimeSettings, ...req.body }
    res.json({ success: true, data: runtimeSettings })
  } catch (error) {
    next(error)
  }
}

export async function previewEmiSchedule(req, res, next) {
  try {
    const data = generateLoanEmiSchedule(req.body || {})
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function regenerateEmiSchedule(req, res, next) {
  try {
    const { planId } = req.params
    const schedule = generateLoanEmiSchedule(req.body || {})
    const installments = schedule.installments.map((i) => ({
      ...i,
      status: i.status === 'Scheduled' ? 'Due' : i.status,
    }))

    let doc = await EmiPlan.findOne({ $or: [{ planId }, { _id: planId }] })
    if (doc) {
      doc.installments = installments
      await doc.save()
      return res.json({ success: true, data: mapEmi(doc) })
    }

    const plans = await loadEmiPlans()
    const found = plans.find((p) => p.id === planId)
    if (!found) return res.status(404).json({ success: false, message: 'EMI plan not found' })
    res.json({ success: true, data: { ...found, installments } })
  } catch (error) {
    next(error)
  }
}

export async function sendEmiReminder(req, res, next) {
  try {
    const payload = req.body || {}
    const entry = await CommunicationLog.create({
      logId: `COM-EMI-${Date.now()}`,
      recipient: payload.mobile || payload.email || payload.studentName,
      type: 'EMI Reminder',
      channel: payload.channel || 'WhatsApp',
      status: 'Queued',
      timestamp: new Date(),
      meta: payload,
    })
    res.status(201).json({
      success: true,
      data: {
        id: entry.logId,
        channel: entry.channel,
        status: 'Sent',
        timestamp: entry.timestamp,
        deliveryStatus: 'Queued (provider placeholder)',
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function assignEmiCounselor(req, res, next) {
  try {
    const { planId } = req.params
    const { counselorId, counselorName } = req.body || {}
    let doc = await EmiPlan.findOne({ $or: [{ planId }, { _id: planId }] })
    if (doc) {
      doc.counselorId = counselorId
      doc.counselorName = counselorName
      await doc.save()
      return res.json({ success: true, data: mapEmi(doc) })
    }
    const found = await findPlan(planId)
    if (!found) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: { ...found, counselorId, counselorName } })
  } catch (error) {
    next(error)
  }
}

export async function arrangeEmiCall(req, res, next) {
  try {
    const { planId } = req.params
    const found = await findPlan(planId)
    if (!found) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: found })
  } catch (error) {
    next(error)
  }
}

export async function applyEmiSuspension(req, res, next) {
  try {
    const { planId } = req.params
    const { status, reason } = req.body || {}
    let doc = await EmiPlan.findOne({ $or: [{ planId }, { _id: planId }] })
    if (doc) {
      doc.suspensionStatus = status || 'Suspended'
      doc.suspensionReason = reason
      await doc.save()
      return res.json({ success: true, data: mapEmi(doc) })
    }
    const found = await findPlan(planId)
    if (!found) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: { ...found, suspensionStatus: status } })
  } catch (error) {
    next(error)
  }
}

export async function submitEmiSettlement(req, res, next) {
  try {
    const { planId } = req.params
    const found = await findPlan(planId)
    if (!found) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: found })
  } catch (error) {
    next(error)
  }
}
