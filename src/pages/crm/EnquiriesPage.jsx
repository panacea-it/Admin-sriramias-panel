import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { toast } from "@/utils/toast";
import PageBanner from "../../components/figma/PageBanner";
import EnquiriesTable from "../../components/enquiries/EnquiriesTable";
import EnquiryEditModal from "../../components/enquiries/EnquiryEditModal";
import EnquiryEmptyState from "../../components/enquiries/EnquiryEmptyState";
import EnquiryFilterToolbar from "../../components/enquiries/EnquiryFilterToolbar";
import EnquiryStatCards from "../../components/enquiries/EnquiryStatCards";
import EnquiryViewModal from "../../components/enquiries/EnquiryViewModal";
import {
  fetchCentersDropdown,
  fetchEnquiries,
  fetchEnquiryStats,
  updateEnquiryLeadStatus,
  fetchCounselorsByCenter,
  assignEnquiryCounselor,
} from "../../api/enquiriesAPI";
import {
  ENQUIRY_LEAD_STATUS_OPTIONS,
  enquiryMatchesSelectedDate,
  formatEnquiryLeadStatusLabel,
  matchesSourcePage,
} from "../../data/enquiriesData";

// RESTORED FILTER FUNCTION
function matchesType(rowType, filter) {
  if (filter === "all") return true;
  if (filter === "Admission")
    return rowType.includes("Admission") || rowType.includes("ADMISSION");
  if (filter === "Demo")
    return rowType.includes("Demo") || rowType.includes("DEMO");
  return true;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1,
  });

  const [statsData, setStatsData] = useState({
    total: 0,
    newThisWeek: 0,
    conversionRate: "0%",
    actionPending: 0,
  });

  const [counselorsByCenter, setCounselorsByCenter] = useState({});

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourcePageFilter, setSourcePageFilter] = useState("all");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);

  const [availableCenters, setAvailableCenters] = useState([]);
  const [counselorById, setCounselorById] = useState({});
  const [leadStatusById, setLeadStatusById] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const loadCenters = async () => {
      try {
        const data = await fetchCentersDropdown(controller.signal);
        setAvailableCenters(data);
      } catch (error) {
        if (error?.name !== "CanceledError")
          console.error("Failed to load centers:", error);
      }
    };
    loadCenters();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, centerFilter, typeFilter, dateFilter, sourcePageFilter]);

  const loadLiveEnquiries = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        let targetCenterId = "";
        if (centerFilter !== "all") {
          const match = availableCenters.find(
            (c) => c.centerName.toLowerCase() === centerFilter.toLowerCase(),
          );
          if (match) targetCenterId = match._id;
        }

        const [apiResponse, dashboardStats] = await Promise.all([
          fetchEnquiries(
            {
              page: currentPage,
              limit: 100, // Fetching enough to allow frontend filtering to work smoothly
              search,
              center: targetCenterId,
              type: typeFilter,
              date: dateFilter,
              sourcePage: sourcePageFilter,
            },
            signal,
          ),
          fetchEnquiryStats(targetCenterId, signal),
        ]);

        const tableData = apiResponse.data || [];
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
              console.error(
                `Failed fetching counselors for center ${cId}`,
                err,
              );
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
        setEnquiries(tableData);

        setStatsData({
          total: dashboardStats.total || dashboardStats.totalEnquiries || 0,
          newThisWeek: dashboardStats.newThisWeek || 0,
          conversionRate: `${dashboardStats.conversionRate || 0}%`,
          actionPending:
            dashboardStats.actionPending || dashboardStats.pending || 0,
        });

        const initialCounselors = {};
        const initialStatuses = {};
        tableData.forEach((row) => {
          initialCounselors[row.id] = row.assignedCounselor || "";
          initialStatuses[row.id] = row.leadStatus || "";
        });
        setCounselorById(initialCounselors);
        setLeadStatusById(initialStatuses);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("Failed fetching data:", error);
          toast.error("Unable to sync data from the database.");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      centerFilter,
      typeFilter,
      dateFilter,
      sourcePageFilter,
      availableCenters,
      currentPage,
      pageSize,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadLiveEnquiries(controller.signal);
    return () => controller.abort();
  }, [loadLiveEnquiries]);

  const enrichEnquiry = useCallback(
    (row) => ({
      ...row,
      assignedCounselor: counselorById[row.id] || row.assignedCounselor || "",
      leadStatus: leadStatusById[row.id] || row.leadStatus || "",
    }),
    [counselorById, leadStatusById],
  );

  const handleView = useCallback(
    (row) => setViewRow(enrichEnquiry(row)),
    [enrichEnquiry],
  );
  const handleEdit = useCallback(
    (row) => setEditRow(enrichEnquiry(row)),
    [enrichEnquiry],
  );

  const handleCounselorChange = useCallback(
    async (id, value) => {
      const previousCounselor = counselorById[id];

      setCounselorById((prev) => ({ ...prev, [id]: value }));
      setEnquiries((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, assignedCounselor: value } : row,
        ),
      );

      try {
        await assignEnquiryCounselor(id, value);
        toast.success("Counselor assigned successfully");
      } catch (error) {
        console.error("Failed to assign counselor:", error);
        toast.error("Failed to assign counselor. Reverting change.");

        setCounselorById((prev) => ({ ...prev, [id]: previousCounselor }));
        setEnquiries((prev) =>
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

  const handleLeadStatusChange = useCallback(
    async (id, value) => {
      const previousStatus = leadStatusById[id];

      setCounselorById((prev) => ({ ...prev }));
      setLeadStatusById((prev) => ({ ...prev, [id]: value }));
      setEnquiries((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, leadStatus: value } : row,
        ),
      );

      try {
        await updateEnquiryLeadStatus(id, value);
        toast.success("Status updated successfully");
      } catch (error) {
        console.error("Failed to update status:", error);
        toast.error("Failed to update status. Reverting change.");

        setLeadStatusById((prev) => ({ ...prev, [id]: previousStatus }));
        setEnquiries((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, leadStatus: previousStatus } : row,
          ),
        );
      }
    },
    [leadStatusById],
  );

  const leadStatusOptions = useMemo(
    () => [
      { value: "", label: "Select Status", disabled: true },
      ...ENQUIRY_LEAD_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatEnquiryLeadStatusLabel(status),
      })),
    ],
    [],
  );

  // RESTORED: Bulletproof Frontend Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((row) => {
      const matchSearch =
        !q ||
        row.student.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.enquiryType.toLowerCase().includes(q);

      const matchCenter =
        centerFilter === "all" ||
        String(row.center).toLowerCase() === String(centerFilter).toLowerCase();

      const matchDate = enquiryMatchesSelectedDate(row.enquiryDate, dateFilter);
      const matchType = matchesType(row.enquiryType, typeFilter);
      const matchSourcePage = matchesSourcePage(row.sourcePage, sourcePageFilter);
      return matchSearch && matchCenter && matchDate && matchType && matchSourcePage;
    });
  }, [enquiries, search, centerFilter, dateFilter, typeFilter, sourcePageFilter]);

  const handleEditSave = useCallback(
    async (form) => {
      if (!editRow) return;

      try {
        const updatePromises = [];

        if (form.leadStatus !== editRow.leadStatus) {
          updatePromises.push(
            updateEnquiryLeadStatus(editRow.id, form.leadStatus),
          );
        }

        if (form.assignedCounselor !== editRow.assignedCounselor) {
          updatePromises.push(
            assignEnquiryCounselor(editRow.id, form.assignedCounselor),
          );
        }

        await Promise.all(updatePromises);

        setEnquiries((prev) =>
          prev.map((row) =>
            row.id === editRow.id
              ? {
                  ...row,
                  student: form.student.trim(),
                  email: form.email.trim(),
                  phone: form.phone.trim(),
                  center: form.center,
                  enquiryType: form.enquiryType,
                  assignedCounselor: form.assignedCounselor,
                  leadStatus: form.leadStatus,
                }
              : row,
          ),
        );

        setCounselorById((prev) => ({
          ...prev,
          [editRow.id]: form.assignedCounselor,
        }));
        setLeadStatusById((prev) => ({
          ...prev,
          [editRow.id]: form.leadStatus,
        }));

        toast.success("Enquiry updated successfully");
        setEditRow(null);
      } catch (error) {
        console.error("Failed to update enquiry via modal:", error);
        toast.error("Failed to update enquiry. Please try again.");
      }
    },
    [editRow],
  );

  const emptyMessage = dateFilter
    ? "No enquiries found for the selected date."
    : "No enquiries match your filters.";

  const tableResetDeps = [search, centerFilter, dateFilter, typeFilter, sourcePageFilter];

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Enquiries"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        />

        <EnquiryFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
          sourcePage={sourcePageFilter}
          onSourcePageChange={(e) => setSourcePageFilter(e.target.value)}
        />

        <EnquiryStatCards stats={statsData} />

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-20 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-100/80">
            <Loader2 className="h-8 w-8 animate-spin text-[#55ace7] mb-4" />
            <p className="text-sm font-medium text-slate-500">
              Fetching live enquiries & stats...
            </p>
          </div>
        ) : (
          <EnquiriesTable
            data={filtered}
            emptyMessage={emptyMessage}
            emptyState={
              <EnquiryEmptyState
                message={
                  dateFilter
                    ? "No enquiries found for the selected date."
                    : "No enquiries match your filters. Try adjusting your search or filters."
                }
              />
            }
            resetDeps={tableResetDeps}
            counselorById={counselorById}
            leadStatusById={leadStatusById}
            counselorsByCenter={counselorsByCenter}
            leadStatusOptions={leadStatusOptions}
            onCounselorChange={handleCounselorChange}
            onLeadStatusChange={handleLeadStatusChange}
            onView={handleView}
            onEdit={handleEdit}
            currentPage={currentPage}
            totalPages={paginationInfo.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </section>

      <EnquiryViewModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        enquiry={viewRow}
      />

      {editRow && (
        <EnquiryEditModal
          open={Boolean(editRow)}
          onClose={() => setEditRow(null)}
          enquiry={editRow}
          assignedCounselor={editRow?.assignedCounselor ?? ""}
          leadStatus={editRow?.leadStatus ?? ""}
          counselorOptions={
            counselorsByCenter[editRow.centerId] || [
              { value: "", label: "Select Counselor" },
            ]
          }
          leadStatusOptions={leadStatusOptions}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
