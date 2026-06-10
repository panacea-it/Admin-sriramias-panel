/** 1S Coin — 1 coin = ₹1 */
export const REWARD_CURRENCY = '1S Coin'
export const COIN_INR_RATIO = 1

export const WALLET_RULES = {
  transferAllowed: false,
  cashWithdrawalAllowed: false,
  partialPaymentAllowed: true,
}

export const REWARD_EVENT_TYPES = [
  { value: 'lecture_completion', label: 'Lecture Completion' },
  { value: 'daily_login', label: 'Daily Login' },
  { value: 'assignment_submission', label: 'Assignment Submission' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'test_completion', label: 'Test Completion' },
  { value: 'referral_registration', label: 'Referral Registration' },
  { value: 'referral_purchase', label: 'Referral Purchase' },
]

export const TRANSACTION_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  EXPIRED: 'EXPIRED',
  REVERSAL: 'REVERSAL',
  BONUS: 'BONUS',
  PENALTY: 'PENALTY',
}

export const RULE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const REDEMPTION_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
}

export const FRAUD_STATUS = {
  OPEN: 'Open',
  APPROVED: 'Approved',
  HOLD: 'Hold',
  REVERSED: 'Reversed',
}

export const LEADERBOARD_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'course', label: 'Course Wise' },
  { value: 'referral', label: 'Referral' },
]

export const NOTIFICATION_TYPES = {
  COINS_EARNED: 'coins_earned',
  COINS_REDEEMED: 'coins_redeemed',
  BADGE_UNLOCKED: 'badge_unlocked',
  COINS_EXPIRING: 'coins_expiring',
  REFERRAL_REWARD: 'referral_reward',
}

/** Default reward engine catalog (frontend reference / seed rules) */
export const PAID_STUDENT_REWARDS = {
  lecture: { watchPercent: 90, coins: 5, streak5Days: 20 },
  subjectCompletion: 50,
  test: { attempt: 10, above80: 25, top10: 100, fullSeries: 200 },
  dailyLogin: { daily: 2, streak7: 20, streak30: 100 },
  assignment: { submitted: 5, beforeDeadline: 5, allAssignments: 50 },
  attendance: { daily: 3, monthly90: 100 },
  referral: { registration: 25, firstPurchase: 250 },
  rank: { rank1: 1000, rank2to10: 500, rank11to50: 100 },
}

export const FREE_STUDENT_REWARDS = {
  blog: { read: 1, fiveBlogs: 10, sevenDayReading: 20 },
  mcq: { attempt: 2, above70: 5, topRank: 25, dailyQuiz: 3 },
}
