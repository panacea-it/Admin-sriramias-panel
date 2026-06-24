import api from "../config/api";
import apiClient from "./apiClient";
import { throwApiError } from "../utils/apiError";
import { createCachedRequest } from "../utils/apiRequestCache";
import { mapCentreDropdownDisplayOption } from "../utils/centreDropdownDisplay";

const centersDropdownCache = createCachedRequest({ ttlMs: 5 * 60_000 });

export function clearCentersDropdownCache() {
  centersDropdownCache.clear();
}

function normalizeCenterStatus(value) {
  const raw = String(value ?? "ACTIVE")
    .trim()
    .toUpperCase();
  return raw === "DISABLED" ? "DISABLED" : "ACTIVE";
}

export function buildCreateCenterPayload(form) {
  const status = normalizeCenterStatus(form?.status);

  return {
    centerName: String(form?.centerName || "").trim(),
    centerCode: String(form?.centerCode || "").trim(),
    address: String(form?.address || "").trim(),
    city: String(form?.city || "").trim(),
    state: String(form?.state || "").trim(),
    contactNumber: String(form?.contactNumber || "").replace(/\D/g, ""),
    email: String(form?.email || "").trim(),
    status,
  };
}

function parseAssignedAdmins(raw) {
  return String(raw ?? "")
    .split(/[,;\n]/g)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export function buildUpdateCenterPayload(form) {
  const assignedAdmins = parseAssignedAdmins(
    form?.assignedAdminsText ?? form?.assignedAdmins ?? "",
  );

  return {
    centerName: String(form?.centerName || "").trim(),
    centerCode: String(form?.centerCode || "").trim(),
    address: String(form?.address || "").trim(),
    city: String(form?.city || "").trim(),
    state: String(form?.state || "").trim(),
    contactNumber: String(form?.contactNumber || "").replace(/\D/g, ""),
    email: String(form?.email || "").trim(),
    status: normalizeCenterStatus(form?.status),
    assignedAdmins,
  };
}

export function buildUpdateCenterPayloadFromPatch(patch) {
  const assignedAdmins = Array.isArray(patch?.assignedAdmins)
    ? patch.assignedAdmins.map((item) => String(item).trim()).filter(Boolean)
    : parseAssignedAdmins(
        patch?.assignedAdminsText ?? patch?.assignedAdmins ?? "",
      );

  return {
    centerName: String(patch?.centerName || "").trim(),
    centerCode: String(patch?.centerCode || "").trim(),
    address: String(patch?.address || "").trim(),
    city: String(patch?.city || "").trim(),
    state: String(patch?.state || "").trim(),
    contactNumber: String(patch?.contactNumber || "").replace(/\D/g, ""),
    email: String(patch?.email || "").trim(),
    status: normalizeCenterStatus(patch?.status),
    assignedAdmins,
  };
}

export function mapStatusFilterToApi(statusFilter) {
  if (statusFilter === "active") return "ACTIVE";
  if (statusFilter === "disabled") return "DISABLED";
  return "ALL";
}

export function mapApiCenterToLocal(data) {
  if (!data || typeof data !== "object") return null;

  const rawAdmins = data.assignedAdmins;
  let assignedAdmins = [];
  if (Array.isArray(rawAdmins)) {
    assignedAdmins = rawAdmins.map(String).filter(Boolean);
  } else if (typeof rawAdmins === "string" && rawAdmins.trim()) {
    assignedAdmins = rawAdmins
      .split(/[,;\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const statusRaw = String(data.status || "ACTIVE").toUpperCase();

  const assignedAdminsDisplay =
    String(data.assignedAdminsDisplay || "").trim() ||
    (assignedAdmins.length > 0 ? assignedAdmins.join(", ") : "");

  const createdBy =
    data.createdBy && typeof data.createdBy === "object"
      ? {
          id:
            String(data.createdBy._id || data.createdBy.id || "").trim() ||
            null,
          name: String(data.createdBy.name || "").trim(),
          email: String(data.createdBy.email || "").trim(),
        }
      : null;

  return {
    centerId: data.centerId || data.id || data._id || null,
    centerName: String(data.centerName || "").trim(),
    centerCode: String(data.centerCode || "").trim(),
    address: String(data.address || ""),
    state: String(data.state || ""),
    city: String(data.city || ""),
    contactNumber: String(data.contactNumber || ""),
    email: String(data.email || ""),
    status: statusRaw === "DISABLED" ? "disabled" : "active",
    assignedAdmins,
    assignedAdminsDisplay,
    linkedStudentCount: Number(data.linkedStudentCount) || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
    createdBy,
    createdByLabel: createdBy?.name
      ? `${createdBy.name}${createdBy.email ? ` (${createdBy.email})` : ""}`
      : "",
  };
}

export function normalizeCenterDetailsResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : data?.center || data;

  return mapApiCenterToLocal(payload);
}

export function normalizeCentersListResponse(
  data,
  { page = 1, limit = 10 } = {},
) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : data;
  const itemsRaw =
    payload?.centers ||
    payload?.items ||
    payload?.results ||
    data?.centers ||
    data?.items ||
    (Array.isArray(payload)
      ? payload
      : Array.isArray(data?.data)
        ? data.data
        : []);

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiCenterToLocal(row))
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

export function normalizeCentersDropdown(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : data?.data?.centers ||
        data?.data?.items ||
        data?.centers ||
        data?.items ||
        [];

  return (Array.isArray(list) ? list : [])
    .filter((item) => {
      const status = String(item?.status ?? "ACTIVE")
        .trim()
        .toUpperCase();
      return status !== "DISABLED" && status !== "INACTIVE";
    })
    .map((item) => {
      const centerName = String(item?.centerName || item?.name || "").trim();
      const centerCode = String(item?.centerCode || "").trim();
      const city = String(item?.city || "").trim();
      const state = String(item?.state || "").trim();

      const label =
        item?.label ||
        [
          centerName,
          centerCode ? `(${centerCode})` : "",
          city ? `• ${city}` : "",
          state ? `, ${state}` : "",
        ]
          .filter(Boolean)
          .join(" ") ||
        String(item?.name || "");

      return mapCentreDropdownDisplayOption({
        label,
        value: String(
          item?.value ||
            item?._id ||
            item?.id ||
            item?.centerId ||
            item?.center_id ||
            "",
        ),
        centerName,
        centerCode,
        city,
        state,
      });
    })
    .filter((opt) => opt.label && opt.value);
}

export function getCreateCenterErrorMessage(error) {
  if (!error) return "Failed to create center";
  if (typeof error === "string") return error;
  if (error.message && typeof error.message === "string") return error.message;
  if (error.error && typeof error.error === "string") return error.error;
  if (Array.isArray(error.errors) && error.errors[0]) {
    const first = error.errors[0];
    return typeof first === "string"
      ? first
      : first.message || "Failed to create center";
  }
  return "Failed to create center";
}

/** Create Center — unchanged integration (uses apiClient alias) */
export const createCenter = async (payload) => {
  try {
    const response = await apiClient.post("/api/admin/centers", payload);

    return response.data;
  } catch (error) {
    throw error?.response?.data || error?.message || "Something went wrong";
  }
};

export const getCenters = async (params = {}) => {
  try {
    const response = await api.get("/api/admin/centers", { params });
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const getCenterById = async (centerId) => {
  try {
    const response = await api.get(`/api/admin/centers/${centerId}`);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const updateCenter = async (centerId, payload) => {
  try {
    const response = await api.put(`/api/admin/centers/${centerId}`, payload);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const updateCenterStatus = async (centerId, status) => {
  try {
    const response = await api.patch(`/api/admin/centers/${centerId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const deleteCenter = async (centerId) => {
  try {
    const response = await api.delete(`/api/admin/centers/${centerId}`);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const getCentersDropdown = async () => {
  try {
    return await centersDropdownCache.fetch("centers-dropdown", async () => {
      const response = await api.get("/api/centers/dropdown");
      return response.data;
    });
  } catch (error) {
    throwApiError(error);
  }
};
