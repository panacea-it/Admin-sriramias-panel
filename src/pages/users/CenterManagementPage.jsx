import { useCallback, useMemo, useState } from "react";
import { Ban, Building2, CheckCircle2, Eye, Pencil, Plus } from 'lucide-react';
import ErrorState from "../../components/feedback/ErrorState";
import { toast } from "@/utils/toast";
import PageBanner from "../../components/figma/PageBanner";
import CourseFilterToolbar from "../../components/courses/CourseFilterToolbar";
import CenterFormDrawer from "../../components/center-management/CenterFormDrawer";
import ViewCenterDrawer from "../../components/center-management/ViewCenterDrawer";
import ConfirmCenterStatusModal from "../../components/center-management/ConfirmCenterStatusModal";
import CenterBulkActionsBar from "../../components/center-management/CenterBulkActionsBar";
import CenterManagementTable from "../../components/center-management/CenterManagementTable";
import { useCenters } from "../../contexts/CentersContext";
import { useCenterManagement } from "../../hooks/useCenterManagement";
import { useTableRowSelection } from "../../hooks/useTableRowSelection";
import { useInitialRouteSearch } from "../../hooks/useInitialRouteSearch";
import { getApiErrorMessage } from "../../utils/apiError";
import { cn } from "../../utils/cn";
import {
  buildUpdateCenterPayloadFromPatch,
  deleteCenter as deleteCenterApi,
  updateCenter as updateCenterApi,
  updateCenterStatus,
} from "../../services/centerService";

const CENTER_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Deactivated" },
];

const actionButtonClass =
  "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5";

function CenterTableActions({ row, onView, onEdit, onStatusToggle }) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label={`View ${row.centerName}`}
        className={cn(
          actionButtonClass,
          "text-slate-500 hover:bg-slate-100 hover:text-[#246392]",
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${row.centerName}`}
        className={cn(
          actionButtonClass,
          "text-slate-500 hover:bg-slate-100 hover:text-[#246392]",
        )}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={onStatusToggle}
        title={row.status === "active" ? "Disable" : "Enable"}
        aria-label={
          row.status === "active"
            ? `Disable ${row.centerName}`
            : `Enable ${row.centerName}`
        }
        className={cn(
          actionButtonClass,
          row.status === "active"
            ? "text-rose-600 hover:bg-rose-50"
            : "text-emerald-600 hover:bg-emerald-50",
        )}
      >
        {row.status === "active" ? (
          <Ban className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="hidden sm:inline">
          {row.status === "active" ? "Disable" : "Enable"}
        </span>
      </button>
    </div>
  );
}

export default function CenterManagementPage() {
  const { createCenter } = useCenters();
  const {
    centers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshCenters,
    patchCenterLocally,
    removeCenterLocally,
  } = useCenterManagement();

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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [bulkDisableIds, setBulkDisableIds] = useState(null);
  const [bulkEnableIds, setBulkEnableIds] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const controlledPagination = useMemo(
    () => ({
      ...pagination,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination, setPage, setPageSize],
  );

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

  const handleCreateSuccess = useCallback(
    (mapped) => {
      createCenter(mapped);
      refreshCenters();
    },
    [createCenter, refreshCenters],
  );

  const handleUpdateCenter = useCallback(
    async (centerId, patch) => {
      const payload = buildUpdateCenterPayloadFromPatch(patch);
      await updateCenterApi(centerId, payload);
      toast.success("Center updated successfully");
      await refreshCenters();
    },
    [refreshCenters],
  );

  const handleStatusToggleRequest = (row) => {
    setStatusTarget(row);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const enabling = statusTarget.status !== "active";
    const nextStatus = enabling ? "active" : "disabled";
    const apiStatus = enabling ? "ACTIVE" : "DISABLED";

    setStatusLoading(true);
    patchCenterLocally(statusTarget.centerId, { status: nextStatus });

    try {
      await updateCenterStatus(statusTarget.centerId, apiStatus);
      toast.success(enabling ? "Center enabled" : "Center disabled");
      setStatusTarget(null);
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      patchCenterLocally(statusTarget.centerId, {
        status: statusTarget.status,
      });
      toast.error(getApiErrorMessage(error, "Failed to update center status"));
    } finally {
      setStatusLoading(false);
    }
  };

  const confirmBulkDisable = async () => {
    if (!bulkDisableIds?.length) return;

    const targets = centers.filter(
      (row) => bulkDisableIds.includes(row.centerId) && row.status === "active",
    );

    if (!targets.length) {
      setBulkDisableIds(null);
      return;
    }

    setStatusLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of targets) {
      patchCenterLocally(row.centerId, { status: "disabled" });
      try {
        await updateCenterStatus(row.centerId, "DISABLED");
        successCount += 1;
      } catch (error) {
        failCount += 1;
        patchCenterLocally(row.centerId, { status: row.status });
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "Center disabled"
          : `${successCount} centers disabled`,
      );
    }
    if (failCount > 0) {
      toast.error(
        failCount === 1
          ? "Failed to disable 1 center"
          : `Failed to disable ${failCount} centers`,
      );
    }

    setBulkDisableIds(null);
    clearSelection();
    await refreshCenters();
    setStatusLoading(false);
  };

  const confirmBulkEnable = async () => {
    if (!bulkEnableIds?.length) return;

    const targets = centers.filter(
      (row) =>
        bulkEnableIds.includes(row.centerId) && row.status === "disabled",
    );

    if (!targets.length) {
      setBulkEnableIds(null);
      return;
    }

    setStatusLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of targets) {
      patchCenterLocally(row.centerId, { status: "active" });
      try {
        await updateCenterStatus(row.centerId, "ACTIVE");
        successCount += 1;
      } catch (error) {
        failCount += 1;
        patchCenterLocally(row.centerId, { status: row.status });
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "Center enabled"
          : `${successCount} centers enabled`,
      );
    }
    if (failCount > 0) {
      toast.error(
        failCount === 1
          ? "Failed to enable 1 center"
          : `Failed to enable ${failCount} centers`,
      );
    }

    setBulkEnableIds(null);
    clearSelection();
    await refreshCenters();
    setStatusLoading(false);
  };

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      setDeleteLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (const centerId of bulkDeleteIds) {
        try {
          await deleteCenterApi(centerId);
          removeCenterLocally(centerId);
          successCount += 1;
        } catch (error) {
          failCount += 1;
          if (import.meta.env.DEV) {
            console.error(error);
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Center deleted"
            : `${successCount} centers deleted`,
        );
      }
      if (failCount > 0) {
        toast.error(
          failCount === 1
            ? "Unable to delete 1 center"
            : `Unable to delete ${failCount} centers`,
        );
      }

      setBulkDeleteIds(null);
      clearSelection();
      await refreshCenters();
      setDeleteLoading(false);
      return;
    }

    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCenterApi(deleteTarget.centerId);
      removeCenterLocally(deleteTarget.centerId);
      toast.success("Center deleted");
      setDeleteTarget(null);
      await refreshCenters();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(getApiErrorMessage(error, "Unable to delete center"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRowActions = useCallback(
    (row) => (
      <CenterTableActions
        row={row}
        onView={() => setViewingId(row.centerId)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => handleStatusToggleRequest(row)}
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
            searchPlaceholder="Search centers by name, code, city, admin…"
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
              resetDeps={[search, statusFilter]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              renderActions={renderRowActions}
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
    </div>
  );
}
