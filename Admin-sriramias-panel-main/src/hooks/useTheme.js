const STORAGE_KEYS = ['admin_theme', 'theme', 'darkMode', 'color-mode', 'chakra-ui-color-mode']

/** Always light — removes persisted/system dark mode before paint. */
export function initTheme() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove('dark')
  root.style.colorScheme = 'light'
  root.dataset.theme = 'light'

  try {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
    localStorage.setItem('admin_theme', 'light')
  } catch {
    /* private browsing / blocked storage */
  }
}

/** No-op theme hook — app is permanently light mode. */
export function useTheme() {
  return {
    theme: 'light',
    isDark: false,
    setTheme: () => {},
    toggleTheme: () => {},
  }
}
