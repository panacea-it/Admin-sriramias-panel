export const YOUTUBE_ANALYTICS_LABELS = ['Featured', 'Trending', 'Most Watched']

export const YOUTUBE_AUTO_COMPACT_STORAGE_KEY = 'youtube_auto_compact_priorities'
export const YOUTUBE_ALLOW_GAPS_STORAGE_KEY = 'youtube_allow_priority_gaps'

export const YOUTUBE_RANK_VISUAL = {
  goldMax: 5,
  silverMax: 10,
}

export function buildYoutubePriorityFilterOptions() {
  return [
    { value: 'all', label: 'All Priorities' },
    { value: 'ranked', label: 'Ranked only' },
    { value: 'top', label: 'Top 10 ranked' },
    { value: 'none', label: 'Unranked' },
  ]
}
