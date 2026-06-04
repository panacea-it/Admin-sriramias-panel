/**
 * Live Classes UI tokens — aligned with Current Affairs / academics blue palette.
 */
export const LIVE_CLASSES_BANNER_GRADIENT = 'from-[#55ace7] via-[#8b98bb] to-[#b8887a]'

export const LIVE_CLASSES_COLORS = {
  primary: '#55ace7',
  primaryDark: '#246392',
  primaryHover: '#4a9ad4',
  navy: '#1a3a5c',
  navyDeep: '#03045e',
  pageBg: '#f7f7f7',
  searchBg: '#eef2fc',
  inputBg: '#e8f4fc',
  chipBg: '#cbeeff',
  statusActive: '#69df66',
  statusInactive: '#efb36d',
  delete: '#c96565',
  deleteHover: '#b94b4b',
  textMuted: '#686868',
  textTitle: '#1a3a5c',
}

/** Tailwind class bundles */
export const liveClassesTw = {
  banner: LIVE_CLASSES_BANNER_GRADIENT,
  bannerIcon: 'text-[#246392]',
  tabActive:
    'scale-[1.02] bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-[0_4px_14px_rgba(36,99,146,0.35)]',
  tabIdle:
    'bg-white text-[#222] shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:scale-[1.02] hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]',
  filterSelect:
    'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none transition hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50',
  searchInput:
    'h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]',
  addButton:
    'inline-flex h-10 items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a]',
  courseCountBadge: 'inline-flex rounded-full bg-[#eef2fc] px-2.5 py-0.5 text-xs font-bold text-[#246392]',
  bulkBar: 'rounded-xl bg-[#eef2fc] px-4 py-3',
  rowHover: 'transition-colors hover:bg-slate-50/90',
  filterBar:
    'rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4',
  modalRecordingBorder: 'ring-1 ring-[#e8f4fc]',
  calendarToday: 'bg-[#55ace7]',
  calendarRing: 'ring-2 ring-[#55ace7]/40',
}
