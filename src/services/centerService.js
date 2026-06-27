import api from "../config/api";
import { throwApiError } from "../utils/apiError";
import { createCachedRequest } from "../utils/apiRequestCache";
import { mapCentreDropdownDisplayOption } from "../utils/centreDropdownDisplay";
import {
  mapApiStatusToLocal,
  mapLocalStatusToApi,
} from "../utils/centerHelpers";

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
    email: String(form?.email || "").trim().toLowerCase(),
    status,
  };
}

export function buildUpdateCenterPayload(form) {
  return {
    centerName: String(form?.centerName || "").trim(),
    centerCode: String(form?.centerCode || "").trim().toUpperCase(),
    address: String(form?.address || "").trim(),
    city: String(form?.city || "").trim(),
    state: String(form?.state || "").trim(),
    contactNumber: String(form?.contactNumber || "").replace(/\D/g, ""),
    email: String(form?.email || "").trim().toLowerCase(),
    status: normalizeCenterStatus(form?.status),
  };
}

export function buildUpdateCenterPayloadFromPatch(patch) {
  return buildUpdateCenterPayload(patch);
}

export function buildPartialUpdatePayload(original, form) {
  const next = buildUpdateCenterPayload(form);
  const payload = {};

  const originalStatus = mapLocalStatusToApi(original?.status);
  const originalContact = String(original?.contactNumber || "").replace(/\D/g, "");
  const originalEmail = String(original?.email || "").trim().toLowerCase();

  const comparisons = [
    ["centerName", String(original?.centerName || "").trim(), next.centerName],
    ["centerCode", String(original?.centerCode || "").trim().toUpperCase(), next.centerCode],
    ["address", String(original?.address || "").trim(), next.address],
    ["city", String(original?.city || "").trim(), next.city],
    ["state", String(original?.state || "").trim(), next.state],
    ["contactNumber", originalContact, next.contactNumber],
    ["email", originalEmail, next.email],
    ["status", originalStatus, next.status],
  ];

  for (const [field, prev, value] of comparisons) {
    if (prev !== value) {
      payload[field] = value;
    }
  }

  return payload;
}

export { mapStatusFilterToApi } from "../utils/centerHelpers";

export function mapApiCenterToLocal(data) {
  if (!data || typeof data !== "object") return null;

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
    status: mapApiStatusToLocal(data.status),
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

export const createCenter = async (payload) => {
  try {
    const response = await api.post("/api/admin/centers", payload);
    return response.data;
  } catch (error) {
    throwApiError(error);
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

export const getIndianStates = async () => {
  try {
    const response = await api.get("/api/admin/centers/states");
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const bulkUpdateCenterStatus = async (payload) => {
  try {
    const response = await api.patch("/api/admin/centers/bulk-status", payload);
    return response.data;
  } catch (error) {
    throwApiError(error);
  }
};

export const centerService = {
  getCenters,
  getCenterById,
  createCenter,
  updateCenter,
  updateCenterStatus,
  bulkUpdateCenterStatus,
  deleteCenter,
  getIndianStates,
  getCentersDropdown,
};

export default centerService;
