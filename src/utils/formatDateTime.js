/** Format ISO date as "10:37 PM, 18 May 2026" */
export function formatCategoryDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const date = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${time}, ${date}`
}

/** Format last attempt as two lines: time, then date */
export function formatLastAttemptDisplay(iso) {
  if (!iso) return { time: '—', date: '—' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { time: '—', date: '—' }
  return {
    time: d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    date: d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }
}
