import CommunicationLog from '../models/CommunicationLog.js'
import CommunicationTemplate from '../models/CommunicationTemplate.js'
import CommunicationAutomationRule from '../models/CommunicationAutomationRule.js'
import { SEED_COMM_LOGS } from '../data/financeSeedData.js'

function toIso(d) {
  if (!d) return null
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString()
}

function actorName(req) {
  return req.user?.name || req.user?.email || req.body?.adminName || 'Finance Admin'
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
    tracking: c.tracking
      ? {
          ...c.tracking,
          sentAt: toIso(c.tracking.sentAt),
          deliveredAt: toIso(c.tracking.deliveredAt),
          openedAt: toIso(c.tracking.openedAt),
          readAt: toIso(c.tracking.readAt),
          failedAt: toIso(c.tracking.failedAt),
        }
      : null,
    followUpTag: c.followUpTag,
    followUpPriority: c.followUpPriority,
    followUpNotes: c.followUpNotes,
    nextFollowUpDate: toIso(c.nextFollowUpDate),
    counselorId: c.counselorId,
    counselorName: c.counselorName,
    templateId: c.templateId,
    auditTrail: (c.auditTrail || []).map((a) => ({ ...a, at: toIso(a.at) })),
    meta: c.meta,
  }
}

function mapTemplate(doc) {
  const t = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: t.templateId || String(t._id),
    name: t.name,
    type: t.type,
    channel: t.channel,
    status: t.status,
    subject: t.subject,
    body: t.body,
    createdBy: t.createdBy,
    lastModified: toIso(t.updatedAt || t.createdAt),
    auditTrail: (t.auditTrail || []).map((a) => ({ ...a, at: toIso(a.at) })),
  }
}

function mapRule(doc) {
  const r = doc.toObject ? doc.toObject() : { ...doc }
  return {
    id: r.ruleId || String(r._id),
    name: r.name,
    triggerEvent: r.triggerEvent,
    triggerTiming: r.triggerTiming,
    channel: r.channel,
    templateId: r.templateId,
    templateName: r.templateName,
    audience: r.audience,
    escalationLevel: r.escalationLevel,
    active: r.active,
    priority: r.priority,
    reminderFrequency: r.reminderFrequency,
    autoStopCondition: r.autoStopCondition,
    lastExecutedAt: toIso(r.lastExecutedAt),
    lastExecutionStatus: r.lastExecutionStatus,
    executionLogs: (r.executionLogs || []).map((e) => ({ ...e, at: toIso(e.at) })),
    auditTrail: (r.auditTrail || []).map((a) => ({ ...a, at: toIso(a.at) })),
  }
}

async function loadCommLogs(filter = {}) {
  const query = {}
  if (filter.studentId) query.studentId = filter.studentId
  const docs = await CommunicationLog.find(query).sort({ timestamp: -1 }).lean()
  if (docs.length) return docs.map((d) => mapComm({ toObject: () => d }))
  return SEED_COMM_LOGS.map((c) => mapComm({ toObject: () => c }))
}

export async function getCommunicationAnalytics(req, res, next) {
  try {
    const logs = await loadCommLogs()
    const templateDocs = await CommunicationTemplate.find().lean()
    const rules = await CommunicationAutomationRule.find().lean()
    res.json({
      success: true,
      data: {
        logs,
        templates: templateDocs.map((d) => mapTemplate({ toObject: () => d })),
        rules: rules.map((r) => mapRule({ toObject: () => r })),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getCommunicationLogsEnriched(req, res, next) {
  try {
    const { studentId } = req.query
    const data = await loadCommLogs(studentId ? { studentId } : {})
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

export async function tagCommunicationCounselor(req, res, next) {
  try {
    const by = actorName(req)
    const { counselorId, counselorName, followUpPriority, followUpNotes, nextFollowUpDate, followUpTag } = req.body || {}
    const log = await CommunicationLog.findOne({ logId: req.params.id })
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' })

    log.counselorId = counselorId
    log.counselorName = counselorName
    log.followUpPriority = followUpPriority
    log.followUpNotes = followUpNotes
    log.followUpTag = followUpTag || 'Follow-up assigned'
    if (nextFollowUpDate) log.nextFollowUpDate = new Date(nextFollowUpDate)
    log.auditTrail = [...(log.auditTrail || []), { action: 'counselor_tagged', by, at: new Date() }]
    await log.save()
    res.json({ success: true, data: mapComm(log) })
  } catch (error) {
    next(error)
  }
}

export async function bulkCommunicationAction(req, res, next) {
  try {
    const by = actorName(req)
    const { ids = [], action } = req.body || {}
    const results = []

    for (const id of ids) {
      const log = await CommunicationLog.findOne({ logId: id })
      if (!log) continue
      if (action === 'resend') {
        log.status = 'Queued'
        log.deliveryStatus = 'Pending'
        log.tracking = { ...(log.tracking || {}), retryCount: (log.tracking?.retryCount || 0) + 1 }
        log.auditTrail = [...(log.auditTrail || []), { action: 'resent', by, at: new Date() }]
      } else if (action === 'mark_delivered') {
        log.deliveryStatus = 'Delivered'
        log.tracking = { ...(log.tracking || {}), deliveredAt: new Date() }
        log.auditTrail = [...(log.auditTrail || []), { action: 'status_updated', by, at: new Date() }]
      }
      await log.save()
      results.push(mapComm(log))
    }
    res.json({ success: true, count: results.length, data: results })
  } catch (error) {
    next(error)
  }
}

export async function getCommunicationTemplates(req, res, next) {
  try {
    const docs = await CommunicationTemplate.find().sort({ updatedAt: -1 }).lean()
    res.json({ success: true, data: docs.map((d) => mapTemplate({ toObject: () => d })) })
  } catch (error) {
    next(error)
  }
}

export async function upsertCommunicationTemplate(req, res, next) {
  try {
    const by = actorName(req)
    const payload = req.body || {}
    const isEdit = !!req.params.id
    const templateId = req.params.id || `TPL-${Date.now()}`

    const doc = await CommunicationTemplate.findOneAndUpdate(
      { templateId },
      {
        $set: {
          templateId,
          name: payload.name,
          type: payload.type,
          channel: payload.channel,
          status: payload.status || 'Active',
          subject: payload.subject || '',
          body: payload.body || '',
          createdBy: isEdit ? undefined : by,
          lastModifiedBy: by,
        },
        $push: {
          auditTrail: { action: isEdit ? 'updated' : 'created', by, at: new Date() },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    res.json({ success: true, data: mapTemplate(doc) })
  } catch (error) {
    next(error)
  }
}

export async function deleteCommunicationTemplate(req, res, next) {
  try {
    await CommunicationTemplate.deleteOne({ templateId: req.params.id })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function getCommunicationAutomationRules(req, res, next) {
  try {
    const docs = await CommunicationAutomationRule.find().sort({ priority: 1 }).lean()
    res.json({ success: true, data: docs.map((d) => mapRule({ toObject: () => d })) })
  } catch (error) {
    next(error)
  }
}

export async function upsertCommunicationAutomationRule(req, res, next) {
  try {
    const by = actorName(req)
    const payload = req.body || {}
    const isEdit = !!req.params.id
    const ruleId = req.params.id || `RULE-${Date.now()}`

    const doc = await CommunicationAutomationRule.findOneAndUpdate(
      { ruleId },
      {
        $set: {
          ruleId,
          name: payload.name,
          triggerEvent: payload.triggerEvent,
          triggerTiming: payload.triggerTiming,
          channel: payload.channel,
          templateId: payload.templateId,
          templateName: payload.templateName,
          audience: payload.audience,
          escalationLevel: payload.escalationLevel,
          active: payload.active !== false,
          priority: payload.priority ?? 1,
          reminderFrequency: payload.reminderFrequency,
          autoStopCondition: payload.autoStopCondition,
        },
        $push: {
          auditTrail: { action: isEdit ? 'updated' : 'created', by, at: new Date() },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    res.json({ success: true, data: mapRule(doc) })
  } catch (error) {
    next(error)
  }
}

export async function deleteCommunicationAutomationRule(req, res, next) {
  try {
    await CommunicationAutomationRule.deleteOne({ ruleId: req.params.id })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function toggleCommunicationAutomationRule(req, res, next) {
  try {
    const by = actorName(req)
    const doc = await CommunicationAutomationRule.findOne({ ruleId: req.params.id })
    if (!doc) return res.status(404).json({ success: false, message: 'Rule not found' })
    doc.active = !doc.active
    doc.auditTrail = [...(doc.auditTrail || []), { action: doc.active ? 'enabled' : 'disabled', by, at: new Date() }]
    await doc.save()
    res.json({ success: true, data: mapRule(doc) })
  } catch (error) {
    next(error)
  }
}

export async function testSendCommunicationTemplate(req, res, next) {
  try {
    const payload = req.body || {}
    const entry = await CommunicationLog.create({
      logId: `COM-${Date.now()}`,
      recipient: payload.recipient || payload.email || payload.mobile,
      studentName: payload.studentName || 'Test Student',
      type: payload.type || 'Manual Follow-up',
      channel: payload.channel || 'Email',
      status: 'Queued',
      deliveryStatus: 'Pending',
      sentBy: actorName(req),
      timestamp: new Date(),
      templateId: payload.templateId,
      tracking: { sentAt: new Date(), retryCount: 0 },
      auditTrail: [{ action: 'test_send', by: actorName(req), at: new Date() }],
    })
    res.status(201).json({ success: true, data: mapComm(entry) })
  } catch (error) {
    next(error)
  }
}

export { mapComm, loadCommLogs }
