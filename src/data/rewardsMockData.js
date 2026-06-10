import {
  FRAUD_STATUS,
  REDEMPTION_STATUS,
  RULE_STATUS,
  TRANSACTION_TYPES,
} from '../constants/rewards'

const students = [
  { id: 'stu-1', name: 'Rahul Kumar', studentId: 'SR2024001', course: 'UPSC Foundation', center: 'Delhi', mobile: '9876543210' },
  { id: 'stu-2', name: 'Priya Sharma', studentId: 'SR2024002', course: 'SSC CGL', center: 'Mumbai', mobile: '9876543211' },
  { id: 'stu-3', name: 'Amit Patel', studentId: 'SR2024003', course: 'Banking PO', center: 'Ahmedabad', mobile: '9876543212' },
  { id: 'stu-4', name: 'Sneha Reddy', studentId: 'SR2024004', course: 'UPSC Foundation', center: 'Hyderabad', mobile: '9876543213' },
  { id: 'stu-5', name: 'Vikram Singh', studentId: 'SR2024005', course: 'Railways NTPC', center: 'Delhi', mobile: '9876543214' },
]

export const mockRewardRules = [
  { id: 'rule-1', name: 'Daily Login Bonus', eventType: 'daily_login', rewardValue: 2, dailyLimit: 1, monthlyLimit: 31, expiryDays: 90, status: RULE_STATUS.ACTIVE },
  { id: 'rule-2', name: 'Lecture 90% Watch', eventType: 'lecture_completion', rewardValue: 5, dailyLimit: 10, monthlyLimit: 200, expiryDays: 180, status: RULE_STATUS.ACTIVE },
  { id: 'rule-3', name: 'Test Attempt', eventType: 'test_completion', rewardValue: 10, dailyLimit: 5, monthlyLimit: 50, expiryDays: 365, status: RULE_STATUS.ACTIVE },
  { id: 'rule-4', name: 'Referral Signup', eventType: 'referral_registration', rewardValue: 25, dailyLimit: 20, monthlyLimit: 100, expiryDays: 365, status: RULE_STATUS.INACTIVE },
]

export const mockWallets = students.map((s, i) => ({
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

export const mockTransactions = [
  { id: 'tx-1', walletId: 'stu-1', date: '2026-05-28T10:00:00Z', type: TRANSACTION_TYPES.CREDIT, amount: 5, source: 'Lecture Completion', status: 'Completed' },
  { id: 'tx-2', walletId: 'stu-1', date: '2026-05-27T09:00:00Z', type: TRANSACTION_TYPES.DEBIT, amount: 50, source: 'Store Purchase', status: 'Completed' },
  { id: 'tx-3', walletId: 'stu-1', date: '2026-05-20T08:00:00Z', type: TRANSACTION_TYPES.EXPIRED, amount: 10, source: 'Expiry Policy', status: 'Completed' },
  { id: 'tx-4', walletId: 'stu-2', date: '2026-05-29T11:00:00Z', type: TRANSACTION_TYPES.BONUS, amount: 20, source: 'Manual Credit', status: 'Completed' },
]

export const mockRedemptions = [
  { id: 'red-1', studentName: 'Rahul Kumar', coinsUsed: 50, skuName: '10% Course Discount', orderId: 'ORD-8821', redemptionDate: '2026-05-26T14:00:00Z', status: REDEMPTION_STATUS.COMPLETED, type: 'coupon' },
  { id: 'red-2', studentName: 'Priya Sharma', coinsUsed: 120, skuName: 'Premium Notes Pack', orderId: 'ORD-8822', redemptionDate: '2026-05-25T10:00:00Z', status: REDEMPTION_STATUS.PENDING, type: 'content' },
]

export const mockBadges = [
  { id: 'badge-1', name: '7-Day Streak', criteria: 'Login 7 consecutive days', rewardCoins: 20, status: RULE_STATUS.ACTIVE, description: 'Consistent learner', iconUrl: null },
  { id: 'badge-2', name: 'Top Performer', criteria: 'Rank in top 10 weekly', rewardCoins: 100, status: RULE_STATUS.ACTIVE, description: 'Excellence in tests', iconUrl: null },
  { id: 'badge-3', name: 'Referral Champion', criteria: '5 successful referrals', rewardCoins: 250, status: RULE_STATUS.INACTIVE, description: 'Community builder', iconUrl: null },
]

export const mockFraudCases = [
  { id: 'fraud-1', studentName: 'Vikram Singh', activityType: 'Duplicate login rewards', riskScore: 82, status: FRAUD_STATUS.OPEN },
  { id: 'fraud-2', studentName: 'Amit Patel', activityType: 'Rapid referral signups', riskScore: 65, status: FRAUD_STATUS.HOLD },
]

export const mockFraudTimeline = {
  'fraud-1': [
    { at: '2026-05-29T08:00:00Z', title: 'Flagged', detail: 'Multiple IPs same day' },
    { at: '2026-05-29T09:30:00Z', title: 'Risk score updated', detail: 'Score 82' },
  ],
}

export const mockLeaderboard = {
  weekly: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 200 - i * 25, studentId: s.id })),
  monthly: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 800 - i * 80, studentId: s.id })),
  course: students.map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 450 - i * 40, studentId: s.id })),
  referral: students.slice(0, 3).map((s, i) => ({ rank: i + 1, studentName: s.name, coinsEarned: 300 - i * 50, studentId: s.id })),
}

export const mockDashboard = {
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
  leaderboard: mockLeaderboard.weekly,
}

export const mockSettings = {
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
}

export const mockRedemptionSettings = {
  maxWalletUsagePercent: 50,
  minRedemptionCoins: 10,
  otpVerificationThreshold: 500,
  restrictedCategories: ['cash', 'transfer'],
}

export const mockStudentOverview = {
  balance: 285,
  lifetimeEarned: 1240,
  redeemedCoins: 420,
  activeBadges: 3,
  currentRank: 4,
  expiringCoins: 45,
  expiringOn: '2026-06-15',
}

export const mockRedeemOptions = [
  { id: 'opt-1', category: 'coupon', title: '10% Course Discount', requiredCoins: 50, description: 'Valid on next course purchase' },
  { id: 'opt-2', category: 'store', title: 'Study Kit Bundle', requiredCoins: 150, description: 'Books + stationery combo' },
  { id: 'opt-3', category: 'content', title: 'Premium Test Series', requiredCoins: 200, description: '30-day access' },
  { id: 'opt-4', category: 'merch', title: 'Branded T-Shirt', requiredCoins: 300, description: 'Limited edition' },
]

export const mockStudentBadges = [
  { id: 'badge-1', name: '7-Day Streak', description: 'Login 7 consecutive days', unlocked: true, unlockDate: '2026-04-10' },
  { id: 'badge-2', name: 'Top Performer', description: 'Rank in top 10 weekly', unlocked: true, unlockDate: '2026-05-01' },
  { id: 'badge-3', name: 'Referral Champion', description: '5 successful referrals', unlocked: false, unlockDate: null },
  { id: 'badge-4', name: 'Perfect Attendance', description: '90% monthly attendance', unlocked: false, unlockDate: null },
]

export const mockReferrals = {
  link: 'https://sriramias.com/ref/SR-DEMO-2026',
  stats: { total: 12, registered: 8, purchased: 3, coinsEarned: 775 },
  table: [
    { id: 'ref-1', studentName: 'Ankit Verma', registrationStatus: 'Registered', purchaseStatus: 'Purchased', coinsEarned: 275 },
    { id: 'ref-2', studentName: 'Neha Gupta', registrationStatus: 'Registered', purchaseStatus: 'Pending', coinsEarned: 25 },
  ],
}

export const mockExportHistory = [
  { id: 'exp-1', report: 'Reward Distribution', format: 'CSV', at: '2026-05-28T12:00:00Z', status: 'Completed' },
  { id: 'exp-2', report: 'Wallet Balances', format: 'Excel', at: '2026-05-27T09:00:00Z', status: 'Completed' },
]

export function filterMockList(items, { search = '', filters = {} }) {
  let result = [...items]
  const q = search.trim().toLowerCase()
  if (q) {
    result = result.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q)),
    )
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value === 'all') return
    result = result.filter((row) => String(row[key] ?? '').toLowerCase() === String(value).toLowerCase())
  })
  return result
}

export function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
