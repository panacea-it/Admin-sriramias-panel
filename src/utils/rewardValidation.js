export function validateRewardRuleForm(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Rule name is required'
  if (!form.eventType) errors.eventType = 'Event type is required'
  const reward = Number(form.rewardValue)
  if (!Number.isFinite(reward) || reward < 0) errors.rewardValue = 'Enter a valid reward value'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateWalletAdjustForm(form) {
  const errors = {}
  if (!form.studentId) errors.studentId = 'Select a student'
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter a positive coin amount'
  if (!form.reason?.trim()) errors.reason = 'Reason is required'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateBadgeForm(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Badge name is required'
  if (!form.criteria?.trim()) errors.criteria = 'Criteria is required'
  const coins = Number(form.rewardCoins)
  if (!Number.isFinite(coins) || coins < 0) errors.rewardCoins = 'Enter valid reward coins'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateRedemptionSettingsForm(form) {
  const errors = {}
  const maxPct = Number(form.maxWalletUsagePercent)
  if (!Number.isFinite(maxPct) || maxPct < 0 || maxPct > 100) {
    errors.maxWalletUsagePercent = 'Enter a value between 0 and 100'
  }
  const minCoins = Number(form.minRedemptionCoins)
  if (!Number.isFinite(minCoins) || minCoins < 0) {
    errors.minRedemptionCoins = 'Enter a valid minimum'
  }
  const otp = Number(form.otpVerificationThreshold)
  if (!Number.isFinite(otp) || otp < 0) {
    errors.otpVerificationThreshold = 'Enter a valid threshold'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
