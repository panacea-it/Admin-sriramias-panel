import { useCallback, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import EnquiriesTable from '../../components/enquiries/EnquiriesTable'
import EnquiryEditModal from '../../components/enquiries/EnquiryEditModal'
import EnquiryEmptyState from '../../components/enquiries/EnquiryEmptyState'
import EnquiryFilterToolbar from '../../components/enquiries/EnquiryFilterToolbar'
import EnquiryStatCards from '../../components/enquiries/EnquiryStatCards'
import EnquiryViewModal from '../../components/enquiries/EnquiryViewModal'
import {
  ENQUIRY_COUNSELORS,
  ENQUIRY_STATS,
  ENQUIRY_LEAD_STATUS_OPTIONS,
  enquiryMatchesSelectedDate,
  formatEnquiryLeadStatusLabel,
  INITIAL_ENQUIRIES,
} from '../../data/enquiriesData'

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
  const [dateFilter, setDateFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [counselorById, setCounselorById] = useState(() =>
    Object.fromEntries(
      INITIAL_ENQUIRIES.map((row) => [row.id, row.assignedCounselor ?? '']),
    ),
  )
  const [leadStatusById, setLeadStatusById] = useState(() =>
    Object.fromEntries(INITIAL_ENQUIRIES.map((row) => [row.id, row.leadStatus ?? ''])),
  )

  const enrichEnquiry = useCallback(
    (row) => ({
      ...row,
      assignedCounselor:
        counselorById[row.id] || row.assignedCounselor || row.counselorName || '',
      leadStatus: leadStatusById[row.id] || row.leadStatus || '',
    }),
    [counselorById, leadStatusById],
  )

  const handleView = useCallback((row) => setViewRow(enrichEnquiry(row)), [enrichEnquiry])
  const handleEdit = useCallback((row) => setEditRow(enrichEnquiry(row)), [enrichEnquiry])

  const handleCounselorChange = useCallback((id, value) => {
    setCounselorById((prev) => ({ ...prev, [id]: value }))
    setEnquiries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, assignedCounselor: value } : row)),
    )
  }, [])

  const handleLeadStatusChange = useCallback((id, value) => {
    setLeadStatusById((prev) => ({ ...prev, [id]: value }))
    setEnquiries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, leadStatus: value } : row)),
    )
  }, [])

  const counselorOptions = useMemo(
    () => [
      { value: '', label: 'Select Counselor', disabled: true },
      ...ENQUIRY_COUNSELORS.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const leadStatusOptions = useMemo(
    () => [
      { value: '', label: 'Select Status', disabled: true },
      ...ENQUIRY_LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatEnquiryLeadStatusLabel(status),
      })),
    ],
    [],
  )

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
      const matchDate = enquiryMatchesSelectedDate(row.enquiryDate, dateFilter)
      const matchType = matchesType(row.enquiryType, typeFilter)
      return matchSearch && matchCenter && matchDate && matchType
    })
  }, [enquiries, search, centerFilter, dateFilter, typeFilter])

  const handleEditSave = useCallback(
    (form) => {
      if (!editRow) return
      setEnquiries((prev) =>
        prev.map((row) =>
          row.id === editRow.id
            ? {
                ...row,
                student: form.student.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                center: form.center,
                enquiryType: form.enquiryType,
                assignedCounselor: form.assignedCounselor,
                leadStatus: form.leadStatus,
              }
            : row,
        ),
      )
      setCounselorById((prev) => ({ ...prev, [editRow.id]: form.assignedCounselor }))
      setLeadStatusById((prev) => ({ ...prev, [editRow.id]: form.leadStatus }))
      toast.success('Enquiry updated successfully')
    },
    [editRow],
  )

  const emptyMessage = dateFilter
    ? 'No enquiries found for the selected date.'
    : 'No enquiries match your filters.'

  const tableResetDeps = [search, centerFilter, dateFilter, typeFilter]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
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
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
        />

        <EnquiryStatCards stats={ENQUIRY_STATS} />

        <EnquiriesTable
          data={filtered}
          emptyMessage={emptyMessage}
          emptyState={
            <EnquiryEmptyState
              message={
                dateFilter
                  ? 'No enquiries found for the selected date.'
                  : 'No enquiries match your filters. Try adjusting your search or filters.'
              }
            />
          }
          resetDeps={tableResetDeps}
          counselorById={counselorById}
          leadStatusById={leadStatusById}
          counselorOptions={counselorOptions}
          leadStatusOptions={leadStatusOptions}
          onCounselorChange={handleCounselorChange}
          onLeadStatusChange={handleLeadStatusChange}
          onView={handleView}
          onEdit={handleEdit}
        />
      </section>

      <EnquiryViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        enquiry={viewRow}
      />

      <EnquiryEditModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        enquiry={editRow}
        assignedCounselor={editRow?.assignedCounselor ?? ''}
        leadStatus={editRow?.leadStatus ?? ''}
        counselorOptions={counselorOptions}
        leadStatusOptions={leadStatusOptions}
        onSave={handleEditSave}
      />
    </div>
  )
}
