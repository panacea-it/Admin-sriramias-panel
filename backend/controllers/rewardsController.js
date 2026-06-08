import {
  MOCK_REWARD_RULES,
  MOCK_WALLETS,
  MOCK_TRANSACTIONS,
  MOCK_REDEMPTIONS,
  MOCK_BADGES,
  MOCK_FRAUD_CASES,
  MOCK_FRAUD_TIMELINE,
  MOCK_LEADERBOARD,
  MOCK_SETTINGS,
  MOCK_EXPORT_HISTORY,
  buildDashboard,
  filterList,
} from '../data/rewardsSeedData.js'

function ok(res, data) {
  res.json({ success: true, data })
}

export function getDashboard(req, res) {
  ok(res, buildDashboard(req.query))
}

/** Legacy path used by older admin builds */
export function getDashboardLegacy(req, res) {
  ok(res, buildDashboard(req.query))
}

export function listRules(req, res) {
  ok(res, filterList(MOCK_REWARD_RULES, req.query))
}

export function createRule(req, res) {
  const row = { id: `rule-${Date.now()}`, status: 'Active', ...req.body }
  MOCK_REWARD_RULES.unshift(row)
  ok(res, row)
}

export function updateRule(req, res) {
  const idx = MOCK_REWARD_RULES.findIndex((r) => r.id === req.params.id)
  if (idx < 0) return res.status(404).json({ success: false, message: 'Not found' })
  MOCK_REWARD_RULES[idx] = { ...MOCK_REWARD_RULES[idx], ...req.body }
  ok(res, MOCK_REWARD_RULES[idx])
}

export function deleteRule(req, res) {
  const idx = MOCK_REWARD_RULES.findIndex((r) => r.id === req.params.id)
  if (idx < 0) return res.status(404).json({ success: false, message: 'Not found' })
  MOCK_REWARD_RULES.splice(idx, 1)
  res.status(204).end()
}

export function listWallets(req, res) {
  ok(res, filterList(MOCK_WALLETS, req.query))
}

export function listWalletTransactions(req, res) {
  ok(res, MOCK_TRANSACTIONS.filter((t) => t.walletId === req.params.id))
}

export function adjustWallet(req, res) {
  ok(res, { success: true, ...req.body })
}

export function listRedemptions(req, res) {
  ok(res, filterList(MOCK_REDEMPTIONS, req.query))
}

export function getRedemptionSettings(req, res) {
  ok(res, MOCK_SETTINGS.redemption)
}

export function updateRedemptionSettings(req, res) {
  MOCK_SETTINGS.redemption = { ...MOCK_SETTINGS.redemption, ...req.body }
  ok(res, MOCK_SETTINGS.redemption)
}

export function getLeaderboard(req, res) {
  const period = req.query.period || 'weekly'
  ok(res, MOCK_LEADERBOARD[period] || MOCK_LEADERBOARD.weekly)
}

export function listBadges(req, res) {
  ok(res, filterList(MOCK_BADGES, req.query))
}

export function saveBadge(req, res) {
  const { id } = req.params
  if (id) {
    const idx = MOCK_BADGES.findIndex((b) => b.id === id)
    if (idx < 0) return res.status(404).json({ success: false, message: 'Not found' })
    MOCK_BADGES[idx] = { ...MOCK_BADGES[idx], ...req.body }
    return ok(res, MOCK_BADGES[idx])
  }
  const row = { id: `badge-${Date.now()}`, status: 'Active', ...req.body }
  MOCK_BADGES.unshift(row)
  ok(res, row)
}

export function listFraud(req, res) {
  ok(res, filterList(MOCK_FRAUD_CASES, req.query))
}

export function getFraudTimeline(req, res) {
  ok(res, MOCK_FRAUD_TIMELINE[req.params.id] || [])
}

export function updateFraud(req, res) {
  const row = MOCK_FRAUD_CASES.find((f) => f.id === req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Not found' })
  if (req.body.status) row.status = req.body.status
  ok(res, { id: row.id, status: row.status })
}

export function getSettings(req, res) {
  ok(res, MOCK_SETTINGS)
}

export function updateSettings(req, res) {
  Object.assign(MOCK_SETTINGS, req.body)
  ok(res, MOCK_SETTINGS)
}

export function listExports(req, res) {
  ok(res, MOCK_EXPORT_HISTORY)
}

export function exportReport(req, res) {
  ok(res, { jobId: `job-${Date.now()}`, status: 'queued' })
}

export function getStudentOverview(req, res) {
  ok(res, {
    balance: 285,
    lifetimeEarned: 1240,
    redeemedCoins: 420,
    activeBadges: 3,
    currentRank: 4,
    expiringCoins: 45,
    expiringOn: '2026-06-15',
  })
}

export function getStudentWallet(req, res) {
  ok(res, {
    balance: 285,
    lifetimeEarned: 1240,
    redeemedCoins: 420,
    transactions: MOCK_TRANSACTIONS.filter((t) => t.walletId === 'stu-1'),
  })
}

export function getRedeemOptions(req, res) {
  ok(res, [
    { id: 'opt-1', category: 'coupon', title: '10% Course Discount', requiredCoins: 50, description: 'Valid on next course purchase' },
    { id: 'opt-2', category: 'store', title: 'Study Kit Bundle', requiredCoins: 150, description: 'Books + stationery combo' },
  ])
}

export function redeemCoins(req, res) {
  ok(res, { success: true, orderId: `ORD-${Date.now()}`, ...req.body })
}

export function getStudentBadges(req, res) {
  ok(res, [
    { id: 'badge-1', name: '7-Day Streak', description: 'Login 7 consecutive days', unlocked: true, unlockDate: '2026-04-10' },
    { id: 'badge-2', name: 'Top Performer', description: 'Rank in top 10 weekly', unlocked: true, unlockDate: '2026-05-01' },
  ])
}

export function getStudentReferrals(req, res) {
  ok(res, {
    link: 'https://sriramias.com/ref/SR-DEMO-2026',
    stats: { total: 12, registered: 8, purchased: 3, coinsEarned: 775 },
    table: [
      { id: 'ref-1', studentName: 'Ankit Verma', registrationStatus: 'Registered', purchaseStatus: 'Purchased', coinsEarned: 275 },
    ],
  })
}
