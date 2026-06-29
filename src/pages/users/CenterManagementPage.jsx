import { useCallback, useMemo, useState } from "react";
import { Ban, Building2, CheckCircle2, Plus } from 'lucide-react';
import ErrorState from "../../components/feedback/ErrorState";
import { toast } from "@/utils/toast";
import PageBanner from "../../components/figma/PageBanner";
import CourseFilterToolbar from "../../components/courses/CourseFilterToolbar";
import CenterFormDrawer from "../../components/center-management/CenterFormDrawer";
import ViewCenterDrawer from "../../components/center-management/ViewCenterDrawer";
import ConfirmCenterStatusModal from "../../components/center-management/ConfirmCenterStatusModal";
import ConfirmCenterDeleteModal from "../../components/center-management/ConfirmCenterDeleteModal";
import CenterBulkActionsBar from "../../components/center-management/CenterBulkActionsBar";
import CenterManagementTable from "../../components/center-management/CenterManagementTable";
import ViewButton from "../../components/common/ViewButton";
import EditButton from "../../components/common/EditButton";
import IconActionButton from "../../components/common/IconActionButton";
import { useCenterManagement } from "../../hooks/useCenterManagement";
import { useTableRowSelection } from "../../hooks/useTableRowSelection";
import { useInitialRouteSearch } from "../../hooks/useInitialRouteSearch";
import { useUpdateCenterStatus } from "../../hooks/center/useUpdateCenterStatus";
import { useBulkUpdateCenterStatus } from "../../hooks/center/useBulkUpdateCenterStatus";
import { useDeleteCenter } from "../../hooks/center/useDeleteCenter";
import { getApiErrorMessage } from "../../utils/apiError";
import { cn } from "../../utils/cn";
import { TABLE_ACTIONS_WRAP } from "../../utils/tableColumnHelpers";

const CENTER_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

function CenterTableActions({ row, onView, onEdit, onStatusToggle }) {
  const isActive = row.status === "active";

  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton onClick={onView} label={`View ${row.centerName}`} />
      <EditButton onClick={onEdit} label={`Edit ${row.centerName}`} />
      <IconActionButton
        label={isActive ? `Disable ${row.centerName}` : `Enable ${row.centerName}`}
        onClick={onStatusToggle}
        className={cn(
          isActive
            ? "text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700"
            : "text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        {isActive ? (
          <Ban className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        ) : (
          <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        )}
      </IconActionButton>
    </div>
  );
}

export default function CenterManagementPage() {
  const {
    centers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshCenters,
  } = useCenterManagement();

  const statusMutation = useUpdateCenterStatus();
  const bulkStatusMutation = useBulkUpdateCenterStatus();
  const deleteMutation = useDeleteCenter();

  useInitialRouteSearch(setSearch);

  const { selectedIds, selection, clearSelection } = useTableRowSelection(
    (row) => row.centerId,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [bulkDisableIds, setBulkDisableIds] = useState(null);
  const [bulkEnableIds, setBulkEnableIds] = useState(null);

  const selectedActiveIds = useMemo(
    () =>
      centers
        .filter(
          (c) => selectedIds.includes(c.centerId) && c.status === "active",
        )
        .map((c) => c.centerId),
    [centers, selectedIds],
  );

  const selectedDisabledIds = useMemo(
    () =>
      centers
        .filter(
          (c) => selectedIds.includes(c.centerId) && c.status === "disabled",
        )
        .map((c) => c.centerId),
    [centers, selectedIds],
  );

  const selectedActiveCount = selectedActiveIds.length;
  const selectedDisabledCount = selectedDisabledIds.length;

  const statusLoading = statusMutation.isPending || bulkStatusMutation.isPending;
  const deleteLoading = deleteMutation.isPending;

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setFormMode("edit");
    setEditing(row);
    setFormOpen(true);
  };

  const handleCreateSuccess = useCallback(async () => {
    await refreshCenters();
  }, [refreshCenters]);

  const handleUpdateCenter = useCallback(async () => {
    await refreshCenters();
  }, [refreshCenters]);

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const enabling = statusTarget.status !== "active";
    const apiStatus = enabling ? "ACTIVE" : "DISABLED";

    try {
      const response = await statusMutation.mutateAsync({
        id: statusTarget.centerId,
        status: apiStatus,
      });
      toast.success(response?.message || (enabling ? "Center enabled" : "Center disabled"));
      setStatusTarget(null);
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(getApiErrorMessage(error, "Failed to update center status"));
    }
  };

  const confirmBulkDisable = async () => {
    if (!bulkDisableIds?.length) return;

    try {
      const response = await bulkStatusMutation.mutateAsync({
        centerIds: bulkDisableIds,
        status: "DISABLED",
      });
      toast.success(
        response?.message ||
          `${response?.updatedCount ?? bulkDisableIds.length} center(s) disabled`,
      );
      setBulkDisableIds(null);
      clearSelection();
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(getApiErrorMessage(error, "Failed to disable centers"));
    }
  };

  const confirmBulkEnable = async () => {
    if (!bulkEnableIds?.length) return;

    try {
      const response = await bulkStatusMutation.mutateAsync({
        centerIds: bulkEnableIds,
        status: "ACTIVE",
      });
      toast.success(
        response?.message ||
          `${response?.updatedCount ?? bulkEnableIds.length} center(s) enabled`,
      );
      setBulkEnableIds(null);
      clearSelection();
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(getApiErrorMessage(error, "Failed to enable centers"));
    }
  };

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      let successCount = 0;
      let failCount = 0;

      for (const centerId of bulkDeleteIds) {
        try {
          await deleteMutation.mutateAsync(centerId);
          successCount += 1;
        } catch (error) {
          failCount += 1;
          if (import.meta.env.DEV) {
            console.error(error);
          }
          const message = getApiErrorMessage(error, "Unable to delete center");
          toast.error(message);
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Center deleted"
            : `${successCount} centers deleted`,
        );
      }

      setBulkDeleteIds(null);
      clearSelection();
      await refreshCenters();
      return;
    }

    if (!deleteTarget) return;

    try {
      const response = await deleteMutation.mutateAsync(deleteTarget.centerId);
      toast.success(response?.message || "Center deleted");
      setDeleteTarget(null);
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      const message = getApiErrorMessage(error, "Unable to delete center");
      if (message.toLowerCase().includes("active course")) {
        toast.error(`${message} Consider disabling the centre instead.`);
      } else {
        toast.error(message);
      }
    }
  };

  const renderRowActions = useCallback(
    (row) => (
      <CenterTableActions
        row={row}
        onView={() => setViewingId(row.centerId)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => setStatusTarget(row)}
      />
    ),
    [],
  );

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "all");

  const emptyMessage = hasActiveFilters
    ? "No centers match your filters."
    : "No centers to display";

  const emptyState = hasActiveFilters ? undefined : (
    <div className="px-4 py-6 sm:px-6">
      <ErrorState
        title="No centers to display"
        message="If you expected data here, the server may be unavailable. Try loading again or create a new center."
        onRetry={refreshCenters}
      />
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Center
        </button>
      </div>
    </div>
  );

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={Building2} title="Center Management">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Create Center
          </button>
        </PageBanner>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <CourseFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder="Search by name, code, or city"
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            statusOptions={CENTER_STATUS_OPTIONS}
            disabled={loading && centers.length === 0}
          />

          {selectedIds.length > 0 && (
            <CenterBulkActionsBar
              className="mt-4"
              count={selectedIds.length}
              disableCount={selectedActiveCount}
              selectedDisabledCount={selectedDisabledCount}
              onDisable={() => setBulkDisableIds(selectedActiveIds)}
              onEnable={() => setBulkEnableIds(selectedDisabledIds)}
              onDelete={() => setBulkDeleteIds([...selectedIds])}
            />
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <CenterManagementTable
              centers={centers}
              loading={loading}
              controlledPagination={controlledPagination}
              selection={selection}
              resetDeps={[search, statusFilter, sortBy, sortOrder]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              renderActions={renderRowActions}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </div>
      </section>

      <CenterFormDrawer
        open={formOpen}
        mode={formMode}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreateSuccess}
        onUpdate={handleUpdateCenter}
      />

      <ViewCenterDrawer
        open={!!viewingId}
        centerId={viewingId}
        onClose={() => setViewingId(null)}
      />

      <ConfirmCenterStatusModal
        open={
          !!statusTarget || !!bulkDisableIds?.length || !!bulkEnableIds?.length
        }
        centerName={statusTarget?.centerName}
        bulkCount={bulkDisableIds?.length || bulkEnableIds?.length || 0}
        enabling={
          bulkEnableIds?.length
            ? true
            : bulkDisableIds?.length
              ? false
              : statusTarget?.status !== "active"
        }
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) {
            setStatusTarget(null);
            setBulkDisableIds(null);
            setBulkEnableIds(null);
          }
        }}
        onConfirm={
          bulkEnableIds?.length
            ? confirmBulkEnable
            : bulkDisableIds?.length
              ? confirmBulkDisable
              : confirmStatusChange
        }
      />

      <ConfirmCenterDeleteModal
        open={!!deleteTarget || !!bulkDeleteIds?.length}
        centerName={deleteTarget?.centerName}
        bulkCount={bulkDeleteIds?.length || 0}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setBulkDeleteIds(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
