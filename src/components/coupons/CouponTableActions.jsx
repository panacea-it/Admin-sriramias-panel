import { Ban, Circle, Eye, Pencil } from 'lucide-react';

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
      </div>
  );
}
