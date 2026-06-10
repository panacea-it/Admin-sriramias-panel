export const COURSE_CATEGORIES = [
  { id: 1, name: 'GS Foundation Course', status: 'Active' },
  { id: 2, name: 'Mentorship', status: 'Active' },
  { id: 3, name: 'Test Series', status: 'In Active' },
  { id: 4, name: 'Optional Foundation', status: 'Active' },
  { id: 5, name: 'NCERT Foundation', status: 'Active' },
]

/** Sub-categories keyed by parent category name */
export const SUB_CATEGORIES_BY_CATEGORY = {
  'GS Foundation Course': ['Prelims Integrated', 'Mains Integrated', 'CSAT Booster'],
  Mentorship: ['1-on-1 Mentorship', 'Group Mentorship'],
  'Test Series': ['Prelims Test Series', 'Mains Test Series', 'Full Length Tests'],
  'Optional Foundation': ['Sociology', 'Anthropology', 'Geography'],
  'NCERT Foundation': ['Class VI–XII', 'NCERT Revision'],
}

export const INITIAL_COURSES = [
  {
    id: 1,
    name: '2 Years GS Foundation Course',
    category: 'GS Foundation',
    center: 'Delhi',
    price: '175000 - 210000',
    status: 'Active',
  },
  {
    id: 2,
    name: 'NCERT Foundation Course',
    category: 'NCERT Foundation',
    center: 'Delhi',
    price: '85000',
    status: 'Active',
  },
  {
    id: 3,
    name: 'GS Mentorship Program',
    category: 'Mentorship',
    center: 'Delhi',
    price: '45000 - 55000',
    status: 'In Active',
  },
  {
    id: 4,
    name: 'Optional Sociology Foundation',
    category: 'Optional Foundation',
    center: 'Delhi',
    price: '120000',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Prelims Test Series 2026',
    category: 'Test Series',
    center: 'Delhi',
    price: '25000',
    status: 'Active',
  },
]
