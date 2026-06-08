import { Router } from 'express'
import {
  getDashboard,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listWallets,
  listWalletTransactions,
  adjustWallet,
  listRedemptions,
  getRedemptionSettings,
  updateRedemptionSettings,
  getLeaderboard,
  listBadges,
  saveBadge,
  listFraud,
  getFraudTimeline,
  updateFraud,
  getSettings,
  updateSettings,
  listExports,
  exportReport,
  getStudentOverview,
  getStudentWallet,
  getRedeemOptions,
  redeemCoins,
  getStudentBadges,
  getStudentReferrals,
} from '../controllers/rewardsController.js'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/rules', listRules)
router.post('/rules', createRule)
router.put('/rules/:id', updateRule)
router.delete('/rules/:id', deleteRule)
router.get('/wallets', listWallets)
router.get('/wallets/:id/transactions', listWalletTransactions)
router.post('/wallets/adjust', adjustWallet)
router.get('/redemptions', listRedemptions)
router.get('/redemptions/settings', getRedemptionSettings)
router.put('/redemptions/settings', updateRedemptionSettings)
router.get('/leaderboard', getLeaderboard)
router.get('/badges', listBadges)
router.post('/badges', saveBadge)
router.put('/badges/:id', saveBadge)
router.get('/fraud', listFraud)
router.get('/fraud/:id/timeline', getFraudTimeline)
router.patch('/fraud/:id', updateFraud)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.get('/reports/exports', listExports)
router.post('/reports/export', exportReport)
router.get('/student/overview', getStudentOverview)
router.get('/student/wallet', getStudentWallet)
router.get('/student/redeem-options', getRedeemOptions)
router.post('/student/redeem', redeemCoins)
router.get('/student/badges', getStudentBadges)
router.get('/student/referrals', getStudentReferrals)

export default router
