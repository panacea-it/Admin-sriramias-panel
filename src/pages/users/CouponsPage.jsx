import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Star } from "lucide-react";
import { toast } from "@/utils/toast";
import PageBanner from "../../components/figma/PageBanner";
import PaginatedFigmaTable from "../../components/figma/PaginatedFigmaTable";
import CouponFilterToolbar from "../../components/coupons/CouponFilterToolbar";
import AddCouponModal from "../../components/coupons/AddCouponModal";
import CouponTableActions from "../../components/coupons/CouponTableActions";
import CouponsBulkActionsBar from "../../components/coupons/CouponsBulkActionsBar";
import ConfirmCouponDeleteModal from "../../components/coupons/ConfirmCouponDeleteModal";
import ViewCouponModal from "../../components/coupons/ViewCouponModal";
import {
  BannerButton,
  StatusBadge,
} from "../../components/academics/AcademicsUi";
import { useTableRowSelection } from "../../hooks/useTableRowSelection";
import {
  createCoupon,
  loadCoupons,
  updateCoupon,
} from "../../utils/couponsStorage";
import {
  deleteAdminCoupon,
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
} from "../../api/couponsAPI";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(() => loadCoupons());
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [viewingCoupon, setViewingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionCouponId, setActionCouponId] = useState(null);

  const { selectedIds, selection, clearSelection } = useTableRowSelection(
    (row) => row.id,
  );

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadCouponsFromApi = async () => {
      try {
        setLoadingCoupons(true);
        const rows =
          categoryFilter && categoryFilter !== "all"
            ? await (
                await import("../../api/couponsAPI")
              ).fetchCouponsByCategory(categoryFilter, controller.signal)
            : await fetchAdminCoupons(controller.signal);
        if (mounted) setCoupons(rows);
      } catch (error) {
        if (mounted && !controller.signal.aborted) {
          console.error("Failed to load admin coupons:", error);
          toast.error("Unable to load coupons from the server.");
          setCoupons(loadCoupons());
        }
      } finally {
        if (mounted) setLoadingCoupons(false);
      }
    };

    loadCouponsFromApi();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [categoryFilter]);

  const refresh = useCallback(async () => {
    try {
      const rows =
        categoryFilter && categoryFilter !== "all"
          ? await (
              await import("../../api/couponsAPI")
            ).fetchCouponsByCategory(categoryFilter)
          : await fetchAdminCoupons();
      setCoupons(rows);
    } catch (error) {
      console.error("Failed to refresh coupons:", error);
      setCoupons(loadCoupons());
    }
  }, [categoryFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((row) => {
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || row.type === typeFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [coupons, search, typeFilter, statusFilter]);

  const selectedActiveCount = useMemo(
    () =>
      coupons.filter((c) => selectedIds.includes(c.id) && c.status === "Active")
        .length,
    [coupons, selectedIds],
  );

  const handleAddOrUpdate = async (form, editing) => {
    const targetId = editing
      ? editing._id || editing.id || editing.couponId
      : null;

    try {
      if (editing) {
        await updateAdminCoupon(targetId, form);
        toast.success("Coupon updated successfully");
      } else {
        await createAdminCoupon(form);
        toast.success("Coupon created successfully");
      }
      setAddOpen(false);
      await refresh();
    } catch (err) {
      // EXACT ERROR CAPTURE: Extract backend validation strings
      const backendError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data ||
        err.message;
      console.error("🔥 API create/update failed:", backendError);

      // Toast the specific backend error so you know exactly what is wrong
      toast.error(
        typeof backendError === "string"
          ? backendError
          : "Validation Error from Server",
      );

      // Fallback
      if (editing) {
        const result = updateCoupon(targetId, form);
        if (!result.ok) throw new Error("Fallback update failed");
      } else {
        const result = createCoupon(form);
        if (!result.ok) throw new Error("Fallback create failed");
      }
      setAddOpen(false);
      await refresh();
    } finally {
      setEditingCoupon(null);
    }
  };

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      setDeleteLoading(true);
      let successCount = 0;
      try {
        for (const id of bulkDeleteIds) {
          await deleteAdminCoupon(id);
          successCount += 1;
        }
        if (successCount > 0) {
          toast.success(
            successCount === 1
              ? "Coupon deleted"
              : `${successCount} coupons deleted`,
          );
          await refresh();
        }
      } catch (error) {
        console.error("Failed to delete coupons:", error);
        toast.error("Failed to delete selected coupons");
      } finally {
        setBulkDeleteIds(null);
        clearSelection();
        setDeleteLoading(false);
      }
      return;
    }

    if (!deleteTarget || deleteLoading) return;
    const rawId =
      deleteTarget?._id || deleteTarget?.couponId || deleteTarget?.id;
    const couponId = String(rawId).trim() === "undefined" ? null : rawId;

    setDeleteLoading(true);
    setActionCouponId(couponId);

    try {
      if (couponId) await deleteAdminCoupon(couponId);
      else throw new Error("Invalid ID");
      toast.success("Coupon deleted successfully");
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete coupon";
      toast.error(serverMessage);
    } finally {
      setDeleteLoading(false);
      setActionCouponId(null);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Coupon Name",
      headerClassName: "pl-6 sm:pl-10",
      cellClassName: "pl-6 sm:pl-10",
      render: (row) => (
        <span className="flex items-center gap-1.5 truncate font-medium">
          {row.topPerforming && (
            <Star
              className="h-4 w-4 shrink-0 fill-[#69df66] text-[#69df66]"
              strokeWidth={0}
            />
          )}
          {row.name}
        </span>
      ),
    },
    { key: "type", label: "Type" },
    {
      key: "redemptions",
      label: "Redemptions",
      render: (row) => <span>{row.redemptions.toLocaleString()}</span>,
    },
    { key: "expiresOn", label: "Expires On" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <CouponTableActions
          row={row}
          disabled={actionCouponId === row.id && deleteLoading}
          onView={() => setViewingCoupon(row)}
          onEdit={() => {
            setEditingCoupon(row);
            setAddOpen(true);
          }}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Coupons"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <BannerButton
            onClick={() => {
              setEditingCoupon(null);
              setAddOpen(true);
            }}
          >
            Add Coupon
          </BannerButton>
        </PageBanner>

        <CouponFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
        />

        {selectedIds.length > 0 && (
          <CouponsBulkActionsBar
            count={selectedIds.length}
            disableCount={selectedActiveCount}
            onDelete={() => setBulkDeleteIds([...selectedIds])}
          />
        )}

        {loadingCoupons ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Loading coupons from the API...
          </div>
        ) : (
          <PaginatedFigmaTable
            columns={columns}
            data={filtered}
            emptyMessage="No coupons match your filters."
            itemLabel="coupons"
            resetDeps={[search, typeFilter, statusFilter]}
            selection={selection}
            rowClassName="hover:bg-slate-50/90"
          />
        )}
      </section>

      <AddCouponModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditingCoupon(null);
        }}
        onSubmit={handleAddOrUpdate}
        editingCoupon={editingCoupon}
      />

      <ViewCouponModal
        open={Boolean(viewingCoupon)}
        onClose={() => setViewingCoupon(null)}
        coupon={viewingCoupon}
      />

      <ConfirmCouponDeleteModal
        open={Boolean(deleteTarget) || Boolean(bulkDeleteIds?.length)}
        couponName={deleteTarget?.name}
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
