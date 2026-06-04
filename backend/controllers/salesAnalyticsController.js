import Lead from '../models/Lead.js'
import TrackingEvent from '../models/TrackingEvent.js'
import FollowUp from '../models/FollowUp.js'
import TrackingConfig from '../models/TrackingConfig.js'
import { DEFAULT_TRACKING_CONFIG } from '../data/salesAnalyticsSeedData.js'

const MOCK_DASHBOARD = {
  stats: {
    totalLeads: 1248,
    assignedLeads: 892,
    todayFollowUps: 34,
    pendingCallbacks: 18,
    conversions: 127,
    conversionRate: '10.2%',
    paymentFailures: 23,
    liveVisitors: 156,
  },
  funnel: [
    { stage: 'Visitors', count: 2000, pct: 100 },
    { stage: 'Course View', count: 1000, pct: 50 },
    { stage: 'Payment Page', count: 250, pct: 12.5 },
    { stage: 'Payment Success', count: 100, pct: 5 },
  ],
  sourceBreakdown: [
    { label: 'Google Ads', value: 32, color: '#4285F4' },
    { label: 'Meta Ads', value: 24, color: '#1877F2' },
    { label: 'Organic', value: 18, color: '#3dad4a' },
  ],
  recentActivity: [],
}

export async function getDashboard(req, res) {
  const totalLeads = await Lead.countDocuments()
  res.json({
    success: true,
    data: {
      ...MOCK_DASHBOARD,
      stats: { ...MOCK_DASHBOARD.stats, totalLeads: totalLeads || MOCK_DASHBOARD.stats.totalLeads },
    },
  })
}

export async function getLeads(req, res) {
  const filter = {}
  if (req.query.counselorId) filter.counselorId = req.query.counselorId
  if (req.query.status) filter.status = req.query.status
  if (req.query.source) filter.source = req.query.source
  const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  res.json({ success: true, data: { leads, total: leads.length } })
}

export async function getLeadById(req, res) {
  const lead = await Lead.findOne({ leadId: req.params.id }).lean()
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })
  res.json({ success: true, data: lead })
}

export async function createLead(req, res) {
  const leadId = req.body.leadId || `LD-${Date.now()}`
  const lead = await Lead.create({ ...req.body, leadId })
  res.status(201).json({ success: true, data: lead })
}

export async function updateLead(req, res) {
  const lead = await Lead.findOneAndUpdate(
    { leadId: req.params.id },
    { $set: req.body },
    { new: true },
  ).lean()
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })
  res.json({ success: true, data: lead })
}

export async function trackEvent(req, res) {
  const event = await TrackingEvent.create(req.body)
  res.status(201).json({ success: true, data: { eventId: event._id } })
}

export async function getJourney(req, res) {
  const events = await TrackingEvent.find({ leadId: req.params.leadId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  res.json({ success: true, data: { events, leadId: req.params.leadId } })
}

export async function getFunnel(req, res) {
  res.json({
    success: true,
    data: {
      stages: [
        { name: 'Visitors', count: 2000, conversionPct: 100, dropOffPct: 0 },
        { name: 'Course View', count: 1000, conversionPct: 50, dropOffPct: 50 },
        { name: 'Payment Page', count: 250, conversionPct: 25, dropOffPct: 75 },
        { name: 'Payment Success', count: 100, conversionPct: 40, dropOffPct: 60 },
      ],
      sourceWise: [],
      timeSeries: [],
    },
  })
}

export async function getSources(req, res) {
  res.json({ success: true, data: { sources: [] } })
}

export async function getCounselors(req, res) {
  res.json({ success: true, data: { counselors: [] } })
}

export async function getFollowUps(req, res) {
  const followUps = await FollowUp.find().sort({ scheduledAt: 1 }).lean()
  res.json({ success: true, data: { followUps } })
}

export async function createFollowUp(req, res) {
  const fu = await FollowUp.create(req.body)
  res.status(201).json({ success: true, data: fu })
}

export async function getPaymentFailures(req, res) {
  const failures = await TrackingEvent.find({ type: 'payment_failed' }).limit(50).lean()
  res.json({ success: true, data: { failures } })
}

export async function getTrackingConfig(req, res) {
  let config = await TrackingConfig.findOne({ key: 'default' }).lean()
  if (!config) {
    config = await TrackingConfig.create(DEFAULT_TRACKING_CONFIG)
  }
  res.json({ success: true, data: config })
}

export async function updateTrackingConfig(req, res) {
  const config = await TrackingConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: req.body },
    { new: true, upsert: true },
  ).lean()
  res.json({ success: true, data: config })
}

export async function getReportTypes(req, res) {
  res.json({
    success: true,
    data: {
      types: [
        { id: 'lead', name: 'Lead Reports', description: 'Lead volume and status' },
        { id: 'conversion', name: 'Conversion Reports', description: 'Conversion metrics' },
      ],
    },
  })
}

export async function exportReport(req, res) {
  res.json({ success: true, message: `Export queued for ${req.body.type}` })
}
