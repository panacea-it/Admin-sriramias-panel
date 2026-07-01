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
import { useEnquiryManagement } from '../../hooks/enquiries/useEnquiryManagement'

export default function EnquiriesPage() {
  const {
    enquiries,
    stats,
    loading,
    statsLoading,
    loadError,
    search,
    setSearch,
    centerFilter,
    setCenterFilter,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    sourcePageFilter,
    setSourcePageFilter,
    centerOptions,
    leadStatusOptions,
    counselorsByCenterId,
    fetchCounselorsForCenter,
    controlledPagination,
    statusMutation,
    assignMutation,
    fetchDetails,
    tableResetDeps,
  } = useEnquiryManagement()

  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [editCounselorOptions, setEditCounselorOptions] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  const handleView = useCallback(
    async (row) => {
      setDetailsLoading(true)
      try {
        const details = await fetchDetails(row.id)
        setViewRow(details || row)
      } catch {
        toast.error('Failed to load enquiry details')
        setViewRow(row)
      } finally {
        setDetailsLoading(false)
      }
    },
    [fetchDetails],
  )

  const handleEdit = useCallback(
    async (row) => {
      setEditRow(row)
      try {
        const options = await fetchCounselorsForCenter(row.centerId)
        setEditCounselorOptions(options)
      } catch {
        setEditCounselorOptions(
          counselorsByCenterId[row.centerId] || [
            { value: '', label: 'Select Counselor', disabled: true },
          ],
        )
      }
    },
    [counselorsByCenterId, fetchCounselorsForCenter],
  )

  const handleCounselorChange = useCallback(
    async (id, counselorId) => {
      if (!counselorId) return
      try {
        await assignMutation.mutateAsync({ enquiryId: id, counselorId })
        toast.success('Counselor assigned successfully')
      } catch (error) {
        toast.error(
          error?.response?.data?.message || 'Failed to assign counselor',
        )
      }
    },
    [assignMutation],
  )

  const handleLeadStatusChange = useCallback(
    async (id, leadStatus) => {
      if (!leadStatus) return
      try {
        await statusMutation.mutateAsync({ enquiryId: id, leadStatus })
        toast.success('Status updated successfully')
      } catch (error) {
        toast.error(
          error?.response?.data?.message || 'Failed to update status',
        )
      }
    },
    [statusMutation],
  )

  const handleEditSave = useCallback(
    async (form) => {
      if (!editRow) return

      try {
        const tasks = []

        if (form.assignedCounselor && form.assignedCounselor !== editRow.assignedCounselor) {
          tasks.push(
            assignMutation.mutateAsync({
              enquiryId: editRow.id,
              counselorId: form.assignedCounselor,
            }),
          )
        }

        if (form.leadStatus && form.leadStatus !== editRow.leadStatus) {
          tasks.push(
            statusMutation.mutateAsync({
              enquiryId: editRow.id,
              leadStatus: form.leadStatus,
            }),
          )
        }

        if (tasks.length === 0) {
          toast.info('No changes to save')
          setEditRow(null)
          return
        }

        await Promise.all(tasks)
        toast.success('Enquiry updated successfully')
        setEditRow(null)
      } catch (error) {
        toast.error(
          error?.response?.data?.message || 'Failed to update enquiry',
        )
      }
    },
    [assignMutation, editRow, statusMutation],
  )

  const emptyMessage = useMemo(() => {
    if (loadError) return 'Unable to load enquiries. Please try again.'
    if (dateFilter) return 'No enquiries found for the selected date.'
    return 'No enquiries match your filters.'
  }, [dateFilter, loadError])

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
          centerOptions={centerOptions}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
          sourcePage={sourcePageFilter}
          onSourcePageChange={(e) => setSourcePageFilter(e.target.value)}
        />

        <EnquiryStatCards stats={stats} loading={statsLoading} />

        <EnquiriesTable
          data={enquiries}
          loading={loading}
          emptyMessage={emptyMessage}
          emptyState={
            <EnquiryEmptyState
              message={
                loadError
                  ? 'Unable to load enquiries. Please refresh or adjust your filters.'
                  : dateFilter
                    ? 'No enquiries found for the selected date.'
                    : 'No enquiries match your filters. Try adjusting your search or filters.'
              }
            />
          }
          resetDeps={tableResetDeps}
          counselorsByCenterId={counselorsByCenterId}
          leadStatusOptions={leadStatusOptions}
          onCounselorChange={handleCounselorChange}
          onLeadStatusChange={handleLeadStatusChange}
          onView={handleView}
          onEdit={handleEdit}
          controlledPagination={controlledPagination}
          counselorAssigning={assignMutation.isPending}
          statusUpdating={statusMutation.isPending}
        />
      </section>

      <EnquiryViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        enquiry={viewRow}
        loading={detailsLoading}
      />

      {editRow && (
        <EnquiryEditModal
          open={Boolean(editRow)}
          onClose={() => setEditRow(null)}
          enquiry={editRow}
          assignedCounselor={editRow.assignedCounselor ?? ''}
          leadStatus={editRow.leadStatus ?? ''}
          counselorOptions={
            editCounselorOptions.length
              ? editCounselorOptions
              : counselorsByCenterId[editRow.centerId] || [
                  { value: '', label: 'Select Counselor', disabled: true },
                ]
          }
          leadStatusOptions={leadStatusOptions}
          onSave={handleEditSave}
          saving={assignMutation.isPending || statusMutation.isPending}
        />
      )}
    </div>
  )
}
