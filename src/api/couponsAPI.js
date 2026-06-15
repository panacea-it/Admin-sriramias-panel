import axiosInstance from "./axiosInstance";

// --- 1. BACKEND TO FRONTEND MAPPING (For GET requests) ---
function mapAdminCoupon(row) {
  const type = String(row.type || "").toUpperCase();
  const status = String(row.status || "").toUpperCase();
  const couponId = row._id || row.id;

  return {
    id: couponId,
    _id: couponId,
    couponId,
    name: String(row.couponName || row.name || "").trim(),
    couponCode: String(row.couponCode || "").trim(),
    type:
      type === "FLAT"
        ? "Flat Discount"
        : type === "PERCENTAGE"
          ? "Percentage"
          : row.type || "Percentage",
    value: row.value ?? "",
    validFrom: row.validFrom || "",
    validTill: row.validTill || "",
    expiresOn: row.validTill
      ? new Date(row.validTill).toLocaleDateString("en-GB")
      : "—",
    category: row.applicableFor || row.category || "Course",
    backgroundImage:
      row.backgroundImage && typeof row.backgroundImage === "object"
        ? row.backgroundImage.url || row.backgroundImage.public_id || ""
        : row.backgroundImage || "",
    totalUsersLimit: row.totalUsersLimit ?? "",
    usageLimitPerCustomer: row.usageLimitPerCustomer ?? "",
    minQuantityItems: row.minimumQuantity ?? "",
    minCartValue: row.minimumCartValue ?? "",
    eligibility: row.eligibility || "everyone",
    specificStudent: row.specificStudent || "",
    redemptions: Number(row.usedCount ?? 0),
    status:
      status === "ACTIVE"
        ? "Active"
        : status === "INACTIVE"
          ? "In Active"
          : row.status || "Active",
    topPerforming: Boolean(row.topPerforming),
    createdBy: row.createdBy || null,
    createdAt: row.createdAt || null,
  };
}

// --- 2. FRONTEND TO BACKEND MAPPING (To match Postman perfectly) ---
function mapFrontendToApi(form) {
  if (!form) return {};
  const payload = { ...form };

  // 1. Map Types exactly as Postman expects
  if (payload.type) {
    if (payload.type === "Flat Discount") payload.type = "FLAT";
    else if (payload.type === "Percentage") payload.type = "PERCENTAGE";
    else if (payload.type === "BOGO") payload.type = "BOGO";
  }

  // 2. Map Category to 'applicableFor' (e.g., "Books" -> "BOOK")
  if (payload.category) {
    if (payload.category === "Books") payload.applicableFor = "BOOK";
    else if (payload.category === "Course") payload.applicableFor = "COURSE";
    else if (payload.category === "Test Series")
      payload.applicableFor = "TEST_SERIES";
    else if (payload.category === "All") payload.applicableFor = "ALL";
    else
      payload.applicableFor = payload.category.toUpperCase().replace(" ", "_");
    delete payload.category;
  }

  // 3. Exact Postman Variable Names
  if (payload.minQuantityItems !== undefined) {
    if (payload.minQuantityItems !== "")
      payload.minimumQuantity = payload.minQuantityItems;
    delete payload.minQuantityItems;
  }
  if (payload.minCartValue !== undefined) {
    if (payload.minCartValue !== "")
      payload.minimumCartValue = payload.minCartValue;
    delete payload.minCartValue;
  }

  // 4. Strip specificStudent if eligibility is everyone
  if (payload.eligibility === "everyone") {
    delete payload.specificStudent;
  }

  // 5. Date Formatting (ensure YYYY-MM-DD if ISO)
  if (payload.validFrom && payload.validFrom.includes("T")) {
    payload.validFrom = payload.validFrom.split("T")[0];
  }
  if (payload.validTill && payload.validTill.includes("T")) {
    payload.validTill = payload.validTill.split("T")[0];
  }

  // 6. Clean up frontend-only metadata to prevent strict backend rejection
  delete payload.id;
  delete payload._id;
  delete payload.couponId;
  delete payload.expiresOn;
  delete payload.topPerforming;
  delete payload.redemptions;
  delete payload.createdAt;
  delete payload.createdBy;

  return payload;
}

export async function fetchAdminCoupons(signal) {
  const response = await axiosInstance.get("/coupons/admin", { signal });
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
  return rows.map(mapAdminCoupon);
}

export async function fetchCouponsByCategory(categoryId, signal) {
  if (!categoryId) return [];
  const response = await axiosInstance.get("/coupons", {
    params: { categoryId },
    signal,
  });
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
  return rows.map(mapAdminCoupon);
}

export async function deleteAdminCoupon(id, signal) {
  const couponId = String(id || "").trim();
  if (!couponId || couponId === "undefined")
    throw new Error("Coupon id is missing for delete request.");
  const response = await axiosInstance.delete(
    `/coupons/admin/${encodeURIComponent(couponId)}`,
    { signal },
  );
  return response.data;
}

export async function createAdminCoupon(form, signal) {
  const apiPayload = mapFrontendToApi(form);
  const fd = new FormData();

  Object.entries(apiPayload).forEach(([k, v]) => {
    // CRITICAL: Drop completely empty fields so the DB doesn't crash validating "" as a number
    if (v === undefined || v === null || v === "") return;
    if (k === "backgroundImage" && typeof v === "string") return;

    if (typeof File !== "undefined" && v instanceof File) {
      fd.append(k, v);
    } else if (Array.isArray(v)) {
      v.forEach((item) => fd.append(k, item));
    } else {
      fd.append(k, String(v));
    }
  });

  const response = await axiosInstance.post("/coupons/admin", fd, {
    signal,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function updateAdminCoupon(id, form, signal) {
  const couponId = String(id || "").trim();
  if (!couponId || couponId === "undefined")
    throw new Error("Coupon id is missing for update request.");

  const apiPayload = mapFrontendToApi(form);
  const fd = new FormData();

  Object.entries(apiPayload).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (k === "backgroundImage" && typeof v === "string") return;

    if (typeof File !== "undefined" && v instanceof File) {
      fd.append(k, v);
    } else if (Array.isArray(v)) {
      v.forEach((item) => fd.append(k, item));
    } else {
      fd.append(k, String(v));
    }
  });

  const response = await axiosInstance.put(
    `/coupons/admin/${encodeURIComponent(couponId)}`,
    fd,
    {
      signal,
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}
