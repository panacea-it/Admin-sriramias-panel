import axiosInstance from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import {
  delay,
  filterMockList,
  mockBadges,
  mockDashboard,
  mockExportHistory,
  mockFraudCases,
  mockFraudTimeline,
  mockLeaderboard,
  mockRedemptionSettings,
  mockRedemptions,
  mockRedeemOptions,
  mockReferrals,
  mockRewardRules,
  mockSettings,
  mockStudentBadges,
  mockStudentOverview,
  mockTransactions,
  mockWallets,
} from '../data/rewardsMockData'
import { mapApiRuleToRow, mapApiTransaction, mapApiWalletToRow } from '../utils/rewardApiHelpers'

const API = '/api/rewards'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_REWARDS_USE_MOCK !== 'false'

let rulesStore = [...mockRewardRules]
let badgesStore = [...mockBadges]
let settingsStore = { ...mockSettings, redemption: { ...mockRedemptionSettings } }

async function tryApi(apiCall, mockFn) {
  if (USE_MOCK) {
    await delay()
    return mockFn()
  }
  try {
    const result = await apiCall()
    const body =
      result?.data !== undefined && typeof result?.status === 'number' ? result.data : result
    return body?.data ?? body
  } catch {
    await delay()
    return mockFn()
  }
}

export async function getRewardDashboard(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/dashboard`, { params })
      return res.data
    },
    () => ({ ...mockDashboard, leaderboard: mockLeaderboard[params.period || 'weekly'] }),
  )
}

export async function getRewardRules(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/rules`, { params })
      return res.data
    },
    () => filterMockList(rulesStore.map(mapApiRuleToRow), { search: params.search, filters: { status: params.status } }),
  )
}

export async function createRewardRule(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.post(`${API}/rules`, payload)
      return res.data
    },
    () => {
      const row = { id: `rule-${Date.now()}`, ...mapApiRuleToRow(payload) }
      rulesStore = [row, ...rulesStore]
      return row
    },
  )
}

export async function updateRewardRule(id, payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.put(`${API}/rules/${id}`, payload)
      return res.data
    },
    () => {
      rulesStore = rulesStore.map((r) => (r.id === id ? { ...r, ...mapApiRuleToRow({ ...r, ...payload }) } : r))
      return rulesStore.find((r) => r.id === id)
    },
  )
}

export async function deleteRewardRule(id) {
  return tryApi(
    async () => {
      await axiosInstance.delete(`${API}/rules/${id}`)
    },
    () => {
      rulesStore = rulesStore.filter((r) => r.id !== id)
    },
  )
}

export async function getStudentWallets(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/wallets`, { params })
      return res.data
    },
    () =>
      filterMockList(mockWallets.map(mapApiWalletToRow), {
        search: params.search,
        filters: { center: params.center, course: params.course },
      }),
  )
}

export async function getWalletTransactions(walletId) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/wallets/${walletId}/transactions`)
      return res.data
    },
    () => mockTransactions.filter((t) => t.walletId === walletId).map(mapApiTransaction),
  )
}

export async function adjustWallet(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.post(`${API}/wallets/adjust`, payload)
      return res.data
    },
    () => ({ success: true, ...payload }),
  )
}

export async function getRedemptions(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/redemptions`, { params })
      return res.data
    },
    () => filterMockList(mockRedemptions, { search: params.search }),
  )
}

export async function getRedemptionSettings() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/redemptions/settings`)
      return res.data
    },
    () => settingsStore.redemption,
  )
}

export async function updateRedemptionSettings(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.put(`${API}/redemptions/settings`, payload)
      return res.data
    },
    () => {
      settingsStore = { ...settingsStore, redemption: { ...settingsStore.redemption, ...payload } }
      return settingsStore.redemption
    },
  )
}

export async function getLeaderboard(period = 'weekly') {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/leaderboard`, { params: { period } })
      return res.data
    },
    () => mockLeaderboard[period] || mockLeaderboard.weekly,
  )
}

export async function getBadges(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/badges`, { params })
      return res.data
    },
    () => filterMockList(badgesStore, { search: params.search }),
  )
}

export async function saveBadge(payload, id) {
  return tryApi(
    async () => {
      const res = id
        ? await axiosInstance.put(`${API}/badges/${id}`, payload)
        : await axiosInstance.post(`${API}/badges`, payload)
      return res.data
    },
    () => {
      if (id) {
        badgesStore = badgesStore.map((b) => (b.id === id ? { ...b, ...payload } : b))
        return badgesStore.find((b) => b.id === id)
      }
      const row = { id: `badge-${Date.now()}`, status: 'Active', ...payload }
      badgesStore = [row, ...badgesStore]
      return row
    },
  )
}

export async function getFraudCases(params = {}) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/fraud`, { params })
      return res.data
    },
    () => filterMockList(mockFraudCases, { search: params.search, filters: { status: params.status } }),
  )
}

export async function getFraudTimeline(id) {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/fraud/${id}/timeline`)
      return res.data
    },
    () => mockFraudTimeline[id] || [],
  )
}

export async function updateFraudStatus(id, status) {
  return tryApi(
    async () => {
      const res = await axiosInstance.patch(`${API}/fraud/${id}`, { status })
      return res.data
    },
    () => {
      mockFraudCases.forEach((f) => {
        if (f.id === id) f.status = status
      })
      return { id, status }
    },
  )
}

export async function getRewardSettings() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/settings`)
      return res.data
    },
    () => settingsStore,
  )
}

export async function updateRewardSettings(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.put(`${API}/settings`, payload)
      return res.data
    },
    () => {
      settingsStore = { ...settingsStore, ...payload }
      return settingsStore
    },
  )
}

export async function getExportHistory() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/reports/exports`)
      return res.data
    },
    () => mockExportHistory,
  )
}

export async function exportRewardReport(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.post(`${API}/reports/export`, payload)
      return res.data
    },
    () => ({ jobId: `job-${Date.now()}`, status: 'queued' }),
  )
}

export async function getStudentRewardsOverview() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/student/overview`)
      return res.data
    },
    () => mockStudentOverview,
  )
}

export async function getStudentWalletData() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/student/wallet`)
      return res.data
    },
    () => ({
      ...mockStudentOverview,
      transactions: mockTransactions.filter((t) => t.walletId === 'stu-1').map(mapApiTransaction),
    }),
  )
}

export async function getRedeemOptions() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/student/redeem-options`)
      return res.data
    },
    () => mockRedeemOptions,
  )
}

export async function redeemCoins(payload) {
  return tryApi(
    async () => {
      const res = await axiosInstance.post(`${API}/student/redeem`, payload)
      return res.data
    },
    () => ({ success: true, orderId: `ORD-${Date.now()}`, ...payload }),
  )
}

export async function getStudentBadges() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/student/badges`)
      return res.data
    },
    () => mockStudentBadges,
  )
}

export async function getStudentReferrals() {
  return tryApi(
    async () => {
      const res = await axiosInstance.get(`${API}/student/referrals`)
      return res.data
    },
    () => mockReferrals,
  )
}
