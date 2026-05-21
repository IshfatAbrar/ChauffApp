"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FleetSubpageHero from "../../../components/Fleet/FleetSubpageHero";
import { bookingService } from "../../../services/bookingService";

/* ─── helpers ──────────────────────────────────────────────── */

const STATUS_MAP = {
  requested: { label: "Requested", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  accepted:  { label: "Assigned",  cls: "bg-sky-50 text-sky-800 border-sky-200" },
  in_progress: { label: "In progress", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  completed:   { label: "Completed",   cls: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled:   { label: "Cancelled",   cls: "bg-red-50 text-red-700 border-red-200" },
};

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
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

function fmtDist(meters) {
  if (!meters && meters !== 0) return null;
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km away`
    : `${Math.round(meters)} m away`;
}

/* ─── Toast ────────────────────────────────────────────────── */

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-xl text-sm font-medium transition-all
        ${isErr ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-xs ml-1">✕</button>
    </div>
  );
}

/* ─── Assign / Reassign Modal ───────────────────────────────── */

function AssignModal({ booking, drivers, onAssign, onClose, assigning }) {
  const pickup  = booking.pickupLocation?.label  || booking.pickupLocation?.name  || "Pickup";
  const dropoff = booking.dropoffLocation?.label || booking.dropoffLocation?.name || "Dropoff";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Assign driver</p>
            <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
              {pickup} → {dropoff}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{fmt(booking.time)} · {booking.selectedCar || "—"}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* driver list */}
        <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-2">
          {drivers.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No drivers in your fleet yet.</p>
          )}
          {drivers.map((d) => (
            <button
              key={d._id}
              disabled={!!assigning}
              onClick={() => onAssign(d._id, booking._id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-semibold text-slate-600">
                {d.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{d.email}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${d.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                {d.isActive ? "Active" : "Inactive"}
              </span>
              {assigning === d._id && (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
          <button onClick={onClose} className="w-full py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-white transition">
            Cancel
          </button>
        </div>
      </div>
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
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Trip timeline</p>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {pickup} → {dropoff}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.chauffeur?.name || "Driver unknown"} · {fmt(booking.time)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Timeline steps */}
          <div className="space-y-2">
            {/* Arrive */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasArrive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <div>
                  <p className="text-xs font-medium text-slate-700">Arrived at pickup</p>
                  <p className="text-[11px] text-slate-500">{hasArrive ? fmt(timeline.arrive) : "Not yet stamped"}</p>
                </div>
              </div>
              {!hasArrive && (
                <button
                  disabled={!!updating}
                  onClick={() => stamp("arrive")}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 shrink-0"
                >
                  Mark Arrived
                </button>
              )}
            </div>

            {/* Start */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasStart ? "bg-emerald-500" : "bg-slate-300"}`} />
                <div>
                  <p className="text-xs font-medium text-slate-700">Ride started</p>
                  <p className="text-[11px] text-slate-500">{hasStart ? fmt(timeline.start) : "Not yet stamped"}</p>
                </div>
              </div>
              {hasArrive && !hasStart && (
                <button
                  disabled={!!updating}
                  onClick={() => stamp("start")}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-700 text-white rounded-full hover:bg-sky-600 disabled:opacity-50 shrink-0"
                >
                  Start Ride
                </button>
              )}
              {!hasArrive && !hasStart && (
                <span className="text-[11px] text-slate-400 italic shrink-0">Needs arrive first</span>
              )}
            </div>

            {/* Stop */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${timeline?.stop ? "bg-emerald-500" : "bg-slate-300"}`} />
                <div>
                  <p className="text-xs font-medium text-slate-700">Ride ended</p>
                  <p className="text-[11px] text-slate-500">{timeline?.stop ? fmt(timeline.stop) : "Not yet stamped"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waypoints */}
          {timeline?.waypoints?.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Stopovers</p>
              <div className="space-y-1.5">
                {timeline.waypoints.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800 shrink-0">{w.name || `Stop ${i + 1}`}</span>
                    {w.arrival && <span className="text-slate-400">Arr {fmt(w.arrival)}</span>}
                    {w.departure && <span className="text-slate-400">Dep {fmt(w.departure)}</span>}
                    {w.waitingTime && <span className="text-slate-400">Wait {w.waitingTime}</span>}
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
              className="flex-1 py-2 rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Reset timeline
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-full bg-slate-900 text-xs text-white hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>

          {updating && (
            <p className="text-center text-xs text-slate-400 animate-pulse">Updating…</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Available Booking Card ────────────────────────────────── */

function AvailableCard({ booking, onAssign }) {
  const pickup  = booking.pickupLocation?.label  || booking.pickupLocation?.name  || "Pickup";
  const dropoff = booking.dropoffLocation?.label || booking.dropoffLocation?.name || "Dropoff";
  const stopCount = booking.stopoverLocation?.length || 0;
  const dist = fmtDist(booking.distanceFromUser);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5">
      {/* top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {booking.selectedCar && (
            <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500">
              {booking.selectedCar}
            </span>
          )}
          {statusBadge(booking.status || "requested")}
        </div>
        {dist && (
          <span className="text-[11px] text-slate-400 shrink-0">{dist}</span>
        )}
      </div>

      {/* route */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{pickup}</p>
        <p className="text-xs text-slate-400 my-0.5">↓</p>
        <p className="text-sm font-semibold text-slate-900 leading-snug">{dropoff}</p>
        {stopCount > 0 && (
          <p className="text-[11px] text-slate-400 mt-1">{stopCount} stopover{stopCount !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500 mb-4">
        <span>{fmt(booking.time)}</span>
        {booking.price != null && (
          <span className="font-semibold text-slate-800">${booking.price}</span>
        )}
        {booking.phoneNumber && <span>{booking.phoneNumber}</span>}
      </div>

      {booking.notes && (
        <p className="text-[12px] text-slate-500 italic mb-4 line-clamp-2">&ldquo;{booking.notes}&rdquo;</p>
      )}

      <button
        onClick={() => onAssign(booking)}
        className="w-full py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition"
      >
        Assign driver →
      </button>
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4 md:p-5">
        {/* header row */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {pickup} → {dropoff}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {booking.chauffeur?.name && (
                <span className="text-[11px] text-slate-500">
                  {booking.chauffeur.name}
                </span>
              )}
              {statusBadge(booking.status)}
              {booking.selectedCar && (
                <span className="text-[10px] text-slate-400">{booking.selectedCar}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {booking.price != null && (
              <p className="text-sm font-semibold text-slate-900">${booking.price}</p>
            )}
            <p className="text-[11px] text-slate-400">{fmt(booking.time)}</p>
          </div>
        </div>

        {/* timeline strip for assigned */}
        {!isHistory && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${hasArrive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
              {hasArrive ? `✓ Arrived ${fmt(tl.arrive)}` : "— Not arrived"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${hasStart ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
              {hasStart ? `✓ Started ${fmt(tl.start)}` : "— Not started"}
            </span>
          </div>
        )}

        {/* action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTimeline(booking)}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
          >
            Timeline
          </button>

          {!isHistory && (
            <>
              {!hasArrive && (
                <button
                  onClick={() => onTimeline(booking)}
                  className="px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                >
                  Mark Arrived
                </button>
              )}
              {hasArrive && !hasStart && (
                <button
                  onClick={() => onTimeline(booking)}
                  className="px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-xs font-medium text-sky-800 hover:bg-sky-100 transition"
                >
                  Start Ride
                </button>
              )}
              <button
                onClick={() => onComplete(booking.chauffeur?._id, booking._id)}
                className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition"
              >
                Complete
              </button>
              <button
                onClick={() => onReassign(booking)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Reassign
              </button>
              <button
                onClick={() => onRelease(booking.chauffeur?._id, booking._id)}
                className="px-3 py-1.5 rounded-full border border-red-100 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 transition"
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

/* ─── Booking Settings Panel ───────────────────────────────── */

const SETTING_META = [
  {
    key: "driversCanAccept",
    label: "Drivers can accept bookings",
    desc: "Allow drivers to self-assign rides via the mobile app. Disable to make all assignments fleet-managed only.",
    offWarning: "Fleet assigns all bookings",
  },
  {
    key: "driversCanCancel",
    label: "Drivers can release bookings",
    desc: "Allow drivers to cancel / release an accepted booking from the app.",
    offWarning: "Only fleet can release bookings",
  },
];

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200
        focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
        ${enabled ? "bg-slate-900" : "bg-slate-200"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200
          ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function BookingSettingsPanel({ settings, onSave, saving }) {
  const [local, setLocal] = useState(settings);

  useEffect(() => { setLocal(settings); }, [settings]);

  const changed =
    local.driversCanAccept !== settings.driversCanAccept ||
    local.driversCanCancel !== settings.driversCanCancel;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Booking policy
          </p>
          <h2 className="text-sm font-semibold text-slate-900">Driver permissions</h2>
        </div>
        {changed && (
          <button
            onClick={() => onSave(local)}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-50">
        {SETTING_META.map(({ key, label, desc, offWarning }) => {
          const isOn = local[key] ?? true;
          return (
            <div key={key} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  {!isOn && (
                    <span className="text-[10px] font-semibold px-2 py-px rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {offWarning}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
              <Toggle
                enabled={isOn}
                onChange={(val) => setLocal((prev) => ({ ...prev, [key]: val }))}
                disabled={saving}
              />
            </div>
          );
        })}
      </div>

      {changed && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700">You have unsaved changes.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLocal(settings)}
              className="px-3 py-1.5 rounded-full border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
            >
              Discard
            </button>
            <button
              onClick={() => onSave(local)}
              disabled={saving}
              className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
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
            ? "bg-slate-900 text-white shadow-sm"
            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
              ? "bg-slate-900 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
  { id: "available", label: "Available" },
  { id: "assigned",  label: "Assigned"  },
  { id: "history",   label: "History"   },
];

export default function FleetBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("available");
  const [drivers, setDrivers]     = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);

  /* ── Available ── */
  const [availableBookings, setAvailableBookings] = useState([]);
  const [availableLoading,  setAvailableLoading]  = useState(false);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [coordsFetched, setCoordsFetched] = useState(false);

  /* ── Assigned ── */
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [assignedLoading,  setAssignedLoading]  = useState(false);
  const [assignedFilter,   setAssignedFilter]   = useState("all");

  /* ── History ── */
  const [historyBookings, setHistoryBookings] = useState([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [historyFilter,   setHistoryFilter]   = useState("all");

  /* ── Modals ── */
  const [assignModal,    setAssignModal]    = useState(null);
  const [timelineModal,  setTimelineModal]  = useState(null);
  const [assigning,      setAssigning]      = useState(null);
  const [tlUpdating,     setTlUpdating]     = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  /* ── Booking settings ── */
  const DEFAULT_SETTINGS = { driversCanAccept: true, driversCanCancel: true };
  const [bookingSettings,  setBookingSettings]  = useState(DEFAULT_SETTINGS);
  const [settingsLoading,  setSettingsLoading]  = useState(true);
  const [settingsSaving,   setSettingsSaving]   = useState(false);

  /* ── Auth ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin?callbackUrl=/fleet/bookings");
    else if (status === "authenticated" && session?.user?.role !== "fleet") router.push("/");
  }, [status, session, router]);

  /* ── Load drivers + settings ── */
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      loadDrivers();
      loadSettings();
      tryGeolocation();
    }
  }, [status, session]);

  /* ── Auto-fetch assigned/history when tab changes ── */
  useEffect(() => {
    if (activeTab === "assigned") loadAssigned();
    if (activeTab === "history")  loadHistory();
  }, [activeTab]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const tryGeolocation = () => {
    if (!coordsFetched && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          });
          setCoordsFetched(true);
        },
        () => setCoordsFetched(true)
      );
    }
  };

  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const res  = await fetch("/api/fleet/drivers");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch { /* silent */ }
    setDriversLoading(false);
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res  = await fetch("/api/fleet/bookings/settings");
      const data = await res.json();
      if (data.success) setBookingSettings(data.settings);
    } catch { /* silent — keep defaults */ }
    setSettingsLoading(false);
  };

  const saveSettings = async (next) => {
    setSettingsSaving(true);
    try {
      const res  = await fetch("/api/fleet/bookings/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (data.success) {
        setBookingSettings(data.settings);
        showToast("success", "Booking settings saved.");
      } else {
        showToast("error", data.message || "Failed to save settings.");
      }
    } catch {
      showToast("error", "Network error saving settings.");
    }
    setSettingsSaving(false);
  };

  const loadAvailable = async () => {
    if (!coords.lat || !coords.lng) {
      showToast("error", "Enter coordinates or allow location access.");
      return;
    }
    setAvailableLoading(true);
    try {
      const data = await bookingService.getAvailable(
        parseFloat(coords.lng),
        parseFloat(coords.lat)
      );
      if (data.success) {
        setAvailableBookings(data.bookings || []);
        if ((data.bookings || []).length === 0) showToast("info", "No available bookings near this location.");
      } else {
        showToast("error", "Could not load available bookings.");
      }
    } catch {
      showToast("error", "Network error loading bookings.");
    }
    setAvailableLoading(false);
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

  const handleAssign = async (driverID, bookingID) => {
    setAssigning(driverID);
    try {
      const data = await bookingService.accept(driverID, bookingID);
      if (data.success) {
        showToast("success", "Driver assigned successfully.");
        setAssignModal(null);
        setReassignTarget(null);
        setAvailableBookings((prev) => prev.filter((b) => b._id !== bookingID));
        if (activeTab === "assigned") loadAssigned();
      } else {
        const msg = (data.message || "").toLowerCase();
        showToast("error", msg.includes("could not accept") || msg.includes("already")
          ? "This booking was just taken by someone else."
          : data.message || "Failed to assign driver."
        );
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    }
    setAssigning(null);
  };

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
  if (status === "loading" || driversLoading || settingsLoading) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900" />
        </div>
      </main>
    );
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16 md:pb-24">
      <FleetSubpageHero
        eyebrow={
          <>
            Trips
            <span className="text-slate-300">—</span>
            fleet activity
          </>
        }
        title="Fleet bookings"
        description="Browse available rides, assign drivers, manage schedules, and track every trip from pickup to drop-off."
      />

      <div className="border-t border-slate-200" />

      <section className="max-w-6xl mx-auto px-4 pt-8 space-y-6">

        {/* ── Booking Settings ── */}
        <BookingSettingsPanel
          settings={bookingSettings}
          onSave={saveSettings}
          saving={settingsSaving}
        />

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-white rounded-full border border-slate-200 shadow-sm p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {tab.id === "assigned" && assignedBookings.length > 0 && (
                <span className={`ml-1.5 text-[10px] rounded-full px-1.5 py-px font-semibold ${activeTab === "assigned" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {assignedBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB: AVAILABLE
        ════════════════════════════════════════════════════════ */}
        {activeTab === "available" && (
          <div className="space-y-5">
            {/* location bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">
                Search by location
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={coords.lat}
                    onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
                    placeholder="e.g. 27.947"
                    className="w-full px-3 py-2 rounded-full border border-slate-200 bg-[#f8f8f8] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={coords.lng}
                    onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
                    placeholder="e.g. -82.458"
                    className="w-full px-3 py-2 rounded-full border border-slate-200 bg-[#f8f8f8] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <button
                  onClick={loadAvailable}
                  disabled={availableLoading}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
                >
                  {availableLoading ? "Loading…" : "Load bookings"}
                </button>
                <button
                  onClick={tryGeolocation}
                  title="Use my location"
                  className="px-3 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-sm shrink-0"
                >
                  ⊕ My location
                </button>
              </div>
            </div>

            {/* booking grid */}
            {availableLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
              </div>
            ) : availableBookings.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">No bookings</p>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Enter your fleet coordinates and click "Load bookings" to see available rides near you.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  {availableBookings.length} booking{availableBookings.length !== 1 ? "s" : ""} available
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableBookings.map((b) => (
                    <AvailableCard key={b._id} booking={b} onAssign={setAssignModal} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: ASSIGNED
        ════════════════════════════════════════════════════════ */}
        {activeTab === "assigned" && (
          <div className="space-y-5">
            {/* summary + refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {assignedBookings.length} assigned booking{assignedBookings.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-500">Across {drivers.length} driver{drivers.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={loadAssigned}
                disabled={assignedLoading}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
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
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
              </div>
            ) : filteredAssigned.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">Empty schedule</p>
                <p className="text-sm text-slate-500">
                  {assignedFilter !== "all"
                    ? "No assigned bookings for this driver."
                    : "No bookings currently assigned to your fleet. Head to the Available tab to assign rides."}
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
                <p className="text-sm font-semibold text-slate-900">
                  {historyBookings.length} completed ride{historyBookings.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-500">All-time history across your fleet</p>
              </div>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
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
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">No history yet</p>
                <p className="text-sm text-slate-500">
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

      {assignModal && (
        <AssignModal
          booking={assignModal}
          drivers={drivers}
          onAssign={handleAssign}
          onClose={() => setAssignModal(null)}
          assigning={assigning}
        />
      )}

      {reassignTarget && (
        <AssignModal
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
