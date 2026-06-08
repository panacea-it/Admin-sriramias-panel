/** In-memory rewards seed — replace with Mongo models when ready */

const students = [
  { id: 'stu-1', name: 'Rahul Kumar', studentId: 'SR2024001', course: 'UPSC Foundation', center: 'Delhi', mobile: '9876543210' },
  { id: 'stu-2', name: 'Priya Sharma', studentId: 'SR2024002', course: 'SSC CGL', center: 'Mumbai', mobile: '9876543211' },
  { id: 'stu-3', name: 'Amit Patel', studentId: 'SR2024003', course: 'Banking PO', center: 'Ahmedabad', mobile: '9876543212' },
  { id: 'stu-4', name: 'Sneha Reddy', studentId: 'SR2024004', course: 'UPSC Foundation', center: 'Hyderabad', mobile: '9876543213' },
  { id: 'stu-5', name: 'Vikram Singh', studentId: 'SR2024005', course: 'Railways NTPC', center: 'Delhi', mobile: '9876543214' },
]

export let MOCK_REWARD_RULES = [
  { id: 'rule-1', name: 'Daily Login Bonus', eventType: 'daily_login', rewardValue: 2, dailyLimit: 1, monthlyLimit: 31, expiryDays: 90, status: 'Active' },
  { id: 'rule-2', name: 'Lecture 90% Watch', eventType: 'lecture_completion', rewardValue: 5, dailyLimit: 10, monthlyLimit: 200, expiryDays: 180, status: 'Active' },
  { id: 'rule-3', name: 'Test Attempt', eventType: 'test_completion', rewardValue: 10, dailyLimit: 5, monthlyLimit: 50, expiryDays: 365, status: 'Active' },
  { id: 'rule-4', name: 'Referral Signup', eventType: 'referral_registration', rewardValue: 25, dailyLimit: 20, monthlyLimit: 100, expiryDays: 365, status: 'Inactive' },
]

export const MOCK_WALLETS = students.map((s, i) => ({
  id: s.id,
  studentName: s.name,
  studentId: s.studentId,
  course: s.course,
  center: s.center,
  mobile: s.mobile,
  balance: 120 + i * 85,
  lifetimeEarned: 500 + i * 200,
  lifetimeRedeemed: 80 + i * 40,
  expiredCoins: 10 + i * 5,
  lockedBalance: i % 2 === 0 ? 20 : 0,
}))

export const MOCK_TRANSACTIONS = [
  { id: 'tx-1', walletId: 'stu-1', date: '2026-05-28T10:00:00Z', type: 'Credit', amount: 5, source: 'Lecture Completion', status: 'Completed' },
  { id: 'tx-2', walletId: 'stu-1', date: '2026-05-27T09:00:00Z', type: 'Debit', amount: 50, source: 'Store Purchase', status: 'Completed' },
  { id: 'tx-3', walletId: 'stu-2', date: '2026-05-29T11:00:00Z', type: 'Bonus', amount: 20, source: 'Manual Credit', status: 'Completed' },
]

export const MOCK_REDEMPTIONS = [
  { id: 'red-1', studentName: 'Rahul Kumar', coinsUsed: 50, skuName: '10% Course Discount', orderId: 'ORD-8821', redemptionDate: '2026-05-26T14:00:00Z', status: 'Completed', type: 'coupon' },
  { id: 'red-2', studentName: 'Priya Sharma', coinsUsed: 120, skuName: 'Premium Notes Pack', orderId: 'ORD-8822', redemptionDate: '2026-05-25T10:00:00Z', status: 'Pending', type: 'content' },
]

export let MOCK_BADGES = [
  { id: 'badge-1', name: '7-Day Streak', criteria: 'Login 7 consecutive days', rewardCoins: 20, status: 'Active', description: 'Consistent learner', iconUrl: null },
  { id: 'badge-2', name: 'Top Performer', criteria: 'Rank in top 10 weekly', rewardCoins: 100, status: 'Active', description: 'Excellence in tests', iconUrl: null },
  { id: 'badge-3', name: 'Referral Champion', criteria: '5 successful referrals', rewardCoins: 250, status: 'Inactive', description: 'Community builder', iconUrl: null },
]

export const MOCK_FRAUD_CASES = [
  { id: 'fraud-1', studentName: 'Vikram Singh', activityType: 'Duplicate login rewards', riskScore: 82, status: 'Open' },
  { id: 'fraud-2', studentName: 'Amit Patel', activityType: 'Rapid referral signups', riskScore: 65, status: 'Hold' },
]

export const MOCK_FRAUD_TIMELINE = {
  'fraud-1': [
    { at: '2026-05-29T08:00:00Z', title: 'Flagged', detail: 'Multiple IPs same day' },
    { at: '2026-05-29T09:30:00Z', title: 'Risk score updated', detail: 'Score 82' },
  ],
}

export const MOCK_LEADERBOARD = {
  weekly: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 200 - i * 25, studentId: s.id })),
  monthly: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 800 - i * 80, studentId: s.id })),
  course: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 450 - i * 40, studentId: s.id })),
  referral: students.slice(0, 3).map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 300 - i * 50, studentId: s.id })),
}

export let MOCK_SETTINGS = {
  coinExpiryDays: 365,
  maxRedemptionPercent: 50,
  minRedemptionCoins: 10,
  referralDailyLimit: 5,
  fraudRiskThreshold: 70,
  otpThresholdCoins: 500,
  notifyCoinsEarned: true,
  notifyCoinsRedeemed: true,
  notifyBadgeUnlocked: true,
  notifyCoinsExpiring: true,
  notifyReferralReward: true,
  redemption: {
    maxWalletUsagePercent: 50,
    minRedemptionCoins: 10,
    otpVerificationThreshold: 500,
    restrictedCategories: ['cash', 'transfer'],
  },
}

export const MOCK_EXPORT_HISTORY = [
  { id: 'exp-1', report: 'Reward Distribution', format: 'CSV', at: '2026-05-28T12:00:00Z', status: 'Completed' },
  { id: 'exp-2', report: 'Wallet Balances', format: 'Excel', at: '2026-05-27T09:00:00Z', status: 'Completed' },
]

export function buildDashboard(query = {}) {
  const period = query.period || 'weekly'
  return {
    stats: {
      totalDistributed: 125400,
      totalRedeemed: 48200,
      activeUsers: 1842,
      coinsExpiring: 3200,
      fraudAlerts: 7,
      referralRewards: 15600,
    },
    distributionTrend: [
      { date: 'Jan', coins: 8200 },
      { date: 'Feb', coins: 9100 },
      { date: 'Mar', coins: 10400 },
      { date: 'Apr', coins: 11200 },
      { date: 'May', coins: 12800 },
      { date: 'Jun', coins: 9800 },
    ],
    redemptionTrend: [
      { date: 'Jan', coins: 2100 },
      { date: 'Feb', coins: 2800 },
      { date: 'Mar', coins: 3200 },
      { date: 'Apr', coins: 4100 },
      { date: 'May', coins: 3900 },
      { date: 'Jun', coins: 3600 },
    ],
    leaderboard: MOCK_LEADERBOARD[period] || MOCK_LEADERBOARD.weekly,
  }
}

export function filterList(items, { search = '', status, center, course } = {}) {
  let result = [...items]
  const q = String(search || '').trim().toLowerCase()
  if (q) {
    result = result.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q)),
    )
  }
  if (status && status !== 'all') {
    result = result.filter((row) => String(row.status ?? '').toLowerCase() === String(status).toLowerCase())
  }
  if (center && center !== 'all') {
    result = result.filter((row) => String(row.center ?? '').toLowerCase() === String(center).toLowerCase())
  }
  if (course && course !== 'all') {
    result = result.filter((row) => String(row.course ?? '').toLowerCase() === String(course).toLowerCase())
  }
  return result
}
