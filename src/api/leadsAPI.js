import axiosInstance from "./axiosInstance";

/**
 * Enterprise-grade retry wrapper for handling 429 Too Many Requests errors.
 */
async function withRetry(apiCall, retries = 3, delay = 1500) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(`[Rate Limited] Retrying API call... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(apiCall, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

/**
 * 1. Fetch Centers Dropdown
 */
export async function fetchCentersDropdown(signal) {
  try {
    const response = await axiosInstance.get("/admin/centers/dropdown", {
      signal,
    });
    return response?.data?.data || [];
  } catch (error) {
    if (error?.name !== "CanceledError")
      console.error("Failed to fetch centers:", error);
    return [];
  }
}

/**
 * 2. Bulk Upload Leads
 */
export async function bulkUploadLeadsAPI(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/crm/leads/bulk-upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response?.data;
}

/**
 * 3. Download Sample Template
 */
export async function downloadSampleTemplateAPI() {
  const response = await axiosInstance.post(
    "/crm/leads/sample-template",
    {},
    { responseType: "blob" }, // CRITICAL for downloading Excel files!
  );
  return response.data;
}

/**
 * 4. Fetch Paginated Leads
 * POST /api/crm/leads/list
 */
export async function fetchLeads(
  {
    page = 1,
    limit = 10,
    search = "",
    centerId = "",
    status = "all",
    date = null,
  } = {},
  signal,
) {
  let formattedDate = "";
  if (date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    formattedDate = `${d.getFullYear()}-${month}-${day}`;
  }

  const payload = {
    page,
    limit,
    search: search.trim(),
    centerId: centerId === "all" ? "" : centerId,
    status: status === "all" ? "" : status,
    fromDate: formattedDate,
    toDate: formattedDate,
  };

  const response = await withRetry(() =>
    axiosInstance.post("/crm/leads/list", payload, { signal }),
  );

  const rows = response?.data?.data?.leads || [];
  const pagination = response?.data?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const mappedRows = rows.map((row) => {
    // Safely extract the ID if backend returns the full object instead of a string
    let counselorIdStr = "";
    if (
      row.assignedCounselorId &&
      typeof row.assignedCounselorId === "object"
    ) {
      counselorIdStr = row.assignedCounselorId._id;
    } else if (typeof row.assignedCounselorId === "string") {
      counselorIdStr = row.assignedCounselorId;
    }

    return {
      id: row._id,
      userName: row.userName || "Unknown",
      email: row.email || "—",
      mobile: row.mobileNumber || "—",
      courseVisited: row.courseVisited || "—",
      center: row.centerId?.centerName || row.centerName || "—",
      centerId: row.centerId?._id || "",
      date: row.createdAt || new Date().toISOString(),
      assignedCounselor: counselorIdStr,
      assignedCounselorName: row.assignedCounselorName || "",
      status: row.status || "NEW",
    };
  });

  return { data: mappedRows, pagination };
}

/**
 * 5. Fetch Dashboard Stats
 * POST /api/crm/leads/dashboard-stats
 */
export async function fetchLeadStats(centerId = "", date = null, signal) {
  let formattedDate = "";
  if (date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    formattedDate = `${d.getFullYear()}-${month}-${day}`;
  }

  const payload = {
    centerId: centerId === "all" ? "" : centerId,
    fromDate: formattedDate,
    toDate: formattedDate,
  };

  const response = await withRetry(() =>
    axiosInstance.post("/crm/leads/dashboard-stats", payload, { signal }),
  );

  return (
    response?.data?.data?.stats || {
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      newLeads: 0,
      assignedLeads: 0,
    }
  );
}

/**
 * 6. Fetch Counselors by Center (For Dynamic Dropdowns)
 */
export async function fetchCounselorsByCenter(centerId, signal) {
  const response = await withRetry(() =>
    axiosInstance.post(
      "/crm/leads/counselors-by-center",
      { centerId },
      { signal },
    ),
  );
  return response?.data?.data?.counselors || [];
}

/**
 * 7. Assign Counselor to Lead
 * POST /api/crm/leads/assign-counselor
 */
export async function assignLeadCounselor(leadId, counselorId) {
  const response = await axiosInstance.post("/crm/leads/assign-counselor", {
    leadId,
    counselorId,
  });
  return response?.data;
}

/**
 * 8. Fetch Lead Details
 * POST /api/crm/leads/details
 */
export async function fetchLeadDetails(leadId, signal) {
  const response = await withRetry(() =>
    axiosInstance.post("/crm/leads/details", { leadId }, { signal }),
  );
  return response?.data?.data?.lead || null;
}

/**
 * 9. Update Lead Status
 * PUT /api/crm/leads/update-status
 */
export async function updateLeadStatus(leadId, status) {
  const response = await axiosInstance.put("/crm/leads/update-status", {
    leadId,
    status,
  });
  return response?.data;
}

/**
 * 10. Edit Lead Details
 * PUT /api/crm/leads/edit
 */
export async function editLeadAPI(leadId, centerId, form) {
  const response = await axiosInstance.put("/crm/leads/edit", {
    leadId,
    centerId,
    userName: form.userName,
    email: form.email,
    mobileNumber: form.mobile,
    courseVisited: form.courseVisited,
    counselorId: form.assignedCounselor,
    status: form.status,
  });
  return response?.data;
}

/**
 * 11. Delete Lead
 * DELETE /api/crm/leads/delete
 */
export async function deleteLeadAPI(leadId) {
  const response = await axiosInstance.delete("/crm/leads/delete", {
    data: { leadId },
  });
  return response?.data;
}
