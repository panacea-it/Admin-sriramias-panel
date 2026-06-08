/**
 * Client-side tracking SDK for public website integration.
 * Tracks page visits, clicks, scroll depth, payment events, and auto lead capture popup.
 *
 * Usage:
 *   import { initLeadTracking } from '@/utils/leadTracking'
 *   initLeadTracking({ apiBase: '/api', popupDelaySeconds: 10 })
 */

import { createLead, trackEvent } from '../api/salesAnalyticsAPI'

const DEFAULT_POPUP_DELAY = 10

function classifySource() {
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get('utm_source')?.toLowerCase()
  const referrer = document.referrer?.toLowerCase() || ''

  if (utmSource?.includes('google')) return 'Google Ads'
  if (utmSource?.includes('facebook') || utmSource?.includes('meta')) return 'Meta Ads'
  if (utmSource?.includes('youtube')) return 'YouTube Ads'
  if (utmSource?.includes('instagram')) return 'Instagram'
  if (utmSource?.includes('linkedin')) return 'LinkedIn'
  if (referrer.includes('google.')) return 'Organic'
  if (referrer) return 'Referral'
  return 'Direct Traffic'
}

async function emit(type, payload = {}) {
  try {
    await trackEvent({
      type,
      path: window.location.pathname,
      source: classifySource(),
      ...payload,
      timestamp: new Date().toISOString(),
    })
  } catch {
    /* silent — tracking must not break UX */
  }
}

function createPopup(delaySeconds, onSubmit) {
  let shown = false
  let minimized = false

  const timer = setTimeout(() => {
    if (shown) return
    shown = true

    const overlay = document.createElement('div')
    overlay.className =
      'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm'
    overlay.innerHTML = `
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#111]">Interested in our courses?</h2>
          <button type="button" data-close class="rounded-full p-1 text-[#686868] hover:bg-gray-100">✕</button>
        </div>
        <form class="space-y-3" data-lead-form>
          <input name="name" required placeholder="Name" class="w-full rounded-xl border px-3 py-2.5 text-sm" />
          <input name="mobile" required placeholder="Mobile" class="w-full rounded-xl border px-3 py-2.5 text-sm" />
          <input name="email" type="email" required placeholder="Email" class="w-full rounded-xl border px-3 py-2.5 text-sm" />
          <input name="course" required placeholder="Interested course" class="w-full rounded-xl border px-3 py-2.5 text-sm" />
          <button type="submit" class="w-full rounded-xl bg-[#246392] py-2.5 text-sm font-semibold text-white">Submit</button>
        </form>
      </div>
    `

    const close = () => overlay.remove()
    overlay.querySelector('[data-close]').addEventListener('click', close)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close()
    })

    overlay.querySelector('[data-lead-form]').addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const payload = {
        studentName: fd.get('name'),
        mobile: fd.get('mobile'),
        email: fd.get('email'),
        interestedCourse: fd.get('course'),
        source: classifySource(),
      }
      await onSubmit(payload)
      close()
    })

    document.body.appendChild(overlay)
  }, delaySeconds * 1000)

  return () => clearTimeout(timer)
}

export function initLeadTracking(options = {}) {
  const { popupDelaySeconds = DEFAULT_POPUP_DELAY, enablePopup = true } = options
  const sessionStart = Date.now()
  let maxScroll = 0

  emit('page_visit', {
    title: document.title,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browser: navigator.userAgent,
  })

  window.addEventListener('scroll', () => {
    const depth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
    )
    if (depth > maxScroll) {
      maxScroll = depth
      if (depth % 25 === 0) emit('scroll_depth', { depth })
    }
  })

  window.addEventListener('beforeunload', () => {
    emit('session_end', {
      durationSec: Math.round((Date.now() - sessionStart) / 1000),
      maxScroll,
      exitPage: window.location.pathname,
    })
  })

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track-click]')
    if (el) emit('click', { label: el.getAttribute('data-track-click') })
  })

  if (enablePopup) {
    createPopup(popupDelaySeconds, async (payload) => {
      await emit('lead_capture', payload)
      await createLead({ ...payload, status: 'New Lead' })
    })
  }

  return { track: emit, classifySource }
}
