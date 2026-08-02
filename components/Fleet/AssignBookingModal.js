"use client";

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AssignBookingModal({
  booking,
  drivers,
  onAssign,
  onClose,
  assigning,
}) {
  if (!booking) return null;

  const pickup =
    booking.pickupLocation?.label ||
    booking.pickupLocation?.name ||
    "Pickup";
  const dropoff =
    booking.dropoffLocation?.label ||
    booking.dropoffLocation?.name ||
    "Dropoff";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-fleet-border bg-obsidian">
        <div className="flex items-start justify-between gap-3 border-b border-fleet-border px-5 py-4">
          <div>
            <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-ash">
              Assign driver
            </p>
            <p className="line-clamp-1 font-body text-[14px] font-medium leading-snug text-paper">
              {pickup} → {dropoff}
            </p>
            <p className="mt-0.5 font-body text-[12px] text-ash">
              {fmt(booking.time)} · {booking.selectedCar || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 shrink-0 text-ash hover:text-frost"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto px-4 py-3">
          {drivers.length === 0 && (
            <p className="py-6 text-center font-body text-[14px] text-ash">
              No drivers in your fleet yet.
            </p>
          )}
          {drivers.map((d) => (
            <button
              key={d._id}
              type="button"
              disabled={!!assigning}
              onClick={() => onAssign(d._id, booking._id)}
              className="flex w-full items-center gap-3 rounded-xl border border-fleet-border p-3 text-left transition-all hover:border-fleet-border-strong hover:bg-graphite disabled:opacity-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-graphite font-body text-[14px] font-medium text-frost">
                {d.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-[14px] font-medium text-paper">
                  {d.name}
                </p>
                <p className="truncate font-body text-[11px] text-ash">
                  {d.email}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold ${
                  d.isActive
                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                    : "border-fleet-border bg-fleet-muted text-frost"
                }`}
              >
                {d.isActive ? "Active" : "Inactive"}
              </span>
              {assigning === d._id && (
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-fleet-border-strong border-t-paper" />
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-fleet-border bg-graphite/50 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-fleet-border-strong py-2 font-body text-[14px] text-frost transition-colors hover:bg-fleet-hover"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
