/**
 * Hierarchical LMS seed — Subject → Category → Folder → Items
 */
import { CATEGORY_TYPES } from '../utils/facultySubjectHierarchy'

export const FACULTY_CONTENT_SEED_VERSION = 5

function iso(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function liveItem(id, title, extra = {}) {
  return {
    id: `item-${id}`,
    itemType: CATEGORY_TYPES.LIVE_CLASS,
    title,
    linkedExistingFormId: id,
    status: extra.status || 'draft',
    lastUpdated: iso(2),
    data: {
      id,
      classTitle: title,
      center: 'New Delhi',
      classroomId: 'cr-001',
      classroom: 'Class Room 1',
      classRoom: 'Class Room 1',
      date: extra.date || '2026-06-10',
      startTime: extra.startTime || '10:00',
      scheduledTime: extra.startTime || '10:00',
      durationMinutes: 120,
      timeHrs: '10',
      timeMin: '00',
      timeSec: '00',
      durationHrs: '02',
      durationMin: '00',
      durationSec: '00',
      duration: '10 AM to 12 PM',
      status: 'Active',
      description: extra.description || '',
      meetingUrl: extra.meetingUrl || 'https://zoom.us/j/xyz',
      teacher: extra.teacher || 'Darshan Kotla',
      ...extra,
    },
  }
}

function recordingItem(id, title, extra = {}) {
  return {
    id: `item-${id}`,
    itemType: CATEGORY_TYPES.RECORDED_CLASS,
    title,
    linkedExistingFormId: id,
    status: extra.status || 'published',
    lastUpdated: iso(3),
    data: {
      id,
      lessonName: title,
      center: 'New Delhi',
      topic: extra.topic || 'Constitution of India',
      teacher: extra.teacher || 'Darshan Kotla',
      videoFileName: extra.videoFileName || 'lecture.mp4',
      videoDuration: extra.videoDuration || '45 mins',
      description: extra.description || '',
      visibility: 'Published',
      status: 'Active',
      youtubeUrl: extra.youtubeUrl || '',
    },
  }
}

function testItem(id, title, extra = {}) {
  return {
    id: `item-${id}`,
    itemType: CATEGORY_TYPES.TEST_SERIES,
    title,
    linkedExistingFormId: id,
    status: extra.status || 'draft',
    lastUpdated: iso(1),
    testSeries: {
      details: {
        testName: title,
        totalMarks: extra.marks || 50,
        mode: 'prelims',
      },
      schedule: { date: extra.date || '2026-06-20', time: '10:00' },
      durationMinutes: extra.durationMinutes || 30,
      questions: [],
    },
  }
}

function folder(id, name, items = [], extra = {}) {
  return {
    id,
    parentFolderId: extra.parentFolderId ?? null,
    folderName: name,
    description: extra.description || '',
    orderIndex: extra.orderIndex ?? 0,
    updatedAt: iso(1),
    items,
  }
}

function category(id, categoryType, label, folders) {
  return { id, categoryType, label, orderIndex: 0, folders }
}

const CONSTITUTION_LIVE = folder('fld-live-constitution', 'Constitution of India', [
  liveItem('lc-hist', 'Historical Background class', {
    date: '2026-06-10',
    startTime: '10:00',
    description: 'Introduction to constitutional development in India.',
    teacher: 'Darshan Sir',
    status: 'published',
  }),
  liveItem('lc-making', 'Making of the Constitution class', {
    date: '2026-06-12',
    startTime: '11:00',
    teacher: 'Darshan Sir',
  }),
  liveItem('lc-salient', 'Salient Features class', {
    date: '2026-06-15',
    startTime: '09:30',
    teacher: 'Darshan Sir',
  }),
])

const UNION_LIVE = folder('fld-live-union', 'Union Government', [
  liveItem('lc-president', 'President class', { date: '2026-06-18', startTime: '10:00' }),
  liveItem('lc-vp', 'Vice President class', { date: '2026-06-19', startTime: '11:00' }),
  liveItem('lc-pm', 'Prime Minister class', { date: '2026-06-20', startTime: '14:00' }),
])

const STATE_LIVE = folder('fld-live-state', 'State Government', [
  liveItem('lc-governor', 'Governor class', { date: '2026-06-22', startTime: '10:00' }),
  liveItem('lc-cm', 'Chief Minister class', { date: '2026-06-23', startTime: '11:00' }),
  liveItem('lc-scm', 'State Council of Ministers class', { date: '2026-06-24', startTime: '15:00' }),
  liveItem('lc-sl', 'State Legislature class', { date: '2026-06-25', startTime: '10:00' }),
  liveItem('lc-hc', 'High Court class', { date: '2026-06-26', startTime: '16:00' }),
])

const CONSTITUTION_REC = folder('fld-rec-constitution', 'Constitution of India', [
  recordingItem('rec-hist', 'Historical Background recording', {
    videoDuration: '45 mins',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  }),
  recordingItem('rec-making', 'Making of the Constitution recording', { videoDuration: '38 mins' }),
  recordingItem('rec-salient', 'Salient Features recording', { videoDuration: '52 mins' }),
])

const UNION_REC = folder('fld-rec-union', 'Union Government', [
  recordingItem('rec-president', 'President recording'),
  recordingItem('rec-vp', 'Vice President recording'),
  recordingItem('rec-pm', 'Prime Minister recording'),
])

const STATE_REC = folder('fld-rec-state', 'State Government', [
  recordingItem('rec-governor', 'Governor recording'),
  recordingItem('rec-cm', 'Chief Minister recording'),
  recordingItem('rec-scm', 'State Council of Ministers recording'),
  recordingItem('rec-sl', 'State Legislature recording'),
  recordingItem('rec-hc', 'High Court recording'),
])

const CONSTITUTION_TEST = folder('fld-test-constitution', 'Constitution of India', [
  testItem('ts-hist', 'Historical Background test series', { durationMinutes: 30, marks: 50 }),
  testItem('ts-making', 'Making of the Constitution test series', { durationMinutes: 30, marks: 50 }),
  testItem('ts-salient', 'Salient Features test series', { durationMinutes: 30, marks: 50 }),
])

const UNION_TEST = folder('fld-test-union', 'Union Government', [
  testItem('ts-president', 'President test series', { marks: 40 }),
  testItem('ts-vp', 'Vice President test series', { marks: 40 }),
  testItem('ts-pm', 'Prime Minister test series', { marks: 40 }),
])

function polityTestSeriesContent(subjectId, facultyName, facultyId) {
  const sid = String(subjectId)
  const constitution = folder(`fld-test-constitution-${sid}`, 'Constitution of India', [
    testItem(`ts-hist-${sid}`, 'Historical Background Test Series', { durationMinutes: 30, marks: 50 }),
    testItem(`ts-making-${sid}`, 'Making of the Constitution Test Series', { durationMinutes: 30, marks: 50 }),
    testItem(`ts-salient-${sid}`, 'Salient Features Test Series', { durationMinutes: 30, marks: 50 }),
  ])
  const union = folder(`fld-test-union-${sid}`, 'Union Government', [
    testItem(`ts-president-${sid}`, 'President Test Series', { marks: 40 }),
    testItem(`ts-vp-${sid}`, 'Vice President Test Series', { marks: 40 }),
    testItem(`ts-pm-${sid}`, 'Prime Minister Test Series', { marks: 40 }),
  ])
  return {
    subjectId: sid,
    subjectName: 'Indian Polity',
    categoryIds: ['Test'],
    facultyId,
    facultyName,
    publishStatus: 'published',
    seedVersion: FACULTY_CONTENT_SEED_VERSION,
    categories: [
      category(`cat-test-${sid}`, CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [
        constitution,
        union,
      ]),
    ],
  }
}

export const POLITY_DARSHAN_CONTENT = {
  subjectId: '001',
  subjectName: 'Indian Polity',
  categoryIds: ['Live Class', 'Recording', 'Test', 'Mains Answer Writing', 'PDF'],
  facultyId: 'fac-001',
  facultyName: 'Darshan Kotla',
  publishStatus: 'draft',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-live', CATEGORY_TYPES.LIVE_CLASS, 'Live Class', [
      CONSTITUTION_LIVE,
      UNION_LIVE,
      STATE_LIVE,
    ]),
    category('cat-rec', CATEGORY_TYPES.RECORDED_CLASS, 'Recording', [
      CONSTITUTION_REC,
      UNION_REC,
      STATE_REC,
    ]),
    category('cat-test', CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [
      CONSTITUTION_TEST,
      UNION_TEST,
    ]),
    category('cat-mains', CATEGORY_TYPES.MAINS_ANSWER_WRITING, 'Mains Answer Writing', [
      folder('fld-mains-constitution', 'Constitution of India', [
        testItem('mw-hist', 'Constitutional Development Essay', {
          durationMinutes: 90,
          marks: 150,
        }),
        testItem('mw-fed', 'Federalism Essay', { durationMinutes: 120, marks: 200 }),
      ]),
    ]),
    category('cat-pdf', CATEGORY_TYPES.PDFS, 'PDF', [
      folder('fld-pdf-constitution', 'Constitution of India', [
        {
          id: 'item-pdf-hist',
          itemType: CATEGORY_TYPES.PDFS,
          title: 'Historical Background.pdf',
          linkedExistingFormId: 'pdf-hist',
          status: 'published',
          lastUpdated: iso(0),
          data: {
            id: 'pdf-hist',
            title: 'Historical Background',
            fileName: 'historical-background.pdf',
            fileSize: 2097152,
            createdAt: iso(0),
          },
        },
      ]),
    ]),
  ],
}

export const HISTORY_CONTENT = {
  subjectId: '002',
  subjectName: 'History',
  categoryIds: ['Live Class'],
  facultyName: 'Priya Sharma',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-live', CATEGORY_TYPES.LIVE_CLASS, 'Live Class', [
      folder('fld-hist-ancient', 'Ancient India', [
        liveItem('lc-indus', 'Indus Valley Civilization class', {
          date: '2026-07-01',
          teacher: 'Priya Sharma',
        }),
      ]),
    ]),
  ],
}

export const GEOGRAPHY_CONTENT = {
  subjectId: '003',
  subjectName: 'Geography',
  categoryIds: ['Recording', 'PDF'],
  facultyName: 'Rahul Verma',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-rec', CATEGORY_TYPES.RECORDED_CLASS, 'Recording', [
      folder('fld-geo-maps', 'World Maps', [
        recordingItem('rec-maps', 'Reading Topographic Maps', {
          videoDuration: '33 mins',
        }),
      ]),
    ]),
  ],
}

const HISTORY_TEST = folder('fld-test-medieval', 'Medieval India', [
  testItem('ts-delhi', 'Delhi Sultanate Test Series', { marks: 50 }),
  testItem('ts-mughal', 'Mughal Empire Test Series', { marks: 50 }),
])

const GEOGRAPHY_TEST = folder('fld-test-physical', 'Physical Geography', [
  testItem('ts-climate', 'Climate & Weather Test Series', { marks: 40 }),
  testItem('ts-soils', 'Soils & Vegetation Test Series', { marks: 40 }),
])

const ECONOMY_TEST = folder('fld-test-macro', 'Indian Economy', [
  testItem('ts-budget', 'Budget 2026 Test Series', { marks: 50 }),
  testItem('ts-rbi', 'RBI & Monetary Policy Test Series', { marks: 50 }),
])

const ENVIRONMENT_TEST = folder('fld-test-eco', 'Environment & Ecology', [
  testItem('ts-climate-chg', 'Climate Change Test Series', { marks: 45 }),
  testItem('ts-biodiv', 'Biodiversity Test Series', { marks: 45 }),
])

export const POLITY_NARASIMHA_CONTENT = polityTestSeriesContent('004', 'Narasimha', 'fac-narasimha')
export const POLITY_NIKITA_CONTENT = polityTestSeriesContent('005', 'Nikita', 'fac-nikita')
export const POLITY_DARSHANA_CONTENT = polityTestSeriesContent('006', 'Darshana', 'fac-darshana')

export const HISTORY_NIKITA_CONTENT = {
  subjectId: '007',
  subjectName: 'History',
  categoryIds: ['Live Class', 'Test'],
  facultyName: 'Nikita',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-live', CATEGORY_TYPES.LIVE_CLASS, 'Live Class', [
      folder('fld-hist-ancient', 'Ancient India', [
        liveItem('lc-indus-n', 'Indus Valley Civilization class', { teacher: 'Nikita' }),
      ]),
    ]),
    category('cat-test', CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [HISTORY_TEST]),
  ],
}

export const GEOGRAPHY_DARSHANA_CONTENT = {
  subjectId: '008',
  subjectName: 'Geography',
  categoryIds: ['Test'],
  facultyName: 'Darshana',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-test', CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [GEOGRAPHY_TEST]),
  ],
}

export const ECONOMY_ARJUN_CONTENT = {
  subjectId: '009',
  subjectName: 'Economy',
  categoryIds: ['Test'],
  facultyName: 'Arjun',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-test', CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [ECONOMY_TEST]),
  ],
}

export const ENVIRONMENT_MEGHANA_CONTENT = {
  subjectId: '010',
  subjectName: 'Environment',
  categoryIds: ['Test'],
  facultyName: 'Meghana',
  seedVersion: FACULTY_CONTENT_SEED_VERSION,
  categories: [
    category('cat-test', CATEGORY_TYPES.TEST_SERIES, 'Prelims Test', [ENVIRONMENT_TEST]),
  ],
}

export const FACULTY_SUBJECT_CONTENT_SEEDS = {
  '001': POLITY_DARSHAN_CONTENT,
  '002': HISTORY_CONTENT,
  '003': GEOGRAPHY_CONTENT,
  '004': POLITY_NARASIMHA_CONTENT,
  '005': POLITY_NIKITA_CONTENT,
  '006': POLITY_DARSHANA_CONTENT,
  '007': HISTORY_NIKITA_CONTENT,
  '008': GEOGRAPHY_DARSHANA_CONTENT,
  '009': ECONOMY_ARJUN_CONTENT,
  '010': ENVIRONMENT_MEGHANA_CONTENT,
}

export function getFacultySubjectContentSeed(subjectId) {
  return FACULTY_SUBJECT_CONTENT_SEEDS[String(subjectId)] ?? null
}

/** Merge seed item payloads into subject row for table/sync compatibility */
export function mergeSeedIntoSubject(subject, content) {
  if (!subject || !content?.categories) return subject
  const liveClasses = [...(subject.liveClasses || [])]
  const recordings = [...(subject.recordings || [])]

  content.categories.forEach((cat) => {
    cat.folders?.forEach((fld) => {
      fld.items?.forEach((item) => {
        if (item.data?.id && item.itemType === CATEGORY_TYPES.LIVE_CLASS) {
          const idx = liveClasses.findIndex((lc) => lc.id === item.data.id)
          const row = { ...item.data, folderId: fld.id, categoryId: cat.id, contentItemId: item.id }
          if (idx >= 0) liveClasses[idx] = row
          else liveClasses.push(row)
        }
        if (item.data?.id && item.itemType === CATEGORY_TYPES.RECORDED_CLASS) {
          const idx = recordings.findIndex((r) => r.id === item.data.id)
          const row = { ...item.data, folderId: fld.id, categoryId: cat.id, contentItemId: item.id }
          if (idx >= 0) recordings[idx] = row
          else recordings.push(row)
        }
      })
    })
  })

  return { ...subject, liveClasses, recordings }
}
