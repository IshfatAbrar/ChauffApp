"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FleetPageHeader from "../../../components/Fleet/FleetPageHeader";
import AssignBookingModal from "../../../components/Fleet/AssignBookingModal";
import { bookingService } from "../../../services/bookingService";

/* ─── helpers ──────────────────────────────────────────────── */

const STATUS_MAP = {
  requested: { label: "Requested", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  accepted:  { label: "Assigned",  cls: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  in_progress: { label: "In progress", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  completed:   { label: "Completed",   cls: "bg-fleet-muted text-frost border-fleet-border" },
  cancelled:   { label: "Cancelled",   cls: "bg-red-500/20 text-red-300 border-red-500/30" },
};

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-fleet-muted text-frost border-fleet-border" };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

/* ─── Toast ────────────────────────────────────────────────── */

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-xl text-sm font-medium transition-all
        ${isErr ? "bg-red-600 text-white" : "bg-paper text-fleet-on-paper"}`}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-xs ml-1">✕</button>
    </div>
  );
}

/* ─── Timeline Modal ────────────────────────────────────────── */

function TimelineModal({ booking, timeline, onUpdate, onClose, updating }) {
  const pickup  = booking.pickupLocation?.label  || booking.pickupLocation?.name  || "Pickup";
  const dropoff = booking.dropoffLocation?.label || booking.dropoffLocation?.name || "Dropoff";
  const hasArrive = !!timeline?.arrive;
  const hasStart  = !!timeline?.start;

  const stamp = (key, extra = {}) => {
    onUpdate(booking._id, { ...extra, [key]: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-obsidian border border-fleet-border rounded-2xl overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b border-fleet-border flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ash mb-0.5">Trip timeline</p>
            <p className="text-sm font-semibold text-paper leading-snug">
              {pickup} → {dropoff}
            </p>
            <p className="text-xs text-ash mt-0.5">
              {booking.chauffeur?.name || "Driver unknown"} · {fmt(booking.time)}
            </p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-frost shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Timeline steps */}
          <div className="space-y-2">
            {/* Arrive */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-fleet-border bg-graphite">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasArrive ? "bg-emerald-400" : "bg-fleet-muted"}`} />
                <div>
                  <p className="text-xs font-medium text-frost">Arrived at pickup</p>
                  <p className="text-[11px] text-ash">{hasArrive ? fmt(timeline.arrive) : "Not yet stamped"}</p>
                </div>
              </div>
              {!hasArrive && (
                <button
                  disabled={!!updating}
                  onClick={() => stamp("arrive")}
                  className="px-3 py-1.5 text-xs font-semibold bg-paper text-fleet-on-paper rounded-full hover:opacity-85 disabled:opacity-50 shrink-0"
                >
                  Mark Arrived
                </button>
              )}
            </div>

            {/* Start */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-fleet-border bg-graphite">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasStart ? "bg-emerald-400" : "bg-fleet-muted"}`} />
                <div>
                  <p className="text-xs font-medium text-frost">Ride started</p>
                  <p className="text-[11px] text-ash">{hasStart ? fmt(timeline.start) : "Not yet stamped"}</p>
                </div>
              </div>
              {hasArrive && !hasStart && (
                <button
                  disabled={!!updating}
                  onClick={() => stamp("start")}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-500/30 text-sky-200 border border-sky-500/40 rounded-full hover:bg-sky-500/40 disabled:opacity-50 shrink-0"
                >
                  Start Ride
                </button>
              )}
              {!hasArrive && !hasStart && (
                <span className="text-[11px] text-ash italic shrink-0">Needs arrive first</span>
              )}
            </div>

            {/* Stop */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-fleet-border bg-graphite">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${timeline?.stop ? "bg-emerald-400" : "bg-fleet-muted"}`} />
                <div>
                  <p className="text-xs font-medium text-frost">Ride ended</p>
                  <p className="text-[11px] text-ash">{timeline?.stop ? fmt(timeline.stop) : "Not yet stamped"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waypoints */}
          {timeline?.waypoints?.length > 0 && (
            <div className="pt-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ash mb-2">Stopovers</p>
              <div className="space-y-1.5">
                {timeline.waypoints.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-frost p-2.5 rounded-lg bg-graphite border border-fleet-border">
                    <span className="font-medium text-paper shrink-0">{w.name || `Stop ${i + 1}`}</span>
                    {w.arrival && <span className="text-ash">Arr {fmt(w.arrival)}</span>}
                    {w.departure && <span className="text-ash">Dep {fmt(w.departure)}</span>}
                    {w.waitingTime && <span className="text-ash">Wait {w.waitingTime}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          <div className="pt-1 flex gap-2">
            <button
              disabled={!!updating}
              onClick={() => onUpdate(booking._id, {})}
              className="flex-1 py-2 rounded-full border border-fleet-border-strong text-xs text-frost hover:bg-fleet-hover transition disabled:opacity-50"
            >
              Reset timeline
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-full bg-paper text-fleet-on-paper text-xs hover:opacity-85 transition"
            >
              Close
            </button>
          </div>

          {updating && (
            <p className="text-center text-xs text-ash animate-pulse">Updating…</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Assigned / History Booking Row ───────────────────────── */

function BookingRow({ booking, onTimeline, onRelease, onComplete, onReassign, isHistory }) {
  const pickup  = booking.pickupLocation?.label  || booking.pickupLocation?.name  || "Pickup";
  const dropoff = booking.dropoffLocation?.label || booking.dropoffLocation?.name || "Dropoff";
  const tl = booking.timeline || {};
  const hasArrive = !!tl.arrive;
  const hasStart  = !!tl.start;

  return (
    <div className="rounded-2xl border border-fleet-border bg-obsidian hover:border-fleet-border-strong transition-all overflow-hidden">
      <div className="p-4 md:p-5">
        {/* header row */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-paper truncate">
              {pickup} → {dropoff}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {booking.chauffeur?.name && (
                <span className="text-[11px] text-ash">
                  {booking.chauffeur.name}
                </span>
              )}
              {statusBadge(booking.status)}
              {booking.selectedCar && (
                <span className="text-[10px] text-ash">{booking.selectedCar}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {booking.price != null && (
              <p className="text-sm font-semibold text-paper">${booking.price}</p>
            )}
            <p className="text-[11px] text-ash">{fmt(booking.time)}</p>
          </div>
        </div>

        {/* timeline strip for assigned */}
        {!isHistory && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${hasArrive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-fleet-muted text-ash border-fleet-border"}`}>
              {hasArrive ? `✓ Arrived ${fmt(tl.arrive)}` : "— Not arrived"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${hasStart ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-fleet-muted text-ash border-fleet-border"}`}>
              {hasStart ? `✓ Started ${fmt(tl.start)}` : "— Not started"}
            </span>
          </div>
        )}

        {/* action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTimeline(booking)}
            className="px-3 py-1.5 rounded-full border border-fleet-border-strong text-xs font-medium text-frost hover:bg-fleet-hover transition"
          >
            Timeline
          </button>

          {!isHistory && (
            <>
              {!hasArrive && (
                <button
                  onClick={() => onTimeline(booking)}
                  className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/20 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition"
                >
                  Mark Arrived
                </button>
              )}
              {hasArrive && !hasStart && (
                <button
                  onClick={() => onTimeline(booking)}
                  className="px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/20 text-xs font-medium text-sky-300 hover:bg-sky-500/30 transition"
                >
                  Start Ride
                </button>
              )}
              <button
                onClick={() => onComplete(booking.chauffeur?._id, booking._id)}
                className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition"
              >
                Complete
              </button>
              <button
                onClick={() => onReassign(booking)}
                className="px-3 py-1.5 rounded-full border border-fleet-border-strong text-xs font-medium text-frost hover:bg-fleet-hover transition"
              >
                Reassign
              </button>
              <button
                onClick={() => onRelease(booking.chauffeur?._id, booking._id)}
                className="px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/20 text-xs font-medium text-red-300 hover:bg-red-500/30 transition"
              >
                Release
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Driver Filter Pills ───────────────────────────────────── */

function DriverFilter({ drivers, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("all")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === "all"
            ? "bg-paper text-fleet-on-paper hover:opacity-85"
            : "border border-fleet-border-strong bg-graphite text-frost hover:bg-fleet-hover"
        }`}
      >
        All drivers
      </button>
      {drivers.map((d) => (
        <button
          key={d._id}
          onClick={() => onChange(d._id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === d._id
              ? "bg-paper text-fleet-on-paper hover:opacity-85"
              : "border border-fleet-border-strong bg-graphite text-frost hover:bg-fleet-hover"
          }`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

const TABS = [
  { id: "assigned", label: "Assigned" },
  { id: "history", label: "History" },
];

export default function FleetBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("assigned");
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);

  /* ── Assigned ── */
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState("all");

  /* ── History ── */
  const [historyBookings, setHistoryBookings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");

  /* ── Modals ── */
  const [timelineModal, setTimelineModal] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [tlUpdating, setTlUpdating] = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  /* ── Auth ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin?callbackUrl=/partner/bookings");
    else if (status === "authenticated" && session?.user?.role !== "fleet") router.push("/");
  }, [status, session, router]);

  /* ── Load drivers ── */
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      loadDrivers();
    }
  }, [status, session]);

  /* ── Auto-fetch assigned/history when tab changes ── */
  useEffect(() => {
    if (activeTab === "assigned") loadAssigned();
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const res = await fetch("/api/fleet/drivers");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch { /* silent */ }
    setDriversLoading(false);
  };

  const loadAssigned = async () => {
    setAssignedLoading(true);
    try {
      const data = await bookingService.getAccepted();
      if (data.success) setAssignedBookings(data.bookings || []);
    } catch { /* silent */ }
    setAssignedLoading(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await bookingService.getCompleted();
      if (data.success) setHistoryBookings(data.bookings || []);
    } catch { /* silent */ }
    setHistoryLoading(false);
  };

  /* ── Actions ── */

  const handleReassign = async (currentDriverID, bookingID, newDriverID) => {
    setAssigning(newDriverID);
    try {
      const cancelData = await bookingService.cancel(currentDriverID, bookingID);
      if (!cancelData.success) {
        showToast("error", cancelData.message || "Could not release booking for reassignment.");
        setAssigning(null);
        return;
      }
      const acceptData = await bookingService.accept(newDriverID, bookingID);
      if (acceptData.success) {
        showToast("success", "Booking reassigned successfully.");
        setReassignTarget(null);
        loadAssigned();
      } else {
        showToast("error", "Released booking but could not reassign — it may have been taken.");
        setReassignTarget(null);
        loadAssigned();
      }
    } catch {
      showToast("error", "Network error during reassignment.");
    }
    setAssigning(null);
  };

  const handleRelease = async (driverID, bookingID) => {
    if (!driverID) { showToast("error", "Cannot identify driver for this booking."); return; }
    try {
      const data = await bookingService.cancel(driverID, bookingID);
      if (data.success) {
        showToast("success", "Booking released back to pool.");
        loadAssigned();
      } else {
        showToast("error", "You are not assigned to this ride.");
      }
    } catch {
      showToast("error", "Network error releasing booking.");
    }
  };

  const handleComplete = async (driverID, bookingID) => {
    if (!driverID) { showToast("error", "Cannot identify driver for this booking."); return; }
    try {
      const data = await bookingService.complete(driverID, bookingID);
      if (data.success) {
        showToast("success", "Ride marked as completed.");
        loadAssigned();
      } else {
        showToast("error", data.message || "Cannot complete this ride.");
      }
    } catch {
      showToast("error", "Network error completing booking.");
    }
  };

  const handleOpenTimeline = async (booking) => {
    try {
      const data = await bookingService.getTimeline(booking._id);
      setTimelineModal({ booking, timeline: data.success ? data.timeline : {} });
    } catch {
      setTimelineModal({ booking, timeline: {} });
    }
  };

  const handleUpdateTimeline = async (bookingID, timeline) => {
    setTlUpdating(true);
    try {
      const data = await bookingService.updateTimeline(bookingID, timeline);
      if (data.success) {
        showToast("success", "Timeline updated.");
        const tl = await bookingService.getTimeline(bookingID);
        setTimelineModal((prev) => prev ? { ...prev, timeline: tl.success ? tl.timeline : {} } : null);
        if (activeTab === "assigned") loadAssigned();
      } else {
        showToast("error", data.message || "Failed to update timeline.");
      }
    } catch {
      showToast("error", "Network error updating timeline.");
    }
    setTlUpdating(false);
  };

  /* ── Filtered lists ── */
  const filteredAssigned = assignedFilter === "all"
    ? assignedBookings
    : assignedBookings.filter((b) => b.chauffeur?._id?.toString() === assignedFilter);

  const filteredHistory = historyFilter === "all"
    ? historyBookings
    : historyBookings.filter((b) => b.chauffeur?._id?.toString() === historyFilter);

  /* ── Loading skeleton ── */
  if (status === "loading" || driversLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
      </main>
    );
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-void pb-16 font-body text-paper md:pb-20">
      <section className="mx-auto max-w-6xl space-y-6 px-6 pt-8 md:px-8 md:pt-10">
        <FleetPageHeader
          title="Bookings"
          description="Track assigned rides and completed trip history."
        />

        <div className="flex w-fit items-center gap-1 rounded-full border border-fleet-border bg-obsidian p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-paper text-fleet-on-paper"
                  : "text-ash hover:text-frost"
              }`}
            >
              {tab.label}
              {tab.id === "assigned" && assignedBookings.length > 0 && (
                <span className={`ml-1.5 text-[10px] rounded-full px-1.5 py-px font-semibold ${activeTab === "assigned" ? "bg-fleet-muted text-fleet-on-paper" : "bg-fleet-muted text-frost"}`}>
                  {assignedBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "assigned" && (
          <div className="space-y-5">
            {/* summary + refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-paper">
                  {assignedBookings.length} assigned booking{assignedBookings.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-ash">Across {drivers.length} driver{drivers.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={loadAssigned}
                disabled={assignedLoading}
                className="px-4 py-2 rounded-full border border-fleet-border-strong bg-graphite text-sm font-medium text-frost hover:bg-fleet-hover transition disabled:opacity-50"
              >
                {assignedLoading ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {/* driver filter */}
            {drivers.length > 1 && (
              <DriverFilter drivers={drivers} selected={assignedFilter} onChange={setAssignedFilter} />
            )}

            {/* list */}
            {assignedLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-fleet-border border-t-paper" />
              </div>
            ) : filteredAssigned.length === 0 ? (
              <div className="rounded-2xl border border-fleet-border bg-graphite p-10 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-2">Empty schedule</p>
                <p className="text-sm text-frost">
                  {assignedFilter !== "all"
                    ? "No assigned bookings for this driver."
                    : "No bookings currently assigned. Use Assign to find and assign nearby rides."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssigned.map((b) => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    onTimeline={handleOpenTimeline}
                    onRelease={handleRelease}
                    onComplete={handleComplete}
                    onReassign={(bk) => setReassignTarget(bk)}
                    isHistory={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: HISTORY
        ════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-5">
            {/* summary + refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-paper">
                  {historyBookings.length} completed ride{historyBookings.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-ash">All-time history for your partnership</p>
              </div>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="px-4 py-2 rounded-full border border-fleet-border-strong bg-graphite text-sm font-medium text-frost hover:bg-fleet-hover transition disabled:opacity-50"
              >
                {historyLoading ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {/* driver filter */}
            {drivers.length > 1 && (
              <DriverFilter drivers={drivers} selected={historyFilter} onChange={setHistoryFilter} />
            )}

            {/* list */}
            {historyLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-fleet-border border-t-paper" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-fleet-border bg-graphite p-10 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-2">No history yet</p>
                <p className="text-sm text-frost">
                  {historyFilter !== "all"
                    ? "No completed rides for this driver."
                    : "Completed rides will appear here once drivers finish their first trip."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((b) => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    onTimeline={handleOpenTimeline}
                    onRelease={() => {}}
                    onComplete={() => {}}
                    onReassign={() => {}}
                    isHistory={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Modals ── */}

      {reassignTarget && (
        <AssignBookingModal
          booking={reassignTarget}
          drivers={drivers.filter((d) => d._id !== reassignTarget.chauffeur?._id)}
          onAssign={(newDriverID, bookingID) =>
            handleReassign(reassignTarget.chauffeur?._id, bookingID, newDriverID)
          }
          onClose={() => setReassignTarget(null)}
          assigning={assigning}
        />
      )}

      {timelineModal && (
        <TimelineModal
          booking={timelineModal.booking}
          timeline={timelineModal.timeline}
          onUpdate={handleUpdateTimeline}
          onClose={() => setTimelineModal(null)}
          updating={tlUpdating}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
