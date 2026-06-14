import { useCallback, useMemo, useState } from 'react'
import { FileSpreadsheet, Layers } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import LeadBulkUploadModal from '../../components/leads/LeadBulkUploadModal'
import LeadEditModal from '../../components/leads/LeadEditModal'
import LeadFilterToolbar from '../../components/leads/LeadFilterToolbar'
import LeadStatCards from '../../components/leads/LeadStatCards'
import LeadTableActions from '../../components/leads/LeadTableActions'
import LeadTableSelect from '../../components/leads/LeadTableSelect'
import LeadViewModal from '../../components/leads/LeadViewModal'
import CrmDeleteConfirmDialog from '../../components/crm/CrmDeleteConfirmDialog'
import { cn } from '../../utils/cn'
import { toast } from '@/utils/toast'
import { isSameCalendarDay } from '../../utils/dailyCollectionUtils'
import {
  formatLeadStatusLabel,
  INITIAL_LEADS,
  LEAD_COUNSELORS,
  LEAD_STATS,
  LEAD_STATUS_OPTIONS,
  parseLeadDisplayDate,
} from '../../data/leadsData'

function CourseCell({ course, courseSub }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span className="font-medium">{course}</span>
      {courseSub && <span className="text-xs text-[#686868]">{courseSub}</span>}
    </div>
  )
}

function DateCell({ time, date }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span>
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="text-xs text-[#686868]">{date}</span>
    </div>
  )
}

function PlaceholderText({ value }) {
  return <span className={cn(value === '—' && 'text-[#9ca0a8]')}>{value}</span>
}

function displayValue(value) {
  return value?.trim() ? value : '—'
}

function parseCourseVisited(courseVisited) {
  const trimmed = courseVisited.trim()
  if (!trimmed) return { course: '—', courseSub: '' }
  const words = trimmed.split(/\s+/)
  if (words.length <= 2) return { course: trimmed, courseSub: '' }
  return { course: words.slice(0, 2).join(' '), courseSub: words.slice(2).join(' ') }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(INITIAL_LEADS)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewLead, setViewLead] = useState(null)
  const [editLead, setEditLead] = useState(null)
  const [deleteLeadId, setDeleteLeadId] = useState(null)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [counselorById, setCounselorById] = useState(() =>
    Object.fromEntries(
      INITIAL_LEADS.map((row) => [row.id, row.assignedCounselor || LEAD_COUNSELORS[0]]),
    ),
  )
  const [statusById, setStatusById] = useState(() =>
    Object.fromEntries(INITIAL_LEADS.map((row) => [row.id, row.status || 'NEW'])),
  )

  const counselorOptions = useMemo(
    () => LEAD_COUNSELORS.map((name) => ({ value: name, label: name })),
    [],
  )

  const statusOptions = useMemo(
    () =>
      LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatLeadStatusLabel(status),
      })),
    [],
  )

  const enrichLead = useCallback(
    (row) => ({
      ...row,
      assignedCounselor: counselorById[row.id] || LEAD_COUNSELORS[0],
      status: statusById[row.id] || 'NEW',
    }),
    [counselorById, statusById],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((row) => {
      const userName = row.userName?.toLowerCase() || ''
      const matchSearch = !q || userName.includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchDate =
        !dateFilter ||
        (() => {
          const leadDate = parseLeadDisplayDate(row.date)
          return leadDate && isSameCalendarDay(leadDate, dateFilter)
        })()
      const rowStatus = statusById[row.id] || row.status || 'NEW'
      const matchStatus = statusFilter === 'all' || rowStatus === statusFilter
      return matchSearch && matchCenter && matchDate && matchStatus
    })
  }, [leads, search, centerFilter, dateFilter, statusFilter, statusById])

  const handleCounselorChange = useCallback((leadId, value) => {
    setCounselorById((prev) => ({ ...prev, [leadId]: value }))
  }, [])

  const handleStatusChange = useCallback((leadId, value) => {
    setStatusById((prev) => ({ ...prev, [leadId]: value }))
  }, [])

  const handleEditSave = useCallback((leadId, form) => {
    const { course, courseSub } = parseCourseVisited(form.courseVisited)
    setLeads((prev) =>
      prev.map((row) =>
        row.id === leadId
          ? {
              ...row,
              userName: displayValue(form.userName),
              email: displayValue(form.email),
              mobile: displayValue(form.mobile),
              course,
              courseSub,
            }
          : row,
      ),
    )
    setCounselorById((prev) => ({ ...prev, [leadId]: form.assignedCounselor }))
    setStatusById((prev) => ({ ...prev, [leadId]: form.status }))
  }, [])

  const handleConfirmDeleteLead = useCallback(() => {
    if (deleteLeadId == null) return
    setLeads((prev) => prev.filter((row) => row.id !== deleteLeadId))
    setCounselorById((prev) => {
      const next = { ...prev }
      delete next[deleteLeadId]
      return next
    })
    setStatusById((prev) => {
      const next = { ...prev }
      delete next[deleteLeadId]
      return next
    })
    toast.success('Lead deleted successfully')
    setDeleteLeadId(null)
  }, [deleteLeadId])

  const columns = useMemo(
    () => [
      {
        key: 'userName',
        label: 'User Name',
        align: 'center',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'align-middle text-left',
        render: (row) => <PlaceholderText value={row.userName} />,
      },
      {
        key: 'email',
        label: 'Email ID',
        align: 'center',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'align-middle text-left',
        render: (row) => <PlaceholderText value={row.email} />,
      },
      {
        key: 'mobile',
        label: 'Mobile Number',
        align: 'center',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
        render: (row) => <PlaceholderText value={row.mobile} />,
      },
      {
        key: 'course',
        label: 'Course Visited',
        align: 'center',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'align-middle text-left min-w-[140px]',
        render: (row) => <CourseCell course={row.course} courseSub={row.courseSub} />,
      },
      {
        key: 'date',
        label: 'Date',
        align: 'center',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'align-middle text-left min-w-[120px] whitespace-nowrap',
        render: (row) => <DateCell time={row.time} date={row.date} />,
      },
      {
        key: 'assignedCounselor',
        label: 'Assigned Counselor',
        align: 'center',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'align-middle text-left',
        render: (row) => (
          <LeadTableSelect
            value={counselorById[row.id] || LEAD_COUNSELORS[0]}
            onChange={(e) => handleCounselorChange(row.id, e.target.value)}
            options={counselorOptions}
            ariaLabel={`Assigned counselor for ${row.userName}`}
            compact
          />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[170px]',
        cellClassName: 'align-middle text-left',
        render: (row) => (
          <LeadTableSelect
            value={statusById[row.id] || 'NEW'}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            options={statusOptions}
            ariaLabel={`Status for ${row.userName}`}
          />
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'align-middle text-center',
        render: (row) => (
          <LeadTableActions
            onView={() => setViewLead(enrichLead(row))}
            onEdit={() => setEditLead(enrichLead(row))}
            onDelete={() => setDeleteLeadId(row.id)}
          />
        ),
      },
    ],
    [
      counselorById,
      statusById,
      counselorOptions,
      statusOptions,
      handleCounselorChange,
      handleStatusChange,
      enrichLead,
    ],
  )

  const emptyMessage = dateFilter
    ? 'No leads found for the selected date.'
    : 'No leads match your filters.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#55ace7]"
          title="Leads"
          className="from-[#55ace7] via-[#7eb3d4] to-[#df8284]"
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

        <LeadFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <LeadStatCards stats={LEAD_STATS} />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          itemLabel="leads"
          resetDeps={[search, centerFilter, dateFilter, statusFilter]}
          rowClassName="transition-colors duration-200"
          zebraStriping
          stickyHeader
          density="comfortable"
          tableMinWidth={1100}
          gradientActivePage
          className="overflow-hidden rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
          tableClassName="rounded-xl"
          paginationClassName="rounded-b-xl bg-slate-50/50"
        />
      </section>

      <LeadViewModal
        open={Boolean(viewLead)}
        onClose={() => setViewLead(null)}
        lead={viewLead}
      />

      <LeadEditModal
        open={Boolean(editLead)}
        onClose={() => setEditLead(null)}
        lead={editLead}
        counselorOptions={counselorOptions}
        statusOptions={statusOptions}
        onSave={handleEditSave}
      />

      <CrmDeleteConfirmDialog
        open={deleteLeadId != null}
        onCancel={() => setDeleteLeadId(null)}
        onConfirm={handleConfirmDeleteLead}
      />

      <LeadBulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
      />
    </div>
  )
}
