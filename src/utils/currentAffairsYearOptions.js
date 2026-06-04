/** Current calendar year through the next five years */
export function getCurrentAffairsYearOptions() {
  const start = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => String(start + i))
}
