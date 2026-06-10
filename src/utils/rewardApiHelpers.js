import { REWARD_EVENT_TYPES, RULE_STATUS } from '../constants/rewards'

export function getEventTypeLabel(value) {
  return REWARD_EVENT_TYPES.find((e) => e.value === value)?.label ?? value
}

export function mapApiRuleToRow(rule) {
  if (!rule) return null
  return {
    id: rule.id ?? rule._id,
    name: rule.name ?? rule.ruleName,
    eventType: rule.eventType ?? rule.event_type,
    rewardValue: Number(rule.rewardValue ?? rule.reward_value ?? 0),
    dailyLimit: Number(rule.dailyLimit ?? rule.daily_limit ?? 0),
    monthlyLimit: Number(rule.monthlyLimit ?? rule.monthly_limit ?? 0),
    expiryDays: Number(rule.expiryDays ?? rule.expiry_days ?? 0),
    status: rule.status === 'active' || rule.status === RULE_STATUS.ACTIVE ? RULE_STATUS.ACTIVE : RULE_STATUS.INACTIVE,
  }
}

export function mapApiWalletToRow(wallet) {
  if (!wallet) return null
  return {
    id: wallet.id ?? wallet.studentId ?? wallet._id,
    studentName: wallet.studentName ?? wallet.student_name,
    studentId: wallet.studentId ?? wallet.student_id,
    course: wallet.course ?? wallet.courseName,
    center: wallet.center ?? wallet.centerName,
    mobile: wallet.mobile ?? wallet.phone,
    balance: Number(wallet.balance ?? wallet.availableBalance ?? 0),
    lifetimeEarned: Number(wallet.lifetimeEarned ?? wallet.lifetime_earned ?? 0),
    lifetimeRedeemed: Number(wallet.lifetimeRedeemed ?? wallet.lifetime_redeemed ?? 0),
    expiredCoins: Number(wallet.expiredCoins ?? wallet.expired_coins ?? 0),
    lockedBalance: Number(wallet.lockedBalance ?? wallet.locked_balance ?? 0),
  }
}

export function mapApiTransaction(tx) {
  return {
    id: tx.id ?? tx._id,
    date: tx.date ?? tx.createdAt ?? tx.created_at,
    type: tx.type,
    amount: Number(tx.amount ?? 0),
    source: tx.source ?? tx.description,
    status: tx.status ?? 'Completed',
  }
}

export function formatCoins(amount) {
  const n = Number(amount) || 0
  return `${n.toLocaleString('en-IN')} 1S`
}

export function formatCoinsInr(amount) {
  const n = Number(amount) || 0
  return `₹${n.toLocaleString('en-IN')}`
}
