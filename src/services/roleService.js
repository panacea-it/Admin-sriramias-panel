import api from "../config/api";
import { throwApiError } from "../utils/apiError";

export function mapRoleStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || "").toLowerCase();
  if (normalized === "active") return "ACTIVE";
  if (
    normalized === "in active" ||
    normalized === "inactive" ||
    normalized === "disabled"
  ) {
    return "INACTIVE";
  }
  return "ALL";
}

export function mapApiRoleToLocal(data) {
  if (!data || typeof data !== "object") return null;

  const id = data._id || data.id || data.roleId || null;
  const statusRaw = String(data.status || "").toUpperCase();
  const enabled =
    data.enabled !== undefined
      ? Boolean(data.enabled)
      : statusRaw !== "INACTIVE" && statusRaw !== "DISABLED";

  return {
    id: String(id || ""),
    label: String(data.roleTitle || data.label || "").trim(),
    roleCode: String(data.roleCode || "").trim(),
    status: enabled ? "ACTIVE" : "INACTIVE",
    enabled,
    createdAt: data.createdAt || data.createdOn || null,
    updatedAt: data.updatedAt || null,
    description: String(data.description || "").trim(),
    systemProtected: Boolean(data.systemProtected),
    fullAccess: Boolean(data.fullAccess),
  };
}

export function normalizeRolesListResponse(
  data,
  { page = 1, limit = 10 } = {},
) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : data;

  const itemsRaw =
    payload?.roles ||
    payload?.items ||
    payload?.results ||
    data?.roles ||
    data?.items ||
    (Array.isArray(payload)
      ? payload
      : Array.isArray(data?.data)
        ? data.data
        : []);

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiRoleToLocal(row))
    .filter(Boolean);

  const pagination =
    payload?.pagination ||
    data?.pagination ||
    payload?.meta ||
    data?.meta ||
    {};
  const total =
    pagination.total ??
    payload?.total ??
    data?.total ??
    payload?.totalCount ??
    data?.totalCount ??
    items.length;
  const totalPages =
    pagination.totalPages ??
    payload?.totalPages ??
    data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1);
  const currentPage = pagination.page ?? payload?.page ?? data?.page ?? page;

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  };
}

export function normalizeRolesDropdown(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : data;

  const list =
    payload?.roles ||
    payload?.items ||
    payload?.userRoles ||
    payload?.adminRoles ||
    (Array.isArray(payload)
      ? payload
      : Array.isArray(data?.data)
        ? data.data
        : []);

  const seen = new Set();

  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const label = String(
        item?.label ||
          item?.roleTitle ||
          item?.roleName ||
          item?.name ||
          item?.title ||
          "",
      ).trim();

      const roleCode = String(
        item?.roleCode || item?.role_code || item?.code || "",
      )
        .trim()
        .toUpperCase();
      const rawValue = String(
        item?.value ||
          item?._id ||
          item?.id ||
          item?.roleId ||
          item?.role_id ||
          "",
      ).trim();
      const value = roleCode || rawValue;

      const status = String(
        item?.status ||
          (item?.enabled === false
            ? "INACTIVE"
            : item?.isActive === false
              ? "INACTIVE"
              : "ACTIVE") ||
          "",
      ).trim();

      return {
        label,
        value,
        roleCode,
        status,
        raw: item,
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
}

export function unwrapRoleResponse(data) {
  return data?.data ?? data?.role ?? data;
}

export const createRole = async (payload) => {
  try {
    const response = await api.post("/api/admin/roles", payload);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const getRoles = async (params = {}) => {
  try {
    const response = await api.get("/api/admin/roles", { params });
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const getRoleById = async (roleId) => {
  try {
    const response = await api.get(`/api/admin/roles/${roleId}`);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const updateRole = async (roleId, payload) => {
  try {
    const response = await api.put(`/api/admin/roles/${roleId}`, payload);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const deleteRole = async (roleId) => {
  try {
    const response = await api.delete(`/api/admin/roles/${roleId}`);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const getRolesDropdown = async () => {
  try {
    const response = await api.get("/api/admin/user-roles");
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export function normalizeCreateUserRoles(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : data;

  const list =
    payload?.data ||
    payload?.roles ||
    payload?.items ||
    payload?.options ||
    (Array.isArray(payload)
      ? payload
      : Array.isArray(data?.data)
        ? data.data
        : []);

  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const label = String(
        item?.label || item?.roleTitle || item?.name || item?.title || "",
      ).trim();
      const roleCode = String(item?.roleCode || item?.code || item?.value || "")
        .trim()
        .toUpperCase();
      const value = String(
        item?.value || roleCode || item?.id || item?.roleId || "",
      )
        .trim()
        .toUpperCase();

      return {
        label,
        value,
        roleCode,
        kind: String(item?.kind || item?.type || "").trim(),
        locked: Boolean(item?.locked ?? item?.isLocked ?? false),
        raw: item,
      };
    })
    .filter((option) => option.label || option.value);
}

export const getCreateUserRoles = async () => {
  try {
    const response = await api.get("/api/admin/user-create-roles");
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export async function fetchAllRoles({ pageSize = 100 } = {}) {
  let page = 1;
  let totalPages = 1;
  const items = [];

  do {
    const data = await getRoles({ page, limit: pageSize, status: "ALL" });
    const normalized = normalizeRolesListResponse(data, {
      page,
      limit: pageSize,
    });
    items.push(...normalized.items);
    totalPages = normalized.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return items;
}
