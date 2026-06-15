import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { toast } from "@/utils/toast";
import ManageUsersFilterToolbar from "../../components/manage-users/ManageUsersFilterToolbar";
import ManageUsersBulkActionsBar from "../../components/manage-users/ManageUsersBulkActionsBar";
import ManageUsersTable from "../../components/manage-users/ManageUsersTable";
import ManageUsersTableActions from "../../components/manage-users/ManageUsersTableActions";
import ConfirmManageUserDeleteModal from "../../components/manage-users/ConfirmManageUserDeleteModal";
import ConfirmManageUserStatusModal from "../../components/manage-users/ConfirmManageUserStatusModal";
import UserFormModal from "../../components/manage-users/UserFormModal";
import ViewUserModal from "../../components/manage-users/ViewUserModal";
import {
  MANAGE_USERS_STATIC_CENTERS,
  formatManageUserJoinDate,
} from "../../components/manage-users/manageUsersStaticData";
import { useTableRowSelection } from "../../hooks/useTableRowSelection";
import { useRolesDropdown } from "../../hooks/useRolesDropdown";
import { useCentersDropdownOptions } from "../../hooks/useCentersDropdownOptions";
import { roleLabel } from "../../data/manageUsersConfig";
import { cn } from "../../utils/cn";
import {
  createStudentUser,
  deleteUser,
  getUnifiedUsers,
  getUserById,
  normalizeUnifiedUsersResponse,
  updateUser,
  updateUserStatus,
} from "../../services/userManagementService";

const ROLE_BADGE_STYLES = {
  student: "bg-[#EEF5FF] text-[#1D72B8] ring-[#4CA6E8]/30",
  admin: "bg-violet-50 text-violet-700 ring-violet-200/60",
  mentor_admin: "bg-violet-50 text-violet-700 ring-violet-200/60",
  faculty: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  counselor: "bg-orange-50 text-orange-700 ring-orange-200/60",
  employee: "bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]",
  support_staff: "bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]",
};

function roleDisplayLabel(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "faculty") return "Teacher";
  if (normalized === "counselor") return "Parent";
  if (normalized === "mentor_admin" || normalized === "mentor-admin")
    return "Mentor Admin";
  return roleLabel(normalized);
}

function UserStatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
          : "bg-red-50 text-[#D64B5F] ring-red-200/70",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          isActive ? "bg-emerald-500" : "bg-[#D64B5F]",
        )}
        aria-hidden
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function UserRoleBadge({ role }) {
  const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.employee;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        style,
      )}
    >
      {roleDisplayLabel(role)}
    </span>
  );
}

function CenterPill({ label }) {
  return (
    <span className="inline-flex max-w-[180px] truncate rounded-md bg-[#F5F7FB] px-2.5 py-1 text-xs font-medium text-[#667085] ring-1 ring-inset ring-[#E7ECF5]">
      {label}
    </span>
  );
}

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  const [centerFilter, setCenterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);

  const { selectedIds, selection, clearSelection } = useTableRowSelection(
    (row) => row.id,
  );

  const { options: roleDropdownOptions = [] } = useRolesDropdown();
  const { options: centerDropdownOptions = [] } = useCentersDropdownOptions();

  const normalizedRoleDropdownOptions = useMemo(() => {
    const seen = new Set();

    return (roleDropdownOptions || [])
      .map((opt) => {
        const rawLabel = String(
          opt?.label || opt?.roleTitle || opt?.name || "",
        ).trim();
        const rawValue = String(
          opt?.value || opt?._id || opt?.id || opt?.roleId || "",
        ).trim();
        const roleCode = String(opt?.roleCode || opt?.code || "")
          .trim()
          .toUpperCase();

        const normalizedValue = roleCode || rawValue;

        return {
          value: normalizedValue,
          label: rawLabel || "Role",
          roleCode,
          rawValue,
        };
      })
      .filter((opt) => {
        if (!opt.label || !opt.value) return false;
        if (
          opt.label.toLowerCase() === "all roles" ||
          opt.value.toLowerCase() === "all"
        ) {
          return false;
        }

        const key = `${opt.label.toLowerCase()}::${opt.value.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [roleDropdownOptions]);

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "All roles" },
      ...normalizedRoleDropdownOptions,
    ],
    [normalizedRoleDropdownOptions],
  );

  const centerOptions = useMemo(
    () => [
      { value: "all", label: "All centers" },
      ...(centerDropdownOptions.length
        ? centerDropdownOptions.map((opt) => ({
            value: String(opt.value || "").trim(),
            label: String(opt.label || opt.centerName || "").trim() || "Center",
          }))
        : MANAGE_USERS_STATIC_CENTERS.map((name) => ({
            value: name,
            label: name,
          }))),
    ],
    [centerDropdownOptions],
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, centerFilter, statusFilter]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUnifiedUsers({
        page,
        limit: pageSize,
        search,
        role: roleFilter === "all" ? "ALL" : roleFilter,
        center: centerFilter === "all" ? "ALL" : centerFilter,
        status: statusFilter === "all" ? "" : statusFilter.toUpperCase(),
        userType: "ALL",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const normalized = normalizeUnifiedUsersResponse(response, {
        page,
        limit: pageSize,
      });
      setUsers(normalized.items);
      setTotalItems(normalized.total || 0);
      setTotalPages(normalized.totalPages || 1);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Failed to load users from the API");
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [centerFilter, page, pageSize, roleFilter, search, statusFilter]);

  useEffect(() => {
    let active = true;

    const runLoad = async () => {
      if (!active) return;
      await loadUsers();
    };

    runLoad();

    return () => {
      active = false;
    };
  }, [loadUsers]);

  const filtered = useMemo(() => users, [users]);

  const selectedActiveCount = useMemo(
    () =>
      users.filter((u) => selectedIds.includes(u.id) && u.status === "Active")
        .length,
    [users, selectedIds],
  );

  const handleBulkDisable = () => {
    const targets = users.filter(
      (user) => selectedIds.includes(user.id) && user.status === "Active",
    );
    if (!targets.length) return;

    setUsers((prev) =>
      prev.map((user) =>
        selectedIds.includes(user.id) && user.status === "Active"
          ? { ...user, status: "In Active" }
          : user,
      ),
    );
    toast.success(
      targets.length === 1
        ? "User disabled"
        : `${targets.length} users disabled`,
    );
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected user(s)? This cannot be undone.`,
      )
    ) {
      return;
    }

    setUsers((prev) => prev.filter((user) => !selectedIds.includes(user.id)));
    toast.success(
      selectedIds.length === 1
        ? "User deleted"
        : `${selectedIds.length} users deleted`,
    );
    clearSelection();
  };

  const handleCreateUser = async (formData) => {
    try {
      setLoading(true);
      await createStudentUser({
        ...formData,
        status: Boolean(
          formData.status === true ||
          formData.status === "Active" ||
          formData.status === "ACTIVE",
        ),
        userType: String(formData.userType || "STUDENT")
          .trim()
          .toUpperCase(),
      });

      toast.success("User created successfully");
      await loadUsers();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Failed to create user from the API");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id, patch) => {
    try {
      setLoading(true);

      const centerId = String(patch.centerId || "").trim();
      const payload = {
        fullName: String(patch.fullName || "").trim(),
        isActive:
          patch.isActive === true ||
          patch.status === true ||
          String(patch.status || "").toUpperCase() === "ACTIVE" ||
          String(patch.status || "").toLowerCase() === "active",
        parentName: String(patch.parentName || "").trim(),
        parentMobile: String(patch.parentMobile || "").trim(),
        centerId,
      };

      if (!payload.fullName) {
        toast.error("Full name is required to update the user");
        return false;
      }

      await updateUser(id, payload, "USER");
      toast.success("User updated successfully");
      await loadUsers();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Failed to update user from the API");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const openStudent360 = (user) => {
    navigate(`/users/manage/students/${user.id}`);
  };

  const isStudent = (row) => row.role === "student";

  const handleView = async (row) => {
    try {
      if (isStudent(row)) {
        openStudent360(row);
        return;
      }

      const userId = row.studentRecordId || row.id;
      if (!userId) {
        setViewingUser(row);
        return;
      }

      const detailResponse = await getUserById(userId);
      const normalized = normalizeUnifiedUsersResponse(detailResponse, {
        page: 1,
        limit: 10,
      });
      setViewingUser(normalized.items[0] || row);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      setViewingUser(row);
      toast.error("Unable to load user details from the API");
    }
  };

  const handleStatusToggleRequest = (row) => {
    setStatusTarget(row);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || statusLoading) return;

    try {
      const enabling = statusTarget.status !== "Active";
      setStatusLoading(true);
      setActionUserId(statusTarget.id);

      await updateUserStatus(
        statusTarget.studentRecordId || statusTarget.id,
        enabling,
      );

      await loadUsers();
      toast.success(
        enabling ? "User enabled successfully" : "User disabled successfully",
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Failed to update user status from the API");
    } finally {
      setStatusTarget(null);
      setStatusLoading(false);
      setActionUserId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return;

    try {
      setDeleteLoading(true);
      setActionUserId(deleteTarget.id);

      await deleteUser(deleteTarget.studentRecordId || deleteTarget.id);

      await loadUsers();
      toast.success("User deleted successfully");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Failed to delete user from the API");
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
      setActionUserId(null);
    }
  };

  const columns = [
    {
      key: "fullName",
      label: "Full Name",
      headerClassName: "min-w-[220px]",
      cellClassName: "min-w-[220px]",
      render: (row) => {
        const inner = (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-snug text-[#14213D]">
              {row.fullName}
            </p>
            {row.userId ? (
              <p className="mt-1 truncate text-xs font-medium text-[#667085]">
                {row.userId}
              </p>
            ) : null}
          </div>
        );
        if (isStudent(row)) {
          return (
            <button
              type="button"
              onClick={() => openStudent360(row)}
              className="min-w-0 text-left transition hover:opacity-80"
            >
              {inner}
            </button>
          );
        }
        return inner;
      },
    },
    {
      key: "email",
      label: "Email",
      headerClassName: "min-w-[240px]",
      cellClassName: "min-w-[240px]",
      render: (row) => (
        <span
          className="block truncate text-sm text-[#667085]"
          title={row.email}
        >
          {row.email}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      align: "center",
      headerClassName: "min-w-[130px] text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#14213D]">
          {row.phone}
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      align: "center",
      headerClassName: "min-w-[110px] text-center",
      cellClassName: "text-center",
      render: (row) => <UserRoleBadge role={row.role} />,
    },
    {
      key: "assignedCenter",
      label: "Center",
      align: "center",
      headerClassName: "min-w-[140px] text-center",
      cellClassName: "text-center",
      render: (row) => <CenterPill label={row.assignedCenter} />,
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      headerClassName: "min-w-[110px] text-center",
      cellClassName: "text-center",
      render: (row) => <UserStatusBadge status={row.status} />,
    },
    {
      key: "joinedAt",
      label: "Joined",
      align: "center",
      headerClassName: "min-w-[120px] text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#667085]">
          {formatManageUserJoinDate(row.joinedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      headerClassName: "min-w-[200px] text-center",
      cellClassName: "text-center",
      render: (row) => (
        <ManageUsersTableActions
          row={row}
          disabled={actionUserId === row.id && (statusLoading || deleteLoading)}
          onView={() => handleView(row)}
          onEdit={() => openEdit(row)}
          onStatusToggle={() => handleStatusToggleRequest(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="figma-admin-section min-h-screen bg-[#F5F7FB] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#E7ECF5] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(7,19,63,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] ring-1 ring-[#4CA6E8]/20">
              <Users className="h-6 w-6 text-[#1D72B8]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[#14213D] sm:text-2xl">
                Users Management
              </h1>
              <p className="mt-1 text-sm text-[#667085]">
                Manage users, permissions and assigned centers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1D72B8] to-[#07133F] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(29,114,184,0.35)] transition hover:shadow-[0_6px_20px_rgba(7,19,63,0.35)] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add User
          </button>
        </div>

        <div className="rounded-2xl border border-[#E7ECF5] bg-white p-5 shadow-[0_8px_24px_rgba(7,19,63,0.05)] sm:p-6">
          <ManageUsersFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            roleFilter={roleFilter}
            onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
            centerFilter={centerFilter}
            onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            roleOptions={roleOptions}
            centerOptions={centerOptions}
          />
        </div>

        {selectedIds.length > 0 && (
          <ManageUsersBulkActionsBar
            count={selectedIds.length}
            disableCount={selectedActiveCount}
            onDisable={handleBulkDisable}
            onDelete={handleBulkDelete}
          />
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#E7ECF5] bg-white p-6 text-sm text-[#667085] shadow-[0_8px_24px_rgba(7,19,63,0.05)]">
            Loading users…
          </div>
        ) : (
          <ManageUsersTable
            columns={columns}
            data={filtered}
            emptyMessage="No users match your search or filters."
            itemLabel="users"
            resetDeps={[search, roleFilter, centerFilter, statusFilter]}
            selection={selection}
            serverPagination
            totalItems={totalItems}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            onPageChange={(next) => setPage(Number(next) || 1)}
            onPageSizeChange={(nextSize) => {
              setPageSize(Number(nextSize) || 10);
              setPage(1);
            }}
          />
        )}
      </section>

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onCreate={handleCreateUser}
        onUpdate={handleUpdateUser}
        editingUser={editingUser}
        centerOptions={centerOptions}
      />

      <ViewUserModal
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
      />

      <ConfirmManageUserStatusModal
        open={Boolean(statusTarget)}
        enabling={statusTarget?.status !== "Active"}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) setStatusTarget(null);
        }}
        onConfirm={confirmStatusChange}
      />

      <ConfirmManageUserDeleteModal
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
