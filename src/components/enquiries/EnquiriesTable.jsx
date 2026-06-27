import { useMemo } from "react";
import PaginatedFigmaTable from "../figma/PaginatedFigmaTable";
import EnquiryCounselorSelect from "./EnquiryCounselorSelect";
import EnquiryLeadStatusSelect from "./EnquiryLeadStatusSelect";
import EnquiryTableActions from "./EnquiryTableActions";
import { cn } from "../../utils/cn";

const ENQUIRIES_TABLE_MIN_WIDTH = 1470;

const COLUMN = {
  student: 160,
  contact: 260,
  enquiryType: 160,
  sourcePage: 150,
  center: 130,
  enquiryDate: 130,
  counselor: 180,
  leadStatus: 180,
  actions: 120,
};

const CELL = "align-middle";

function TextCell({ value, className }) {
  const text = value?.trim() ? value : "—";
  return (
    <span
      className={cn(
        "block text-sm leading-snug [overflow-wrap:anywhere]",
        text === "—" ? "text-[#9ca0a8]" : "text-[#111111]",
        className,
      )}
    >
      {text}
    </span>
  );
}

function ContactCell({ email, phone }) {
  return (
    <span className="block text-sm leading-snug text-[#111111] [overflow-wrap:anywhere]">
      {email}
      <span className="text-[#9ca0a8]"> | </span>
      {phone}
    </span>
  );
}

const TABLE_CLASS = cn(
  "rounded-none border-0 shadow-none",
  "[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]",
  "[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]",
  "[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent",
  "[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm",
  "[&_tbody_td]:align-middle",
);

export default function EnquiriesTable({
  data,
  emptyMessage,
  emptyState,
  resetDeps,
  counselorById,
  leadStatusById,
  counselorsByCenter, // NEW: The dictionary from the parent
  leadStatusOptions,
  onCounselorChange,
  onLeadStatusChange,
  onView,
  onEdit,
}) {
  const columns = useMemo(
    () => [
      {
        key: "student",
        label: "Student",
        width: COLUMN.student,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <TextCell value={row.student} className="font-semibold" />
        ),
      },
      {
        key: "contact",
        label: "Contact Details",
        width: COLUMN.contact,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <ContactCell email={row.email} phone={row.phone} />,
      },
      {
        key: "enquiryType",
        label: "Enquiry Type",
        width: COLUMN.enquiryType,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block whitespace-nowrap text-sm font-medium leading-snug text-[#111111]">
            {row.enquiryType}
          </span>
        ),
      },
      {
        key: "sourcePage",
        label: "Source Page",
        width: COLUMN.sourcePage,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block whitespace-nowrap text-sm font-medium leading-snug text-[#111111]">
            {row.sourcePage || "Other"}
          </span>
        ),
      },
      {
        key: "center",
        label: "Center",
        width: COLUMN.center,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block whitespace-nowrap text-sm font-medium leading-snug text-[#111111]">
            {row.center}
          </span>
        ),
      },
      {
        key: "enquiryDate",
        label: "Enquiry Date",
        width: COLUMN.enquiryDate,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block whitespace-nowrap text-sm leading-snug text-[#111111]">
            {row.enquiryDate}
          </span>
        ),
      },
      {
        key: "assignedCounselor",
        label: "Assigned Counselor",
        width: COLUMN.counselor,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <EnquiryCounselorSelect
            value={counselorById[row.id] || row.assignedCounselor || ""}
            onChange={(value) => onCounselorChange(row.id, value)}
            options={
              counselorsByCenter[row.center] || [
                { value: '', label: 'No Counselors', disabled: true },
              ]
            }
            placeholder="Select Counselor"
            ariaLabel={`Assigned counselor for ${row.student}`}
          />
        ),
      },
      {
        key: "leadStatus",
        label: "Lead Status",
        width: COLUMN.leadStatus,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <EnquiryLeadStatusSelect
            value={leadStatusById[row.id] || row.leadStatus || ""}
            onChange={(value) => onLeadStatusChange(row.id, value)}
            options={leadStatusOptions}
            placeholder="Select Status"
            ariaLabel={`Lead status for ${row.student}`}
          />
        ),
      },
      {
        key: "actions",
        label: "Actions",
        width: COLUMN.actions,
        align: "center",
        headerTruncate: false,
        headerClassName: cn(CELL, "text-center"),
        cellClassName: cn(CELL, "text-center"),
        render: (row) => (
          <EnquiryTableActions
            onView={() => onView(row)}
            onEdit={() => onEdit(row)}
          />
        ),
      },
    ],
    [
      counselorById,
      leadStatusById,
      counselorsByCenter, // Updated dependency
      leadStatusOptions,
      onCounselorChange,
      onLeadStatusChange,
      onView,
      onEdit,
    ],
  );

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="enquiries"
      resetDeps={resetDeps}
      rowClassName="hover:bg-[#eef6fc]/70"
      zebraStriping
      density="comfortable"
      tableMinWidth={ENQUIRIES_TABLE_MIN_WIDTH}
      tableLayoutFixed
      gradientActivePage
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      tableClassName={TABLE_CLASS}
      paginationClassName="border-t border-[#E5E7EB] bg-white"
    />
  );
}
