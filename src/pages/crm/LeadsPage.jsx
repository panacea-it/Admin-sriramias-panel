import { useCallback, useMemo, useState } from 'react'
import { FileSpreadsheet, Layers } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import LeadBulkUploadModal from '../../components/leads/LeadBulkUploadModal'
import LeadEditModal from '../../components/leads/LeadEditModal'
import LeadFilterToolbar from '../../components/leads/LeadFilterToolbar'
import LeadStatCards from '../../components/leads/LeadStatCards'
import LeadsTable from '../../components/leads/LeadsTable'
import LeadViewModal from '../../components/leads/LeadViewModal'
import CrmDeleteConfirmDialog from '../../components/crm/CrmDeleteConfirmDialog'
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
    Object.fromEntries(INITIAL_LEADS.map((row) => [row.id, ''])),
  )
  const [statusById, setStatusById] = useState(() =>
    Object.fromEntries(INITIAL_LEADS.map((row) => [row.id, ''])),
  )

  const counselorOptions = useMemo(
    () => [
      { value: '', label: 'Select Counselor', disabled: true },
      ...LEAD_COUNSELORS.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const statusOptions = useMemo(
    () => [
      { value: '', label: 'Select Status', disabled: true },
      ...LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatLeadStatusLabel(status),
      })),
    ],
    [],
  )

  const enrichLead = useCallback(
    (row) => ({
      ...row,
      assignedCounselor: counselorById[row.id] || '',
      status: statusById[row.id] || '',
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
      const rowStatus = statusById[row.id] || ''
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

  const handleView = useCallback((row) => setViewLead(enrichLead(row)), [enrichLead])
  const handleEdit = useCallback((row) => setEditLead(enrichLead(row)), [enrichLead])

  const emptyMessage = dateFilter
    ? 'No leads found for the selected date.'
    : 'No leads match your filters.'

  const tableResetDeps = [search, centerFilter, dateFilter, statusFilter]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Leads"
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

        <LeadsTable
          data={filtered}
          emptyMessage={emptyMessage}
          resetDeps={tableResetDeps}
          counselorById={counselorById}
          statusById={statusById}
          counselorOptions={counselorOptions}
          statusOptions={statusOptions}
          onCounselorChange={handleCounselorChange}
          onStatusChange={handleStatusChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={setDeleteLeadId}
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
