const DEMO_TITLES = [
  'UPSC Current Affairs',
  'IAS Motivation',
  'Economy Lecture',
  'Polity Lecture',
  'History Marathon',
  'Geography Revision',
  'CSAT Tips',
  'Interview Guidance',
  'Ethics Lecture',
  'Daily Editorial Analysis',
]

const SAMPLE_YOUTUBE_IDS = [
  'dQw4w9WgXcQ',
  'jNQXAC9IVRw',
  '9bZkp7q19f0',
  'kJQP7kiw5Fk',
  'RgKAFK5djSk',
  'fJ9rUzIMcZQ',
  'y6120QOlsfU',
  'L_jWHffIx5E',
  'OPf0YbXqDm0',
  'CevxZvSJLk8',
]

const EXTRA_TITLES = [
  'UPSC Preparation Youtube',
  'Science & Tech Update',
  'Environment & Ecology',
  'International Relations',
  'Essay Writing Tips',
  'Answer Writing Practice',
  'Previous Year Analysis',
  'Mock Interview Series',
]

function demoUrl(index) {
  const videoId = SAMPLE_YOUTUBE_IDS[index % SAMPLE_YOUTUBE_IDS.length]
  return `https://www.youtube.com/watch?v=${videoId}`
}

const makeYoutubeRows = () => {
  const allTitles = [...DEMO_TITLES, ...EXTRA_TITLES]
  return allTitles.map((name, i) => ({
    id: String(57001 + i),
    name,
    url: demoUrl(i),
    time: `${9 + (i % 4)} AM`,
    date: '14 May 2026',
    dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
    status: i % 4 === 0 ? 'Deactivated' : 'Active',
    priorityOrder: i < 8 ? i + 1 : null,
    priorityLevel: 0,
    customOrder: i,
    priorityExpiryDate: i === 2 ? '2026-12-31' : null,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

export const INITIAL_YOUTUBE_VIDEOS = makeYoutubeRows()

const makeRankRows = () =>
  Array.from({ length: 18 }, (_, i) => ({
    id: String(56565 + i),
    name: 'Darshan Kotla',
    rank: 'AIR 4',
    imageUrl: null,
    time: '10 AM',
    date: '14 May 2026',
    dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
    status: i % 4 === 0 ? 'Deactivated' : 'Active',
  }))

export const INITIAL_RANKERS = makeRankRows()
