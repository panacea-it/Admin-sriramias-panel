/** Mock data for User Journey & Lead Tracking — integration-ready with backend */

export const LEAD_STATUSES = [
  'New Lead',
  'Assigned',
  'Contacted',
  'Follow-up',
  'Payment Page',
  'Payment Success',
  'Payment Failed',
  'Converted',
  'Not Interested',
]

export const LEAD_SOURCES = [
  'Organic',
  'Google Ads',
  'Meta Ads',
  'YouTube Ads',
  'Instagram',
  'Facebook',
  'LinkedIn',
  'Referral',
  'Direct Traffic',
  'Events',
  'Seminars',
  'Walk-ins',
]

export const COUNSELORS = [
  { id: 'c1', name: 'Priya Sharma', team: 'North', center: 'Delhi' },
  { id: 'c2', name: 'Rahul Verma', team: 'North', center: 'Delhi' },
  { id: 'c3', name: 'Anita Reddy', team: 'South', center: 'Hyderabad' },
  { id: 'c4', name: 'Vikram Patel', team: 'West', center: 'Pune' },
]

const courses = ['UPSC Foundation', 'IAS Prelims', 'Mains Test Series', 'Optional Sociology', 'Current Affairs Pro']

function lead(id, overrides = {}) {
  const counselor = COUNSELORS[id % COUNSELORS.length]
  return {
    id: `LD-${1000 + id}`,
    studentName: overrides.studentName || `Student ${id}`,
    mobile: overrides.mobile || `98${String(10000000 + id).slice(-8)}`,
    email: overrides.email || `student${id}@email.com`,
    interestedCourse: overrides.interestedCourse || courses[id % courses.length],
    source: overrides.source || LEAD_SOURCES[id % LEAD_SOURCES.length],
    counselorId: overrides.counselorId ?? counselor.id,
    counselorName: overrides.counselorName ?? counselor.name,
    team: counselor.team,
    center: counselor.center,
    status: overrides.status || LEAD_STATUSES[id % LEAD_STATUSES.length],
    paymentStatus: overrides.paymentStatus || (id % 3 === 0 ? 'Paid' : id % 3 === 1 ? 'Failed' : 'Pending'),
    lastActivity: overrides.lastActivity || '2 hours ago',
    createdAt: overrides.createdAt || '2026-05-18',
    locked: overrides.locked ?? true,
    assignedTo: counselor.id,
    utmCampaign: overrides.utmCampaign || `camp_${id % 4}`,
    priority: overrides.priority || (id % 5 === 0 ? 'High' : 'Normal'),
    ...overrides,
  }
}

export const MOCK_LEADS = Array.from({ length: 48 }, (_, i) => lead(i + 1))

export const MOCK_DASHBOARD = {
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
    { label: 'Referral', value: 14, color: '#8b5cf6' },
    { label: 'Direct', value: 12, color: '#246392' },
  ],
  recentActivity: [
    { id: 1, type: 'lead', message: 'New lead from Google Ads — UPSC Foundation', time: '2 min ago' },
    { id: 2, type: 'payment', message: 'Payment failed — Student 12', time: '8 min ago' },
    { id: 3, type: 'conversion', message: 'Lead converted — Rahul Verma', time: '15 min ago' },
    { id: 4, type: 'followup', message: 'Follow-up scheduled — Priya Sharma', time: '22 min ago' },
  ],
  monthlyTrend: [
    { month: 'Jan', leads: 820, conversions: 72 },
    { month: 'Feb', leads: 910, conversions: 88 },
    { month: 'Mar', leads: 980, conversions: 95 },
    { month: 'Apr', leads: 1100, conversions: 108 },
    { month: 'May', leads: 1248, conversions: 127 },
  ],
}

export const MOCK_JOURNEY_EVENTS = [
  { id: 1, type: 'page_visit', label: 'Visited UPSC Foundation course page', time: '10:02 AM', duration: '4m 32s', badge: 'page' },
  { id: 2, type: 'click', label: 'Clicked Download Brochure', time: '10:06 AM', badge: 'click' },
  { id: 3, type: 'scroll', label: 'Scroll depth 78%', time: '10:07 AM', badge: 'behavior' },
  { id: 4, type: 'form', label: 'Popup lead form submitted', time: '10:12 AM', badge: 'lead' },
  { id: 5, type: 'payment', label: 'Reached payment page', time: '10:18 AM', badge: 'payment' },
  { id: 6, type: 'payment_failed', label: 'Payment failed — UPI timeout', time: '10:20 AM', badge: 'failed' },
  { id: 7, type: 'followup', label: 'Counselor called — Follow-up scheduled', time: '11:00 AM', badge: 'crm' },
]

export const MOCK_FUNNEL_ANALYTICS = {
  stages: [
    { name: 'Visitors', count: 2000, conversionPct: 100, dropOffPct: 0 },
    { name: 'Course View', count: 1000, conversionPct: 50, dropOffPct: 50 },
    { name: 'Payment Page', count: 250, conversionPct: 25, dropOffPct: 75 },
    { name: 'Payment Success', count: 100, conversionPct: 40, dropOffPct: 60 },
  ],
  sourceWise: [
    { source: 'Google Ads', visitors: 800, converted: 42 },
    { source: 'Meta Ads', visitors: 600, converted: 28 },
    { source: 'Organic', visitors: 400, converted: 22 },
  ],
  timeSeries: [
    { date: 'Mon', visitors: 280, conversions: 12 },
    { date: 'Tue', visitors: 310, conversions: 15 },
    { date: 'Wed', visitors: 295, conversions: 14 },
    { date: 'Thu', visitors: 340, conversions: 18 },
    { date: 'Fri', visitors: 380, conversions: 22 },
    { date: 'Sat', visitors: 220, conversions: 10 },
    { date: 'Sun', visitors: 175, conversions: 9 },
  ],
}

export const MOCK_SOURCE_ANALYTICS = LEAD_SOURCES.map((source, i) => ({
  source,
  leads: 120 - i * 8,
  conversions: 18 - i,
  conversionRate: `${(12 + i * 0.5).toFixed(1)}%`,
  spend: i < 3 ? `₹${(50 - i * 10)}K` : '—',
}))

export const MOCK_COUNSELOR_PERFORMANCE = COUNSELORS.map((c, i) => ({
  ...c,
  assignedLeads: 45 + i * 12,
  contacted: 38 + i * 10,
  converted: 8 + i * 2,
  conversionRate: `${(14 + i * 2).toFixed(1)}%`,
  avgResponseTime: `${20 + i * 5} min`,
  pendingFollowUps: 5 + i,
}))

export const MOCK_FOLLOW_UPS = Array.from({ length: 20 }, (_, i) => ({
  id: `FU-${i + 1}`,
  leadId: `LD-${1001 + (i % 10)}`,
  studentName: `Student ${i + 1}`,
  counselorName: COUNSELORS[i % COUNSELORS.length].name,
  scheduledAt: `2026-05-20 ${10 + (i % 8)}:00`,
  status: i % 3 === 0 ? 'Overdue' : i % 3 === 1 ? 'Today' : 'Upcoming',
  priority: i % 4 === 0 ? 'High' : 'Normal',
  notes: i % 2 === 0 ? 'Interested in foundation batch' : '',
}))

export const MOCK_PAYMENT_FAILURES = Array.from({ length: 15 }, (_, i) => ({
  id: `PF-${i + 1}`,
  leadId: `LD-${1010 + i}`,
  studentName: `Student ${i + 10}`,
  amount: `₹${(15000 + i * 2000).toLocaleString('en-IN')}`,
  method: i % 2 === 0 ? 'UPI' : 'Card',
  reason: ['Timeout', 'Insufficient funds', 'Bank declined', 'Network error'][i % 4],
  retryCount: i % 3,
  counselorName: COUNSELORS[i % COUNSELORS.length].name,
  lastAttempt: '2026-05-19',
}))

export const MOCK_TRACKING_CONFIG = {
  pageVisitTracking: true,
  clickTracking: true,
  scrollDepthTracking: true,
  paymentTracking: true,
  popupEnabled: true,
  popupDelaySeconds: 10,
  autoLeadRules: {
    inquiryForm: true,
    brochureDownload: true,
    signupForm: true,
    paymentPage: true,
    paymentFailed: true,
    popupForm: true,
    testAttempt: true,
  },
  utmTracking: true,
  referrerTracking: true,
}

export const MOCK_REPORT_TYPES = [
  { id: 'lead', name: 'Lead Reports', description: 'Lead volume, status, assignment' },
  { id: 'conversion', name: 'Conversion Reports', description: 'Conversion rates and outcomes' },
  { id: 'source', name: 'Source Reports', description: 'UTM and channel performance' },
  { id: 'counselor', name: 'Counselor Reports', description: 'Individual and team metrics' },
  { id: 'payment', name: 'Payment Reports', description: 'Payment success and failures' },
  { id: 'funnel', name: 'Funnel Reports', description: 'Stage-wise drop-off analysis' },
  { id: 'campaign', name: 'Campaign Reports', description: 'Campaign ROI and attribution' },
]

export const TRACKING_EVENT_TYPES = {
  PAGE_VISIT: 'page_visit',
  CLICK: 'click',
  SCROLL: 'scroll_depth',
  PAYMENT_PAGE: 'payment_page',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  LEAD_CAPTURE: 'lead_capture',
}
