import { Ban, Circle, Eye, Pencil, Trash2 } from "lucide-react";

const viewEditClassName =
  "inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5A6A85] transition hover:text-[#246392] disabled:cursor-not-allowed disabled:opacity-50";

const statusClassName =
  "inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#B25E09] transition hover:text-[#8F4A07] disabled:cursor-not-allowed disabled:opacity-50";

const deleteClassName =
  "inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#C00040] transition hover:text-[#9A0033] disabled:cursor-not-allowed disabled:opacity-50";

export default function CouponTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  disabled = false,
}) {
  const isActive = row.status === "Active";

  return (
    <div className="flex flex-nowrap items-center gap-4 whitespace-nowrap">
      <button
        type="button"
        onClick={onView}
        disabled={disabled}
        title="View"
        aria-label={`View ${row.name}`}
        className={viewEditClassName}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        title="Edit"
        aria-label={`Edit ${row.name}`}
        className={viewEditClassName}
      >
        <Pencil
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={2.4}
          aria-hidden
        />
        Edit
      </button>
      {/* Status toggle removed: backend does not provide enable/disable API for coupons */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        title="Delete"
        aria-label={`Delete ${row.name}`}
        className={deleteClassName}
      >
        <Trash2
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={2.4}
          aria-hidden
        />
        Delete
      </button>
    </div>
  );
}
