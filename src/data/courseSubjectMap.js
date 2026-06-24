/**
 * Course ↔ Subject assignments.
 * Live classes inherit into every course that includes the lesson's subject.
 * Replace with API: GET /api/courses/:id/subjects
 */
export const COURSE_SUBJECT_MAP = [
  {
    courseId: 1,
    courseName: '2 Years GS Foundation Course',
    subjectIds: ['001', '002'],
  },
  {
    courseId: 2,
    courseName: 'NCERT Foundation Course',
    subjectIds: ['001', '003'],
  },
  {
    courseId: 4,
    courseName: 'Optional Sociology Foundation',
    subjectIds: ['002'],
  },
  {
    courseId: 5,
    courseName: 'Prelims Test Series 2026',
    subjectIds: ['001', '002', '003'],
  },
]
