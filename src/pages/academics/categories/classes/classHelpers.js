export function nextClassId(list) {
  const max = list.reduce((m, row) => Math.max(m, parseInt(row.id, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

export function filterClasses(rows, { search, subjectFilter, classFilter }) {
  const q = search.trim().toLowerCase()
  return rows.filter((row) => {
    const matchSearch = !q || row.name?.toLowerCase().includes(q)
    const matchSubject = subjectFilter === 'all' || row.subject === subjectFilter
    const matchClass = classFilter === 'all' || row.name === classFilter
    return matchSearch && matchSubject && matchClass
  })
}

export function sortClasses(rows, sortBy, sortOrder) {
  if (!sortBy) return rows

  const dir = sortOrder === 'desc' ? -1 : 1
  const sorted = [...rows]

  sorted.sort((a, b) => {
    let av
    let bv

    switch (sortBy) {
      case 'subject':
        av = a.subject || ''
        bv = b.subject || ''
        break
      case 'name':
        av = a.name || ''
        bv = b.name || ''
        break
      case 'status':
        av = a.status || ''
        bv = b.status || ''
        break
      case 'createdAt':
        av = new Date(a.createdAt).getTime() || 0
        bv = new Date(b.createdAt).getTime() || 0
        return (av - bv) * dir
      default:
        return 0
    }

    return String(av).localeCompare(String(bv)) * dir
  })

  return sorted
}
