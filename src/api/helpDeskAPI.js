import axiosInstance from "./axiosInstance";

/**
 * 1. Fetches help desk tickets from the live CRM backend
 * POST /api/crm/helpdesk/list
 */
export async function fetchHelpDeskTickets(
  { page = 1, limit = 50, search = "", status = "ALL", date = "" } = {},
  signal,
) {
  let backendStatus = "ALL";
  if (status === "Replied") backendStatus = "REPLIED";
  if (status === "Not Replied") backendStatus = "NOT_REPLIED";

  const response = await axiosInstance.post(
    "/crm/helpdesk/list",
    {
      page,
      limit,
      search: search.trim(),
      status: backendStatus,
      date: date || "",
    },
    { signal },
  );

  const rows = response?.data?.data?.tickets || [];

  return rows.map((row) => {
    const createdDate = new Date(row.createdAt);
    return {
      id: row.ticketNumber || "HD000000",
      _id: row._id,
      ticketNumber: row.ticketNumber,
      userName: row.studentName || "Student",
      email: row.email || "—",
      mobile: row.mobile || "—",
      subject: row.subject || "No Subject",
      description: row.description || "No Description",
      date: !isNaN(createdDate) ? createdDate.toLocaleDateString("en-GB") : "—",
      time: !isNaN(createdDate)
        ? createdDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      status: row.status === "REPLIED" ? "Replied" : "Not Replied",
    };
  });
}

/**
 * 2. Updates a ticket status in the live CRM backend
 * PUT /api/crm/helpdesk/status
 */
export async function updateHelpDeskStatus(ticketId, nextStatus) {
  const backendStatus = nextStatus === "Replied" ? "REPLIED" : "NOT_REPLIED";
  const response = await axiosInstance.put("/crm/helpdesk/status", {
    ticketId,
    status: backendStatus,
  });
  return response.data;
}

/**
 * 3. Fetches full details for a single help desk ticket, including reply history
 * POST /api/crm/helpdesk/details
 */
export async function fetchHelpDeskDetails(ticketId, signal) {
  const response = await axiosInstance.post(
    "/crm/helpdesk/details",
    {
      ticketId,
    },
    { signal },
  );

  const ticket = response?.data?.data?.ticket;
  if (!ticket) return null;

  return {
    ...ticket,
    id: ticket.ticketNumber,
    replyMessage: ticket.reply?.message || "",
    repliedBy: ticket.reply?.repliedByName || "Admin",
    repliedAt: ticket.reply?.repliedAt || null,
  };
}

/**
 * 4. Sends a text reply to a ticket
 * POST /api/crm/helpdesk/reply
 */
export async function sendHelpDeskReply(ticketId, replyMessage) {
  const response = await axiosInstance.post("/crm/helpdesk/reply", {
    ticketId: ticketId,
    reply: replyMessage,
  });
  return response.data;
}

/**
 * 5. Fetches dashboard metric stats for the top of the page
 * POST /api/crm/helpdesk/dashboard-stats
 */
export async function fetchHelpDeskStats(signal) {
  const response = await axiosInstance.post(
    "/crm/helpdesk/dashboard-stats",
    {},
    { signal },
  );
  return (
    response?.data?.data || {
      totalTickets: 0,
      repliedTickets: 0,
      notRepliedTickets: 0,
      replyRate: 0,
    }
  );
}
