import { useCallback, useMemo, useState } from 'react'
import { FileSpreadsheet, Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EnquiryBulkUploadModal from '../../components/enquiries/EnquiryBulkUploadModal'
import EnquiryCounselorSelect from '../../components/enquiries/EnquiryCounselorSelect'
import EnquiryEditModal from '../../components/enquiries/EnquiryEditModal'
import EnquiryEmptyState from '../../components/enquiries/EnquiryEmptyState'
import EnquiryFilterToolbar from '../../components/enquiries/EnquiryFilterToolbar'
import EnquiryLeadStatusSelect from '../../components/enquiries/EnquiryLeadStatusSelect'
import EnquiryStatCards from '../../components/enquiries/EnquiryStatCards'
import EnquiryTableActions from '../../components/enquiries/EnquiryTableActions'
import EnquiryViewModal from '../../components/enquiries/EnquiryViewModal'
import {
  ENQUIRY_COUNSELORS,
  ENQUIRY_LEAD_STATUS_OPTIONS,
  ENQUIRY_STATS,
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
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [counselorById, setCounselorById] = useState(() =>
    Object.fromEntries(
      INITIAL_ENQUIRIES.map((row) => [row.id, row.assignedCounselor || ENQUIRY_COUNSELORS[0]]),
    ),
  )
  const [leadStatusById, setLeadStatusById] = useState(() =>
    Object.fromEntries(
      INITIAL_ENQUIRIES.map((row) => [row.id, row.leadStatus || 'NEW']),
    ),
  )

  const handleOpenStatusChange = useCallback((id, nextStatus) => {
    setEnquiries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)),
    )
  }, [])

  const handleCounselorChange = useCallback((id, value) => {
    setCounselorById((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleLeadStatusChange = useCallback((id, value) => {
    setLeadStatusById((prev) => ({ ...prev, [id]: value }))
  }, [])

  const counselorOptions = useMemo(
    () => ENQUIRY_COUNSELORS.map((name) => ({ value: name, label: name })),
    [],
  )

  const leadStatusOptions = useMemo(
    () =>
      ENQUIRY_LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatEnquiryLeadStatusLabel(status),
      })),
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

  const columns = useMemo(
    () => [
      {
        key: 'student',
        label: 'Student',
        align: 'center',
        headerClassName: 'min-w-[130px] pl-5 sm:pl-6',
        cellClassName: 'align-middle text-left pl-5 sm:pl-6',
        render: (row) => <span className="truncate font-medium">{row.student}</span>,
      },
      {
        key: 'contact',
        label: 'Contact Details',
        align: 'center',
        headerClassName: 'min-w-[190px]',
        cellClassName: 'align-middle text-left',
        render: (row) => (
          <span className="block max-w-[220px] truncate text-sm leading-snug sm:max-w-[260px] sm:text-base">
            {row.email} <span className="text-[#9ca0a8]">|</span> {row.phone}
          </span>
        ),
      },
      {
        key: 'enquiryType',
        label: 'Enquiry Type',
        align: 'center',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'center',
        label: 'Center',
        align: 'center',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'enquiryDate',
        label: 'Enquiry Date',
        align: 'center',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'assignedCounselor',
        label: 'Assigned Counselor',
        align: 'center',
        headerClassName: 'min-w-[170px]',
        cellClassName: 'align-middle text-left',
        render: (row) => (
          <EnquiryCounselorSelect
            value={counselorById[row.id] || ENQUIRY_COUNSELORS[0]}
            onChange={(value) => handleCounselorChange(row.id, value)}
            options={counselorOptions}
          />
        ),
      },
      {
        key: 'leadStatus',
        label: 'Lead Status',
        align: 'center',
        headerClassName: 'min-w-[170px]',
        cellClassName: 'align-middle text-left',
        render: (row) => (
          <EnquiryLeadStatusSelect
            value={leadStatusById[row.id] || 'NEW'}
            onChange={(value) => handleLeadStatusChange(row.id, value)}
            options={leadStatusOptions}
          />
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'min-w-[220px] pr-5 sm:pr-6',
        cellClassName: 'align-middle text-center pr-5 sm:pr-6',
        render: (row) => (
          <EnquiryTableActions
            status={row.status}
            onStatusChange={(nextStatus) => handleOpenStatusChange(row.id, nextStatus)}
            onView={() => setViewRow(row)}
            onEdit={() => setEditRow(row)}
          />
        ),
      },
    ],
    [
      counselorById,
      leadStatusById,
      counselorOptions,
      leadStatusOptions,
      handleCounselorChange,
      handleLeadStatusChange,
      handleOpenStatusChange,
    ],
  )

  const emptyMessage = dateFilter
    ? 'No enquiries found for the selected date.'
    : 'No enquiries match your filters.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Enquiries"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className="inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(3,4,94,0.4)] active:scale-[0.98] sm:px-5"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Bulk Upload
          </button>
        </PageBanner>

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

        <PaginatedFigmaTable
          columns={columns}
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
          itemLabel="enquiries"
          resetDeps={[search, centerFilter, dateFilter, typeFilter]}
          rowClassName="min-h-[56px] transition-colors duration-200 hover:bg-[#eef6fc]/60"
          zebraStriping
          stickyHeader
          density="default"
          tableMinWidth={1180}
          gradientActivePage
          className="overflow-hidden rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
          tableClassName="rounded-xl"
          paginationClassName="rounded-b-xl bg-slate-50/50"
        />
      </section>

      <EnquiryViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        enquiry={viewRow}
        assignedCounselor={viewRow ? counselorById[viewRow.id] : ''}
        leadStatus={viewRow ? leadStatusById[viewRow.id] : 'NEW'}
      />

      <EnquiryEditModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        enquiry={editRow}
        assignedCounselor={editRow ? counselorById[editRow.id] : ''}
        leadStatus={editRow ? leadStatusById[editRow.id] : 'NEW'}
        counselorOptions={counselorOptions}
        leadStatusOptions={leadStatusOptions}
        onSave={handleEditSave}
      />

      <EnquiryBulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
      />
    </div>
  )
}
