/** Seed payloads aligned with frontend mock data */

export const SEED_LEADS = [
  {
    leadId: 'LD-1001',
    studentName: 'Aarav Singh',
    mobile: '9812345601',
    email: 'aarav@email.com',
    interestedCourse: 'UPSC Foundation',
    source: 'Google Ads',
    counselorId: 'c1',
    counselorName: 'Priya Sharma',
    team: 'North',
    center: 'Delhi',
    status: 'Follow-up',
    paymentStatus: 'Pending',
    locked: true,
    assignedTo: 'c1',
  },
]

export const DEFAULT_TRACKING_CONFIG = {
  key: 'default',
  pageVisitTracking: true,
  clickTracking: true,
  scrollDepthTracking: true,
  paymentTracking: true,
  popupEnabled: true,
  popupDelaySeconds: 10,
  utmTracking: true,
  referrerTracking: true,
  autoLeadRules: {
    inquiryForm: true,
    brochureDownload: true,
    signupForm: true,
    paymentPage: true,
    paymentFailed: true,
    popupForm: true,
    testAttempt: true,
  },
}
