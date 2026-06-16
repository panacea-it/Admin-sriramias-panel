import axiosInstance from "./axiosInstance";

/**
 * Enterprise-grade retry wrapper for handling 429 Too Many Requests errors.
 */
async function withRetry(apiCall, retries = 3, delay = 1500) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(
        `[Rate Limited] Retrying API call in ${delay}ms... (${retries} retries left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(apiCall, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
}

/**
 * 1. Fetches the list of active centers for dropdowns
 */
export async function fetchCentersDropdown(signal) {
  const response = await withRetry(() =>
    axiosInstance.get("/admin/centers/dropdown", { signal }),
  );
  return response?.data?.data || [];
}

/**
 * 2. Fetches the list of Enquiries with Server-Side Filters & Pagination
 */
export async function fetchEnquiries(
  {
    page = 1,
    limit = 10,
    search = "",
    center = "",
    type = "all",
    date = null,
  } = {},
  signal,
) {
  // Format Date strictly as YYYY-MM-DD
  let formattedDate = "";
  if (date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    formattedDate = `${d.getFullYear()}-${month}-${day}`;
  }

  let backendSource = "";
  if (type === "Admission") backendSource = "main";
  if (type === "Demo") backendSource = "demo";

  const payload = {
    page,
    limit,
    search: search.trim(),
    centerId: center,
    source: backendSource,
  };

  // Only attach the date parameter to the body if a date is actually selected
  if (formattedDate) {
    payload.date = formattedDate;
  }

  const response = await withRetry(() =>
    axiosInstance.post("/admin/enquiries/list", payload, { signal }),
  );

  const rows = response?.data?.data?.enquiries || [];
  const pagination = response?.data?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const mappedRows = rows.map((row) => {
    // BUG FIX: The API sometimes returns an object for assignedCounselorId instead of a string.
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
      student: row.name || "Unknown Student",
      email: row.email || "—",
      phone: row.phone || "—",
      center: row.center?.centerName || row.centerName || "—",
      centerId: row.center?._id || "",
      enquiryType: row.enquiryType || "—",
      enquiryDate: row.createdAt || new Date().toISOString(),
      assignedCounselor: counselorIdStr,
      assignedCounselorName: row.assignedCounselorName || "",
      leadStatus: row.leadStatus || "NEW",
      courseName: row.course?.courseName || row.courseName || "—",
    };
  });

  return { data: mappedRows, pagination };
}

/**
 * 3. Fetches Enquiry Dashboard Statistics
 */
export async function fetchEnquiryStats(centerId = "", signal) {
  const response = await withRetry(() =>
    axiosInstance.get("/admin/enquiries/stats", {
      params: { center: centerId },
      signal,
    }),
  );

  return (
    response?.data?.data?.stats || {
      totalEnquiries: 0,
      convertedEnquiries: 0,
      conversionRate: 0,
      newEnquiries: 0,
      actionPending: 0,
    }
  );
}

/**
 * 4. Updates the Enquiry Status / Lead Status
 */
export async function updateEnquiryLeadStatus(
  enquiryId,
  leadStatus,
  status = "ACTIVE",
) {
  const response = await axiosInstance.put("/admin/enquiries/status", {
    enquiryId,
    status,
    leadStatus,
  });
  return response?.data?.data?.enquiry;
}

/**
 * 5. Fetch Counselors by Center
 */
export async function fetchCounselorsByCenter(centerId, signal) {
  const response = await withRetry(() =>
    axiosInstance.post(
      "/crm/enquiries/counselors-by-center",
      { centerId },
      { signal },
    ),
  );
  return response?.data?.data?.counselors || [];
}

/**
 * 6. Assign Counselor
 */
export async function assignEnquiryCounselor(enquiryId, counselorId) {
  const response = await axiosInstance.post(
    "/admin/enquiries/assign-counselor",
    {
      enquiryId,
      counselorId,
    },
  );
  return response?.data;
}
