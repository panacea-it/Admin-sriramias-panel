/** Supplemental provisioning data keyed by faculty subject id (Academics → Subjects) */

export const SUBJECT_LESSON_MODULES = {
  '001': [
    {
      chapter: 'Module 1 — Constitutional Framework',
      lessons: [
        { title: 'Introduction to Constitution', type: 'Video', duration: '45 min', hasNotes: true },
        { title: 'Preamble & Basic Structure', type: 'Video', duration: '38 min', hasNotes: true },
      ],
    },
    {
      chapter: 'Module 2 — Fundamental Rights',
      lessons: [
        { title: 'Articles 12–35 Overview', type: 'Video', duration: '52 min', hasNotes: true },
        { title: 'Writ Jurisdiction', type: 'Notes + PDF', duration: '—', hasNotes: true },
      ],
    },
  ],
  '002': [
    {
      chapter: 'Module 1 — Ancient India',
      lessons: [
        { title: 'Indus Valley Civilization', type: 'Video', duration: '40 min', hasNotes: true },
        { title: 'Mauryan Administration', type: 'Video', duration: '55 min', hasNotes: true },
      ],
    },
  ],
  '003': [
    {
      chapter: 'Module 1 — Physical Geography',
      lessons: [
        { title: 'Indian Monsoon System', type: 'Video', duration: '48 min', hasNotes: true },
        { title: 'Climate Zones Map Work', type: 'Assignment', duration: '30 min', hasNotes: false },
      ],
    },
  ],
}

export const SUBJECT_TESTS = {
  '001': [
    { title: 'Polity Prelims Mock 1', type: 'Mock Exam', schedule: '2026-06-01', duration: '120 min', marks: 200, status: 'Scheduled' },
    { title: 'Fundamental Rights Quiz', type: 'Quiz', schedule: '2026-05-28', duration: '30 min', marks: 50, status: 'Open' },
    { title: 'Weekly Assignment — DPSP', type: 'Assignment', schedule: '2026-05-20', duration: '—', marks: 25, status: 'Completed' },
  ],
  '002': [
    { title: 'Ancient History Sectional Test', type: 'Sectional', schedule: '2026-06-05', duration: '90 min', marks: 150, status: 'Scheduled' },
  ],
  '003': [
    { title: 'Geography Map-Based Test', type: 'Quiz', schedule: '2026-05-30', duration: '45 min', marks: 75, status: 'Scheduled' },
  ],
}

export const SUBJECT_MATERIALS = {
  '001': [
    { title: 'Indian Polity — Chapter Notes PDF', type: 'PDF', format: 'Download', updated: '2026-05-10' },
    { title: 'Fundamental Rights Reference Sheet', type: 'Document', format: 'View online', updated: '2026-05-12' },
  ],
  '002': [
    { title: 'Ancient India Timeline', type: 'PDF', format: 'Download', updated: '2026-05-08' },
  ],
  '003': [
    { title: 'Monsoon Diagram Pack', type: 'PDF', format: 'Download', updated: '2026-05-14' },
    { title: 'World Maps Workbook', type: 'Notes', format: 'View online', updated: '2026-05-01' },
  ],
}

export const SUBJECT_BOOKS = {
  '001': [
    { title: 'Indian Polity General Studies Book -1', type: 'Physical + Digital', price: '₹4,500', status: 'Active' },
  ],
  '002': [
    { title: 'Indian Economy General Studies Book -1', type: 'Physical', price: '₹5,000', status: 'Active' },
    { title: 'Indian Economy General Studies Book -2', type: 'Digital', price: '₹5,000', status: 'Active' },
  ],
  '003': [
    { title: 'Environment & Ecology Compendium', type: 'Digital', price: '₹3,800', status: 'Active' },
  ],
}

export const SUBJECT_FACULTY_EXTRA = {
  '001': [
    { name: 'Darshan Kotla', role: 'Lead Faculty', experience: '12 years UPSC mentoring', classesAssigned: 8 },
    { name: 'Dr. Sharma', role: 'Guest Faculty', experience: '8 years — Polity & Governance', classesAssigned: 3 },
  ],
  '002': [{ name: 'Priya Sharma', role: 'Lead Faculty', experience: '10 years — History', classesAssigned: 5 }],
  '003': [{ name: 'Rahul Verma', role: 'Lead Faculty', experience: '9 years — Geography', classesAssigned: 4 }],
}
