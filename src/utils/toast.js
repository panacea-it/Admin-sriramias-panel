import { toast as sonnerToast } from 'sonner'

/** Default auto-dismiss window (3–5s range) */
export const TOAST_DURATION = {
  short: 3000,
  default: 4000,
  long: 5000,
  extended: 6000,
}

const DEFAULT_DURATION = TOAST_DURATION.default
const MIN_DURATION = TOAST_DURATION.short
const MAX_DURATION = TOAST_DURATION.long

/** @type {Map<string, number>} */
const recentToastKeys = new Map()
const DEDUPE_WINDOW_MS = 2000

let soundEnabled = true

const audioContext =
  typeof window !== 'undefined' && window.AudioContext
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null

function playTone(frequency, duration = 0.08, volume = 0.04, type = 'sine') {
  if (!soundEnabled || !audioContext) return
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.value = volume
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    const now = audioContext.currentTime
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    oscillator.start(now)
    oscillator.stop(now + duration)
  } catch {
    /* ignore audio failures */
  }
}

function playNotificationSound(type) {
  if (type === 'error') {
    playTone(220, 0.1, 0.05, 'triangle')
    setTimeout(() => playTone(165, 0.12, 0.04, 'triangle'), 90)
  } else if (type === 'warning') {
    playTone(392, 0.09, 0.035, 'sine')
  }
}

function clampDuration(duration) {
  if (duration == null) return DEFAULT_DURATION
  if (duration === Infinity) return Infinity
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, duration))
}

function buildToastId(type, message, id) {
  if (id) return id
  const text = typeof message === 'string' ? message : 'custom'
  return `${type}:${text}`
}

function shouldDedupe(key) {
  const now = Date.now()
  const last = recentToastKeys.get(key)
  if (last && now - last < DEDUPE_WINDOW_MS) return true
  recentToastKeys.set(key, now)
  if (recentToastKeys.size > 50) {
    const cutoff = now - DEDUPE_WINDOW_MS
    for (const [k, t] of recentToastKeys) {
      if (t < cutoff) recentToastKeys.delete(k)
    }
  }
  return false
}

const TOAST_CLASS_NAMES = {
  toast: 'app-toast',
  title: 'app-toast-title',
  description: 'app-toast-description',
  actionButton: 'app-toast-action',
  cancelButton: 'app-toast-cancel',
  closeButton: 'app-toast-close',
  icon: 'app-toast-icon',
}

function classNamesForType(type) {
  return {
    ...TOAST_CLASS_NAMES,
    toast: `app-toast app-toast--${type}`,
  }
}

function toastStyle(duration) {
  if (duration === Infinity) return undefined
  return { '--toast-duration': `${duration}ms` }
}

/**
 * Core toast dispatcher — all panel notifications should use this.
 */
function show(type, message, options = {}) {
  const {
    dedupe = true,
    sound,
    important,
    duration,
    id,
    description,
    action,
    cancel,
    onDismiss,
    onAutoClose,
    style,
    ...rest
  } = options

  const toastId = buildToastId(type, message, id)
  if (dedupe && shouldDedupe(toastId)) {
    return toastId
  }

  const playSound =
    sound === true || (sound !== false && (important || type === 'error'))
  if (playSound) playNotificationSound(type)

  const toastDuration = clampDuration(
    important ? TOAST_DURATION.extended : duration,
  )

  const method =
    type === 'default' ? sonnerToast.message : (sonnerToast[type] ?? sonnerToast.message)

  return method(message, {
    id: toastId,
    duration: toastDuration,
    description,
    action,
    cancel,
    onDismiss,
    onAutoClose,
    classNames: classNamesForType(type),
    style: { ...toastStyle(toastDuration), ...style },
    ...rest,
  })
}

/** Standard copy for consistent messaging across the admin panel */
export const toastMessages = {
  success: {
    saved: 'Changes saved successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    adminCreated: 'Admin created successfully',
    courseUpdated: 'Course updated successfully',
    studentAdded: 'Student added successfully',
  },
  error: {
    generic: 'Something went wrong',
    server: 'Unable to connect to server',
    updateFailed: 'Failed to update data',
    saveFailed: 'Failed to save changes',
    requiredFields: 'Please complete all required fields',
  },
  warning: {
    requiredFields: 'Please complete all required fields',
    sessionExpiring: 'Session expiring soon',
  },
  info: {
    newRegistration: 'New student registration received',
    maintenance: 'System maintenance scheduled tonight',
    updateAvailable: 'New update available',
  },
}

export function setToastSoundsEnabled(enabled) {
  soundEnabled = enabled
}

export const toast = {
  success: (message, options) => show('success', message, options),
  error: (message, options) =>
    show('error', message, { important: true, sound: true, ...options }),
  warning: (message, options) => show('warning', message, options),
  info: (message, options) => show('info', message, options),
  message: (message, options) => show('default', message, options),

  /** Future-ready undo pattern */
  undo: (message, onUndo, options = {}) =>
    show('info', message, {
      duration: TOAST_DURATION.extended,
      action: {
        label: 'Undo',
        onClick: () => {
          onUndo?.()
        },
      },
      ...options,
    }),

  promise: (promise, messages, options) =>
    sonnerToast.promise(promise, {
      ...messages,
      classNames: classNamesForType('default'),
      ...options,
    }),

  loading: (message, options) =>
    sonnerToast.loading(message, {
      duration: Infinity,
      classNames: classNamesForType('loading'),
      ...options,
    }),

  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
}

export default toast
