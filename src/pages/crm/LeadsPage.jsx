import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Layers, Loader2 } from "lucide-react";
import PageBanner from "../../components/figma/PageBanner";
import LeadBulkUploadModal from "../../components/leads/LeadBulkUploadModal";
import LeadEditModal from "../../components/leads/LeadEditModal";
import LeadFilterToolbar from "../../components/leads/LeadFilterToolbar";
import LeadStatCards from "../../components/leads/LeadStatCards";
import LeadsTable from "../../components/leads/LeadsTable";
import LeadViewModal from "../../components/leads/LeadViewModal";
import CrmDeleteConfirmDialog from "../../components/crm/CrmDeleteConfirmDialog";
import { toast } from "@/utils/toast";
import {
  formatLeadStatusLabel,
  LEAD_STATUS_OPTIONS,
} from "../../data/leadsData";

// Import all leads APIs
import {
  fetchCentersDropdown,
  fetchLeads,
  fetchLeadStats,
  fetchCounselorsByCenter,
  assignLeadCounselor,
  fetchLeadDetails,
  updateLeadStatus,
  editLeadAPI,
  deleteLeadAPI, // NEW IMPORT
} from "../../api/leadsAPI";

function displayValue(value) {
  return value?.trim() ? value : "—";
}

function parseCourseVisited(courseVisited) {
  const trimmed = courseVisited?.trim() || "";
  if (!trimmed) return { course: "—", courseSub: "" };
  const words = trimmed.split(/\s+/);
  if (words.length <= 2) return { course: trimmed, courseSub: "" };
  return {
    course: words.slice(0, 2).join(" "),
    courseSub: words.slice(2).join(" "),
  };
}

function leadMatchesSelectedDate(isoString, selectedDate) {
  if (!selectedDate) return true;
  if (!isoString) return false;
  const rowDate = new Date(isoString);
  const filterDate = new Date(selectedDate);
  return (
    rowDate.getFullYear() === filterDate.getFullYear() &&
    rowDate.getMonth() === filterDate.getMonth() &&
    rowDate.getDate() === filterDate.getDate()
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1,
  });

  const [statsData, setStatsData] = useState({
    totalLeads: 0,
    newLeads: 0,
    conversionRate: "0%",
    assignedLeads: 0,
  });

  const [counselorsByCenter, setCounselorsByCenter] = useState({});

  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewLead, setViewLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleteLeadId, setDeleteLeadId] = useState(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [availableCenters, setAvailableCenters] = useState([]);

  const [counselorById, setCounselorById] = useState({});
  const [statusById, setStatusById] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const loadCenters = async () => {
      const data = await fetchCentersDropdown(controller.signal);
      setAvailableCenters(data);
    };
    loadCenters();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, centerFilter, statusFilter, dateFilter]);

  const loadLiveLeads = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        let targetCenterId = "";
        if (centerFilter !== "all") {
          targetCenterId = centerFilter;
        }

        const [apiResponse, dashboardStats] = await Promise.all([
          fetchLeads(
            {
              page: currentPage,
              limit: 100,
              search,
              centerId: targetCenterId,
              status: statusFilter,
              date: dateFilter,
            },
            signal,
          ),
          fetchLeadStats(targetCenterId, dateFilter, signal),
        ]);

        const tableData = apiResponse.data;
        setPaginationInfo(apiResponse.pagination);

        const uniqueCenterIds = [
          ...new Set(tableData.map((r) => r.centerId).filter(Boolean)),
        ];
        const counselorDictionary = {};

        if (uniqueCenterIds.length > 0) {
          const counselorPromises = uniqueCenterIds.map(async (cId) => {
            try {
              const counselors = await fetchCounselorsByCenter(cId, signal);
              const options = counselors.map((c) => ({
                value: c._id,
                label: c.fullName || "Unknown Counselor",
              }));
              return { cId, options };
            } catch (err) {
              return { cId, options: [] };
            }
          });

          const results = await Promise.all(counselorPromises);
          results.forEach((res) => {
            counselorDictionary[res.cId] = [
              { value: "", label: "Select Counselor", disabled: true },
              ...res.options,
            ];
          });
        }

        setCounselorsByCenter(counselorDictionary);
        setLeads(tableData);

        setStatsData({
          totalLeads: dashboardStats.totalLeads || 0,
          newLeads: dashboardStats.newLeads || 0,
          conversionRate: `${dashboardStats.conversionRate || 0}%`,
          assignedLeads: dashboardStats.assignedLeads || 0,
        });

        const initialCounselors = {};
        const initialStatuses = {};
        tableData.forEach((row) => {
          initialCounselors[row.id] = row.assignedCounselor || "";
          initialStatuses[row.id] = row.status || "";
        });
        setCounselorById(initialCounselors);
        setStatusById(initialStatuses);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("Failed fetching leads:", error);
          toast.error("Unable to sync data from the database.");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      centerFilter,
      statusFilter,
      dateFilter,
      availableCenters,
      currentPage,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadLiveLeads(controller.signal);
    return () => controller.abort();
  }, [loadLiveLeads]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Select Status", disabled: true },
      ...LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatLeadStatusLabel(status),
      })),
    ],
    [],
  );

  const enrichLead = useCallback(
    (row) => ({
      ...row,
      assignedCounselor: counselorById[row.id] || "",
      status: statusById[row.id] || "",
    }),
    [counselorById, statusById],
  );

  const handleCounselorChange = useCallback(
    async (id, value) => {
      const previousCounselor = counselorById[id];

      setCounselorById((prev) => ({ ...prev, [id]: value }));
      setLeads((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, assignedCounselor: value } : row,
        ),
      );

      try {
        await assignLeadCounselor(id, value);
        toast.success("Counselor assigned successfully");
      } catch (error) {
        console.error("Failed to assign counselor:", error);
        toast.error("Failed to assign counselor. Reverting change.");

        setCounselorById((prev) => ({ ...prev, [id]: previousCounselor }));
        setLeads((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, assignedCounselor: previousCounselor }
              : row,
          ),
        );
      }
    },
    [counselorById],
  );

  const handleStatusChange = useCallback(
    async (leadId, value) => {
      const previousStatus = statusById[leadId];

      setStatusById((prev) => ({ ...prev, [leadId]: value }));
      setLeads((prev) =>
        prev.map((row) =>
          row.id === leadId ? { ...row, status: value } : row,
        ),
      );

      try {
        await updateLeadStatus(leadId, value);
        toast.success("Status updated successfully");
      } catch (error) {
        console.error("Failed to update status:", error);
        toast.error("Failed to update status. Reverting change.");

        setStatusById((prev) => ({ ...prev, [leadId]: previousStatus }));
        setLeads((prev) =>
          prev.map((row) =>
            row.id === leadId ? { ...row, status: previousStatus } : row,
          ),
        );
      }
    },
    [statusById],
  );

  const handleEditSave = useCallback(
    async (leadId, form) => {
      if (!editLead) return;

      try {
        await editLeadAPI(leadId, editLead.centerId, form);

        const { course, courseSub } = parseCourseVisited(form.courseVisited);

        setLeads((prev) =>
          prev.map((row) =>
            row.id === leadId
              ? {
                  ...row,
                  userName: displayValue(form.userName),
                  email: displayValue(form.email),
                  mobile: displayValue(form.mobile),
                  courseVisited: form.courseVisited,
                  course,
                  courseSub,
                  assignedCounselor: form.assignedCounselor,
                  status: form.status,
                }
              : row,
          ),
        );

        setCounselorById((prev) => ({
          ...prev,
          [leadId]: form.assignedCounselor,
        }));
        setStatusById((prev) => ({ ...prev, [leadId]: form.status }));

        toast.success("Lead updated successfully");
        setEditLead(null);
      } catch (error) {
        console.error("Failed to update lead via modal:", error);
        toast.error("Failed to update lead. Please try again.");
      }
    },
    [editLead],
  );

  // THE FIX: Full API integration for Delete Lead
  const handleConfirmDeleteLead = useCallback(async () => {
    if (deleteLeadId == null) return;

    try {
      await deleteLeadAPI(deleteLeadId);

      setLeads((prev) => prev.filter((row) => row.id !== deleteLeadId));
      setCounselorById((prev) => {
        const next = { ...prev };
        delete next[deleteLeadId];
        return next;
      });
      setStatusById((prev) => {
        const next = { ...prev };
        delete next[deleteLeadId];
        return next;
      });

      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead. Please try again.");
    } finally {
      setDeleteLeadId(null);
    }
  }, [deleteLeadId]);

  const handleView = useCallback(
    async (row) => {
      try {
        const details = await fetchLeadDetails(row.id);
        if (details) {
          const d = new Date(details.createdAt || row.date);
          const formattedDate = !isNaN(d)
            ? `${d.toLocaleDateString("en-GB")} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
            : details.createdAt;

          setViewLead({
            id: details._id,
            userName: details.userName || "Unknown",
            email: details.email || "—",
            mobileNumber: details.mobileNumber || "—",
            mobile: details.mobileNumber || "—",
            courseVisited: details.courseVisited || "—",
            course: details.courseVisited || "—",
            center: details.centerId?.centerName || details.centerName || "—",
            date: formattedDate,
            assignedCounselorName:
              details.assignedCounselorName || "Not Assigned",
            status: details.status || "NEW",
          });
        } else {
          setViewLead(enrichLead(row));
        }
      } catch (error) {
        toast.error("Could not fetch latest details.");
        setViewLead(enrichLead(row));
      }
    },
    [enrichLead],
  );

  const handleEdit = useCallback(
    async (row) => {
      try {
        const details = await fetchLeadDetails(row.id);
        if (details) {
          let counselorIdStr = "";
          if (
            details.assignedCounselorId &&
            typeof details.assignedCounselorId === "object"
          ) {
            counselorIdStr = details.assignedCounselorId._id;
          } else if (typeof details.assignedCounselorId === "string") {
            counselorIdStr = details.assignedCounselorId;
          }

          setEditLead({
            id: details._id,
            userName: details.userName || "Unknown",
            email: details.email || "—",
            mobileNumber: details.mobileNumber || "—",
            mobile: details.mobileNumber || "—",
            courseVisited: details.courseVisited || "—",
            centerId: details.centerId?._id || "",
            date: details.createdAt || new Date().toISOString(),
            assignedCounselor: counselorIdStr,
            status: details.status || "NEW",
          });
        } else {
          setEditLead(enrichLead(row));
        }
      } catch (error) {
        toast.error("Could not fetch latest details.");
        setEditLead(enrichLead(row));
      }
    },
    [enrichLead],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((row) => {
      const matchSearch =
        !q ||
        row.userName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.mobile.includes(q);

      const matchCenter =
        centerFilter === "all" || String(row.centerId) === String(centerFilter);
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      const matchDate = leadMatchesSelectedDate(row.date, dateFilter);

      return matchSearch && matchCenter && matchStatus && matchDate;
    });
  }, [leads, search, centerFilter, statusFilter, dateFilter]);

  const emptyMessage = dateFilter
    ? "No leads found for the selected date."
    : "No leads match your filters.";

  const tableResetDeps = [search, centerFilter, dateFilter, statusFilter];

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Leads"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className="inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(3,4,94,0.4)] active:scale-[0.98] sm:px-5"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Bulk Upload
          </button>
        </PageBanner>

        <LeadFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          availableCenters={availableCenters}
        />

        <LeadStatCards stats={statsData} />

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-20 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-100/80">
            <Loader2 className="h-8 w-8 animate-spin text-[#55ace7] mb-4" />
            <p className="text-sm font-medium text-slate-500">
              Fetching live leads & stats...
            </p>
          </div>
        ) : (
          <LeadsTable
            data={filtered}
            emptyMessage={emptyMessage}
            resetDeps={tableResetDeps}
            counselorById={counselorById}
            statusById={statusById}
            counselorsByCenter={counselorsByCenter}
            statusOptions={statusOptions}
            onCounselorChange={handleCounselorChange}
            onStatusChange={handleStatusChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={setDeleteLeadId}
            currentPage={currentPage}
            totalPages={paginationInfo.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </section>

      <LeadViewModal
        open={Boolean(viewLead)}
        onClose={() => setViewLead(null)}
        lead={viewLead}
      />

      {editLead && (
        <LeadEditModal
          open={Boolean(editLead)}
          onClose={() => setEditLead(null)}
          lead={editLead}
          counselorOptions={
            counselorsByCenter[editLead.centerId] || [
              { value: "", label: "Select Counselor" },
            ]
          }
          statusOptions={statusOptions}
          onSave={handleEditSave}
        />
      )}

      <CrmDeleteConfirmDialog
        open={deleteLeadId != null}
        onCancel={() => setDeleteLeadId(null)}
        onConfirm={handleConfirmDeleteLead}
      />

      <LeadBulkUploadModal
        open={bulkUploadOpen}
        onClose={() => {
          setBulkUploadOpen(false);
          loadLiveLeads(new AbortController().signal);
        }}
      />
    </div>
  );
}
