import { useMemo, useRef } from "react";
import { cn } from "../../utils/cn";
import { usePagination } from "../../hooks/usePagination";
import TablePagination from "../figma/TablePagination";
import TableSelectionCheckbox from "../figma/TableSelectionCheckbox";

export default function ManageUsersTable({
  columns,
  data,
  emptyMessage = "No users match your search or filters.",
  itemLabel = "users",
  resetDeps = [],
  selection,
  serverPagination = false,
  totalItems,
  totalPages,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const tableRef = useRef(null);
  const { paginatedItems: localPaginatedItems, ...localPagination } =
    usePagination(data, {
      resetDeps,
    });

  const useServerPagination = Boolean(serverPagination);
  const paginatedItems = useServerPagination ? data : localPaginatedItems;
  const pagination = useServerPagination
    ? {
        page: Math.min(
          Math.max(1, Number(page) || 1),
          Math.max(1, Number(totalPages) || 1),
        ),
        pageSize: Number(pageSize) || 10,
        totalItems: Number(totalItems) || 0,
        totalPages: Math.max(1, Number(totalPages) || 1),
        startIndex:
          Number(totalItems) === 0
            ? 0
            : (Math.min(
                Math.max(1, Number(page) || 1),
                Math.max(1, Number(totalPages) || 1),
              ) -
                1) *
              (Number(pageSize) || 10),
        endIndex: Math.min(
          (Math.min(
            Math.max(1, Number(page) || 1),
            Math.max(1, Number(totalPages) || 1),
          ) -
            1) *
            (Number(pageSize) || 10) +
            (Number(pageSize) || 10),
          Number(totalItems) || 0,
        ),
        setPage: onPageChange,
        setPageSize: onPageSizeChange,
      }
    : localPagination;

  const resolvedColumns = useMemo(() => {
    if (!selection) return columns;
    const getRowId = selection.getRowId ?? ((row) => row.id);
    const pageIds = paginatedItems.map((row) => getRowId(row));
    const allPageSelected =
      pageIds.length > 0 &&
      pageIds.every((id) => selection.selectedIds.includes(id));
    const somePageSelected = pageIds.some((id) =>
      selection.selectedIds.includes(id),
    );

    return [
      {
        key: "__select",
        label: (
          <TableSelectionCheckbox
            variant="header"
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => selection.onTogglePage?.(pageIds, !allPageSelected)}
            aria-label="Select all on this page"
            className="border-white/60 bg-white accent-[#1D72B8]"
          />
        ),
        headerClassName: "w-12 pl-6",
        cellClassName: "w-12 pl-6",
        render: (row) => {
          const id = getRowId(row);
          return (
            <TableSelectionCheckbox
              checked={selection.selectedIds.includes(id)}
              onChange={() => selection.onToggle?.(id)}
              aria-label={`Select row ${id}`}
            />
          );
        },
      },
      ...columns,
    ];
  }, [columns, selection, paginatedItems]);

  const handlePageChange = (nextPage) => {
    if (useServerPagination) {
      onPageChange?.(nextPage);
    } else {
      pagination.setPage(nextPage);
    }
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handlePageSizeChange = (nextSize) => {
    if (useServerPagination) {
      onPageSizeChange?.(nextSize);
    } else {
      pagination.setPageSize(nextSize);
    }
  };

  return (
    <div
      ref={tableRef}
      className="min-w-0 overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-none"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#55ace7]">
              {resolvedColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-11 min-h-[44px] whitespace-nowrap px-4 py-2.5 text-left text-sm font-semibold text-white first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.headerClassName,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className="min-h-[52px] cursor-pointer border-b border-[#E5E7EB] transition-colors duration-200 last:border-0 hover:bg-[#eef6fc]/70"
              >
                {resolvedColumns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 align-middle text-sm font-medium first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.cellClassName,
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedItems.length === 0 && (
          <p className="py-16 text-center text-sm font-medium text-[#667085]">
            {emptyMessage}
          </p>
        )}
      </div>

      {data.length > 0 && (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemLabel={itemLabel}
          className="border-t border-[#E7ECF5] bg-[#F5F7FB]/60"
        />
      )}
    </div>
  );
}
