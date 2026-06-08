/** Payment communication — filtering, analytics & alert generation */

function matchesSearch(row, q) {
  if (!q) return true
  const hay = [
    row.id,
    row.studentName,
    row.studentId,
    row.paymentReference,
    row.type,
    row.channel,
    row.recipient,
    row.sentBy,
    row.counselorName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

export function filterCommunicationLogs(logs, filters = {}) {
  const q = (filters.search || '').trim().toLowerCase()
  return logs.filter((row) => {
    if (filters.channelFilter && filters.channelFilter !== 'all' && row.channel !== filters.channelFilter) return false
    if (filters.typeFilter && filters.typeFilter !== 'all' && row.type !== filters.typeFilter) return false
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      const status = row.deliveryStatus || row.status
      if (status !== filters.statusFilter) return false
    }
    if (filters.followUpFilter && filters.followUpFilter !== 'all') {
      if (filters.followUpFilter === 'pending' && !row.followUpTag) return false
      if (filters.followUpFilter === 'tagged' && !row.counselorName) return false
    }
    if (filters.dateFrom && row.timestamp < `${filters.dateFrom}T00:00:00`) return false
    if (filters.dateTo && row.timestamp > `${filters.dateTo}T23:59:59`) return false
    if (!matchesSearch(row, q)) return false
    return true
  })
}

export function computeCommunicationSummary(logs = []) {
  const total = logs.length
  const delivered = logs.filter((l) => ['Delivered', 'Read', 'Opened', 'Sent'].includes(l.deliveryStatus || l.status)).length
  const failed = logs.filter((l) => (l.deliveryStatus || l.status) === 'Failed').length
  const opened = logs.filter((l) => l.openStatus === 'Opened' || l.tracking?.openedAt).length
  const read = logs.filter((l) => l.readStatus === 'Read' || l.tracking?.readAt).length
  const pendingFollowUps = logs.filter((l) => l.followUpTag && l.followUpPriority === 'High').length

  return {
    total,
    delivered,
    failed,
    openRate: total ? Math.round((opened / total) * 100) : 0,
    readRate: total ? Math.round((read / total) * 100) : 0,
    pendingFollowUps,
    deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
  }
}

export function buildDailyActivityChart(logs = []) {
  const byDay = {}
  logs.forEach((l) => {
    const day = (l.timestamp || '').slice(0, 10)
    if (!day) return
    byDay[day] = (byDay[day] || 0) + 1
  })
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }))
}

export function buildChannelUsageChart(logs = []) {
  const byChannel = {}
  logs.forEach((l) => {
    const ch = l.channel || 'Unknown'
    byChannel[ch] = (byChannel[ch] || 0) + 1
  })
  return Object.entries(byChannel).map(([channel, count]) => ({ channel, count }))
}

export function buildDeliveryTrendChart(logs = []) {
  const byDay = {}
  logs.forEach((l) => {
    const day = (l.timestamp || '').slice(0, 10)
    if (!day) return
    if (!byDay[day]) byDay[day] = { delivered: 0, failed: 0 }
    const status = l.deliveryStatus || l.status
    if (status === 'Failed') byDay[day].failed += 1
    else if (['Delivered', 'Read', 'Opened', 'Sent'].includes(status)) byDay[day].delivered += 1
  })
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({ date, ...v }))
}

export function buildCommunicationAlerts(logs = [], rules = []) {
  const alerts = []
  logs
    .filter((l) => (l.deliveryStatus || l.status) === 'Failed')
    .slice(0, 5)
    .forEach((l) => {
      alerts.push({
        id: `alert-fail-${l.id}`,
        type: 'failed_delivery',
        severity: 'high',
        title: 'Failed communication delivery',
        message: `${l.type} to ${l.studentName || l.recipient} via ${l.channel} failed`,
        rowId: l.id,
        timestamp: l.timestamp,
        read: false,
      })
    })

  logs
    .filter((l) => l.type === 'Escalation Notice' && l.followUpPriority === 'High')
    .slice(0, 3)
    .forEach((l) => {
      alerts.push({
        id: `alert-esc-${l.id}`,
        type: 'escalation',
        severity: 'medium',
        title: 'Escalation triggered',
        message: `${l.studentName} — ${l.paymentReference}`,
        rowId: l.id,
        timestamp: l.timestamp,
        read: false,
      })
    })

  logs
    .filter((l) => l.followUpTag && l.nextFollowUpDate && new Date(l.nextFollowUpDate) <= new Date())
    .slice(0, 5)
    .forEach((l) => {
      alerts.push({
        id: `alert-follow-${l.id}`,
        type: 'counselor_followup',
        severity: 'medium',
        title: 'Pending counselor follow-up',
        message: `${l.counselorName || 'Counselor'} — ${l.studentName}`,
        rowId: l.id,
        timestamp: l.nextFollowUpDate,
        read: false,
      })
    })

  rules
    .filter((r) => r.active && r.lastExecutionStatus === 'Failed')
    .forEach((r) => {
      alerts.push({
        id: `alert-auto-${r.id}`,
        type: 'automation_failure',
        severity: 'high',
        title: 'Automation execution failure',
        message: `Rule "${r.name}" failed on last run`,
        rowId: r.id,
        timestamp: r.lastExecutedAt || new Date().toISOString(),
        read: false,
      })
    })

  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function buildTrackingTimeline(row) {
  const t = row.tracking || {}
  const steps = []
  if (row.timestamp || t.sentAt) {
    steps.push({ step: 'Sent', status: 'completed', timestamp: t.sentAt || row.timestamp, detail: row.sentBy ? `By ${row.sentBy}` : null })
  }
  if (t.deliveredAt || ['Delivered', 'Read', 'Opened', 'Sent'].includes(row.deliveryStatus || row.status)) {
    steps.push({ step: 'Delivered', status: 'completed', timestamp: t.deliveredAt })
  } else if ((row.deliveryStatus || row.status) === 'Failed') {
    steps.push({ step: 'Failed', status: 'failed', timestamp: t.failedAt, detail: t.failedReason })
  } else {
    steps.push({ step: 'Delivered', status: 'pending' })
  }
  if (t.openedAt || row.openStatus === 'Opened') {
    steps.push({ step: 'Opened', status: 'completed', timestamp: t.openedAt })
  } else if (steps[steps.length - 1]?.status !== 'failed') {
    steps.push({ step: 'Opened', status: 'pending' })
  }
  if (t.readAt || row.readStatus === 'Read') {
    steps.push({ step: 'Read', status: 'completed', timestamp: t.readAt })
  } else if (steps[steps.length - 1]?.status !== 'failed') {
    steps.push({ step: 'Read', status: 'pending' })
  }
  return steps
}
