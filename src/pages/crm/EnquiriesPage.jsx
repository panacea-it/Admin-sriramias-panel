import { useCallback, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EnquiryFilterToolbar from '../../components/enquiries/EnquiryFilterToolbar'
import EnquiryStatCards from '../../components/enquiries/EnquiryStatCards'
import EnquiryStatusBadge from '../../components/enquiries/EnquiryStatusBadge'
import { ENQUIRY_STATS, INITIAL_ENQUIRIES } from '../../data/enquiriesData'

function matchesType(rowType, filter) {
  if (filter === 'all') return true
  if (filter === 'Admission') return rowType.includes('Admission')
  if (filter === 'Demo') return rowType === 'Demo'
  return true
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState(INITIAL_ENQUIRIES)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const handleStatusChange = useCallback((id, nextStatus) => {
    setEnquiries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)),
    )
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enquiries.filter((row) => {
      const matchSearch =
        !q ||
        row.student.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.enquiryType.toLowerCase().includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchDate = dateFilter === 'all' || row.enquiryDate === dateFilter
      const matchType = matchesType(row.enquiryType, typeFilter)
      return matchSearch && matchCenter && matchDate && matchType
    })
  }, [enquiries, search, centerFilter, dateFilter, typeFilter])

  const columns = [
    {
      key: 'student',
      label: 'Student',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10 align-middle',
      render: (row) => (
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="h-6 w-6 shrink-0 rounded bg-[#cbeeff]" />
          <span className="truncate font-medium">{row.student}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Details',
      cellClassName: 'align-middle',
      render: (row) => (
        <span className="text-sm sm:text-base">
          {row.email} <span className="text-[#9ca0a8]">|</span> {row.phone}
        </span>
      ),
    },
    { key: 'enquiryType', label: 'Enquiry Type', cellClassName: 'align-middle' },
    { key: 'center', label: 'Center', cellClassName: 'align-middle' },
    { key: 'enquiryDate', label: 'Enquiry Date', cellClassName: 'align-middle' },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'text-center',
      cellClassName: 'align-middle text-center',
      render: (row) => (
        <EnquiryStatusBadge
          status={row.status}
          onStatusChange={(nextStatus) => handleStatusChange(row.id, nextStatus)}
        />
      ),
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Enquiries"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        />

        <EnquiryFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          dateRange={dateFilter}
          onDateRangeChange={(e) => setDateFilter(e.target.value)}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
        />

        <EnquiryStatCards stats={ENQUIRY_STATS} />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No enquiries match your filters."
          itemLabel="enquiries"
          resetDeps={[search, centerFilter, dateFilter, typeFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>
    </div>
  )
}
