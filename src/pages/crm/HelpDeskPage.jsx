import { useEffect, useState, useCallback } from "react";
import {
  BellRing,
  Loader2,
  Ticket,
  MessageCircleCode,
  Clock,
  Activity,
} from "lucide-react";
import PageBanner from "../../components/figma/PageBanner";
import PaginatedFigmaTable from "../../components/figma/PaginatedFigmaTable";
import HelpDeskFilterToolbar from "../../components/help-desk/HelpDeskFilterToolbar";
import HelpDeskReplyPanel from "../../components/help-desk/HelpDeskReplyPanel";
import HelpDeskDescriptionCell from "../../components/help-desk/HelpDeskDescriptionCell";
import HelpDeskDescriptionModal from "../../components/help-desk/HelpDeskDescriptionModal";
import {
  HelpDeskActionCell,
  HelpDeskContactCell,
  HelpDeskDateCell,
  HelpDeskStatusCell,
} from "../../components/help-desk/helpDeskTableCells";
import {
  fetchHelpDeskTickets,
  fetchHelpDeskDetails,
  sendHelpDeskReply,
  fetchHelpDeskStats,
} from "../../api/helpDeskAPI";
import { toast } from "@/utils/toast";

const FIRST_CELL = "pl-6 sm:pl-8";

export default function HelpDeskPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    repliedTickets: 0,
    notRepliedTickets: 0,
    replyRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [viewTicketId, setViewTicketId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchingReply, setFetchingReply] = useState(false);

  // Load both tickets and stats concurrently
  const loadLiveTickets = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        const [ticketsData, statsData] = await Promise.all([
          fetchHelpDeskTickets(
            {
              page: 1,
              limit: 100,
              search,
              status: statusFilter,
              date: dateFilter,
            },
            signal,
          ),
          fetchHelpDeskStats(signal),
        ]);

        setTickets(ticketsData);
        setStats(statsData);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("Failed fetching tickets or stats:", error);
          toast.error("Unable to sync data from the server.");
        }
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, dateFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadLiveTickets(controller.signal);
    return () => controller.abort();
  }, [loadLiveTickets]);

  const activeTicket = tickets.find((t) => t.id === activeTicketId);
  const viewTicket = tickets.find((t) => t.id === viewTicketId);

  const openReply = async (ticket) => {
    setViewTicketId(null);
    setActiveTicketId(ticket.id);
    setReplyText("");

    if (ticket.status === "Replied") {
      setFetchingReply(true);
      try {
        const details = await fetchHelpDeskDetails(ticket._id);
        if (details && details.replyMessage) {
          setReplyText(details.replyMessage);
        }
      } catch (error) {
        console.error("Failed to load previous reply:", error);
      } finally {
        setFetchingReply(false);
      }
    }
  };

  const closeReply = () => {
    setActiveTicketId(null);
    setReplyText("");
  };

  const openDescription = (ticket) => {
    setViewTicketId(ticket.id);
  };

  const closeDescription = () => {
    setViewTicketId(null);
  };

  // --- SMART UI WORKAROUND FOR MISSING API ---
  const handleStatusChange = async (ticket) => {
    if (ticket.status === "Replied") {
      // Backend doesn't support un-replying. Tell the user gracefully.
      toast.info(
        "Tickets cannot be marked as unreplied. You can send a new message to update the reply.",
      );
      return;
    } else {
      // If it is 'Not Replied', they clicked the toggle. We force them to open the reply panel because the backend needs a message!
      openReply(ticket);
      toast.message("Please type your message to mark this ticket as replied.");
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await sendHelpDeskReply(activeTicket._id, replyText.trim());

      // Update local UI
      setTickets((prev) =>
        prev.map((t) =>
          t._id === activeTicket._id ? { ...t, status: "Replied" } : t,
        ),
      );

      toast.success("Reply sent successfully!");
      closeReply();

      // Refresh stats quietly in the background after replying
      fetchHelpDeskStats()
        .then(setStats)
        .catch(() => {});
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reply to server.");
    } finally {
      setSending(false);
    }
  };

  const emptyMessage = loading
    ? "Syncing tickets with backend..."
    : "No help desk tickets match your filters.";

  const columns = [
    {
      key: "id",
      label: "ID",
      headerClassName: `${FIRST_CELL} w-[88px] min-w-[88px]`,
      cellClassName: `${FIRST_CELL} w-[88px] min-w-[88px] align-middle font-semibold text-[#111]`,
    },
    {
      key: "userName",
      label: "User Name",
      headerClassName: "min-w-[128px]",
      cellClassName: "min-w-[128px] align-middle font-medium text-[#111]",
    },
    {
      key: "contact",
      label: "Email ID | Mobile Number",
      headerClassName: "min-w-[220px]",
      cellClassName: "min-w-[220px] align-middle",
      render: (row) => (
        <HelpDeskContactCell email={row.email} mobile={row.mobile} />
      ),
    },
    {
      key: "description",
      label: "Description",
      headerClassName: "w-[280px] min-w-[280px]",
      cellClassName: "w-[280px] min-w-[280px] align-top",
      render: (row) => (
        <HelpDeskDescriptionCell
          description={row.description}
          onView={() => openDescription(row)}
        />
      ),
    },
    {
      key: "date",
      label: "Date",
      headerClassName: "w-[180px] min-w-[180px]",
      cellClassName: "w-[180px] min-w-[180px] align-middle",
      render: (row) => <HelpDeskDateCell time={row.time} date={row.date} />,
    },
    {
      key: "status",
      label: "Status",
      headerClassName: "w-[140px] min-w-[140px] text-center",
      cellClassName: "w-[140px] min-w-[140px] align-middle",
      render: (row) => <HelpDeskStatusCell status={row.status} />,
    },
    {
      key: "action",
      label: "Action",
      headerClassName: "w-[168px] min-w-[168px] text-center",
      cellClassName: "w-[168px] min-w-[168px] align-middle",
      render: (row) => (
        <HelpDeskActionCell
          status={row.status}
          onReply={() => openReply(row)}
          onToggleReplyStatus={() => handleStatusChange(row)}
        />
      ),
    },
  ];

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={BellRing}
          iconClassName="text-[#55ace7]"
          title="Help Desk"
          className="from-[#55ace7] via-[#7eb3d4] to-[#df8284]"
        />

        {/* --- NEW LIVE DASHBOARD METRICS --- */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Total Tickets
              </p>
              <h4 className="text-2xl font-bold text-slate-900">
                {stats.totalTickets}
              </h4>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <MessageCircleCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Replied</p>
              <h4 className="text-2xl font-bold text-slate-900">
                {stats.repliedTickets}
              </h4>
            </div>
          </div>
          <div className="rounded-xl border border-rose-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <h4 className="text-2xl font-bold text-slate-900">
                {stats.notRepliedTickets}
              </h4>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Response Rate
              </p>
              <h4 className="text-2xl font-bold text-slate-900">
                {stats.replyRate}%
              </h4>
            </div>
          </div>
        </div>

        <HelpDeskFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-20 shadow-sm border border-slate-100">
            <Loader2 className="h-8 w-8 animate-spin text-[#55ace7] mb-4" />
            <p className="text-sm font-medium text-slate-500">
              Connecting to server, loading tickets...
            </p>
          </div>
        ) : (
          <PaginatedFigmaTable
            columns={columns}
            data={tickets}
            emptyMessage={emptyMessage}
            className="min-w-[1040px] rounded-xl shadow-[0_11px_25px_rgba(15,23,42,0.07)]"
            itemLabel="tickets"
            initialPageSize={10}
            resetDeps={[search, dateFilter, statusFilter]}
            density="helpdesk"
            rowClassName="transition-colors duration-150 hover:bg-[#f8fbff]"
          />
        )}
      </section>

      <HelpDeskReplyPanel
        ticket={activeTicket}
        open={Boolean(activeTicket)}
        replyText={replyText}
        onReplyChange={setReplyText}
        onClose={closeReply}
        onSend={handleSendReply}
        sending={sending || fetchingReply}
      />

      <HelpDeskDescriptionModal
        ticket={viewTicket}
        open={Boolean(viewTicket)}
        onClose={closeDescription}
      />
    </div>
  );
}
