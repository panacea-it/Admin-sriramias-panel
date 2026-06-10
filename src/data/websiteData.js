const makeYoutubeRows = () =>
  Array.from({ length: 18 }, (_, i) => ({
    id: String(56565 + i),
    name: 'UPSC Preparation Youtube',
    url:
      i === 0
        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        : 'www.upscpreaparationvideo.com',
    time: '10 AM',
    date: '14 May 2026',
    dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
    status: i % 3 === 0 ? 'Inactive' : 'Active',
    priorityOrder: i < 8 ? i + 1 : null,
    priorityLevel: 0,
    isFeatured: i < 2,
    isPinned: i === 0,
    customOrder: i,
    priorityExpiryDate: i === 1 ? '2026-12-31' : null,
    analyticsLabels:
      i === 0 ? ['Featured', 'Trending'] : i === 1 ? ['Most Watched'] : [],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }))

const makeRankRows = () =>
  Array.from({ length: 18 }, (_, i) => ({
    id: String(56565 + i),
    name: 'Darshan Kotla',
    rank: 'AIR 4',
    imageUrl: null,
    time: '10 AM',
    date: '14 May 2026',
    dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
    status: i % 4 === 0 ? 'Inactive' : 'Active',
  }))

const makeReviewRows = () =>
  Array.from({ length: 18 }, (_, i) => ({
    id: String(56565 + i),
    name: 'Darshan Kotla',
    mobile: '6300662566',
    rating: '4.5',
    review: 'Good',
    time: '10 AM',
    date: '14 May 2026',
    dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
  }))

export const INITIAL_YOUTUBE_VIDEOS = makeYoutubeRows()
export const INITIAL_RANKERS = makeRankRows()
export const INITIAL_APP_REVIEWS = makeReviewRows()
