"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import FleetPageHeader from "../../../components/Fleet/FleetPageHeader";
import AssignBookingModal from "../../../components/Fleet/AssignBookingModal";
import { bookingService } from "../../../services/bookingService";

const DEFAULT_CENTER = { lat: 27.9506, lng: -82.4572 };

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

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

function fmtDist(meters) {
  if (!meters && meters !== 0) return null;
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function pickupCoords(booking) {
  const lat = booking?.pickupLocation?.lat;
  const lng = booking?.pickupLocation?.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }
  return null;
}

function AvailableRow({ booking, selected, onSelect, onAssign, onDecline, declining }) {
  const pickup =
    booking.pickupLocation?.label ||
    booking.pickupLocation?.name ||
    "Pickup";
  const dropoff =
    booking.dropoffLocation?.label ||
    booking.dropoffLocation?.name ||
    "Dropoff";
  const countdown = useCountdown(
    booking.isExclusive ? booking.windowExpiresAt : null
  );
  const isExclusive = booking.isExclusive && countdown !== null;
  const dist = fmtDist(booking.distanceFromUser);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(booking)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(booking);
      }}
      className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-paper/40 bg-graphite"
          : isExclusive
            ? "border-amber-500/40 bg-obsidian hover:border-amber-500/60"
            : "border-fleet-border bg-obsidian hover:border-fleet-border-strong"
      }`}
    >
      {isExclusive && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            Priority
          </span>
          <span className="font-mono text-[11px] text-amber-200 tabular-nums">
            {countdown} left
          </span>
        </div>
      )}

      <p className="line-clamp-1 font-body text-[14px] font-medium text-paper">
        {pickup}
      </p>
      <p className="mt-0.5 line-clamp-1 font-body text-[13px] text-ash">
        → {dropoff}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-body text-[12px] text-ash">
        <span>{fmt(booking.time)}</span>
        {booking.price != null && (
          <span className="text-frost">${booking.price}</span>
        )}
        {dist && <span>{dist}</span>}
        {booking.selectedCar && <span>{booking.selectedCar}</span>}
      </div>

      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onAssign(booking)}
          className="flex-1 rounded-full bg-paper py-2 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90"
        >
          Assign
        </button>
        {isExclusive && (
          <button
            type="button"
            onClick={() => onDecline(booking._id)}
            disabled={!!declining}
            className="rounded-full border border-red-500/30 bg-red-500/20 px-3 py-2 font-body text-[12px] text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
          >
            {declining === booking._id ? "…" : "Decline"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function FleetAssignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mapRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchTimerRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  });

  const [drivers, setDrivers] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [searchPin, setSearchPin] = useState(DEFAULT_CENTER);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [toast, setToast] = useState(null);
  const [placeLabel, setPlaceLabel] = useState("Search area");
  const [geoTried, setGeoTried] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/partner/assign");
    } else if (status === "authenticated" && session?.user?.role !== "fleet") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      fetch("/api/fleet/drivers")
        .then((r) => r.json())
        .then((data) => setDrivers(data.drivers || []))
        .catch(() => {});
    }
  }, [status, session]);

  const loadBookings = useCallback(
    async (lat, lng) => {
      if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }
      setLoading(true);
      try {
        const data = await bookingService.getAvailable(lng, lat);
        if (data.success) {
          setBookings(data.bookings || []);
          if ((data.bookings || []).length === 0) {
            showToast("info", "No available bookings near this location.");
          }
        } else {
          showToast("error", "Could not load available bookings.");
        }
      } catch {
        showToast("error", "Network error loading bookings.");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (geoTried || status !== "authenticated") return;
    setGeoTried(true);
    if (!navigator?.geolocation) {
      loadBookings(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCenter(next);
        setSearchPin(next);
        setPlaceLabel("Your location");
        loadBookings(next.lat, next.lng);
      },
      () => {
        loadBookings(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      }
    );
  }, [geoTried, status, loadBookings]);

  const setLocation = (lat, lng, label) => {
    const next = { lat, lng };
    setCenter(next);
    setSearchPin(next);
    if (label) setPlaceLabel(label);
    if (mapRef.current) mapRef.current.panTo(next);
    loadBookings(lat, lng);
  };

  const onMapClick = (e) => {
    if (!e.latLng) return;
    setLocation(e.latLng.lat(), e.latLng.lng(), "Selected on map");
    setSearchQuery("");
    setPredictions([]);
    setSearchOpen(false);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const fetchPredictions = useCallback(
    async (input) => {
      if (!input.trim()) {
        setPredictions([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          input: input.trim(),
          lat: String(searchPin.lat),
          lng: String(searchPin.lng),
        });
        const res = await fetch(`/api/places/autocomplete?${params}`);
        const data = await res.json();
        setPredictions(data.predictions || []);
        setSearchOpen(true);
      } catch {
        setPredictions([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchPin.lat, searchPin.lng]
  );

  const onSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 250);
  };

  const selectPrediction = async (prediction) => {
    setSearchOpen(false);
    setPredictions([]);
    setSearchQuery(prediction.description || "");
    try {
      const params = new URLSearchParams({
        place_id: prediction.place_id,
      });
      const res = await fetch(`/api/places/details?${params}`);
      const data = await res.json();
      if (!res.ok || !data.place) {
        showToast("error", data.message || "Could not find that place.");
        return;
      }
      setLocation(
        data.place.lat,
        data.place.lng,
        data.place.label || data.place.name || prediction.description
      );
    } catch {
      showToast("error", "Failed to load place details.");
    }
  };

  const handleAssign = async (driverID, bookingID) => {
    setAssigning(driverID);
    try {
      const data = await bookingService.accept(driverID, bookingID);
      if (data.success) {
        showToast("success", "Driver assigned successfully.");
        setAssignModal(null);
        setBookings((prev) => prev.filter((b) => b._id !== bookingID));
        setSelectedId(null);
      } else {
        const msg = (data.message || "").toLowerCase();
        showToast(
          "error",
          msg.includes("could not accept") || msg.includes("already")
            ? "This booking was just taken by someone else."
            : data.message || "Failed to assign driver."
        );
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    }
    setAssigning(null);
  };

  const handleDecline = async (bookingID) => {
    setDeclining(bookingID);
    try {
      const data = await bookingService.decline(bookingID);
      if (data.success) {
        showToast(
          "success",
          data.openToAll
            ? "Ride declined — now open to all partners."
            : "Ride declined and passed to the next partner."
        );
        setBookings((prev) => prev.filter((b) => b._id !== bookingID));
        if (selectedId === bookingID) setSelectedId(null);
      } else {
        showToast("error", data.message || "Could not decline booking.");
      }
    } catch {
      showToast("error", "Network error declining booking.");
    }
    setDeclining(null);
  };

  const selectedBooking = useMemo(
    () => bookings.find((b) => b._id === selectedId) || null,
    [bookings, selectedId]
  );

  const mapMarkers = useMemo(
    () =>
      bookings
        .map((b) => {
          const coords = pickupCoords(b);
          if (!coords) return null;
          return { booking: b, coords };
        })
        .filter(Boolean),
    [bookings]
  );

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-void font-body text-paper">
      <div className="px-6 pt-8 md:px-8 md:pt-10">
        <FleetPageHeader
          title="Assign"
          description="Pick a location on the map to find nearby rides and assign drivers."
          actions={
            <button
              type="button"
              onClick={() => loadBookings(searchPin.lat, searchPin.lng)}
              disabled={loading}
              className="rounded-full bg-paper px-4 py-2.5 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh bookings"}
            </button>
          }
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 pb-8 md:px-8 lg:flex-row lg:gap-5">
        {/* Map */}
        <div className="relative min-h-[360px] flex-1 rounded-2xl border border-fleet-border lg:min-h-[calc(100vh-10rem)]">
          <div
            ref={searchWrapRef}
            className="absolute left-3 right-3 top-3 z-20 md:left-4 md:right-auto md:w-[380px]"
          >
            <div className="overflow-hidden rounded-2xl border border-fleet-border bg-obsidian shadow-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setSearchOpen(true);
                }}
                placeholder="Search a place or click the map…"
                className="w-full bg-transparent px-4 py-3 font-body text-[14px] text-paper placeholder:text-ash focus:outline-none"
                autoComplete="off"
              />
              {searchOpen && (predictions.length > 0 || searchLoading) && (
                <ul className="max-h-64 overflow-y-auto border-t border-fleet-border">
                  {searchLoading && predictions.length === 0 && (
                    <li className="px-4 py-3 font-body text-[13px] text-ash">
                      Searching…
                    </li>
                  )}
                  {predictions.map((p) => (
                    <li key={p.place_id}>
                      <button
                        type="button"
                        onClick={() => selectPrediction(p)}
                        className="w-full px-4 py-3 text-left font-body text-[14px] text-frost transition-colors hover:bg-graphite hover:text-paper"
                      >
                        <span className="block text-paper">
                          {p.structured_formatting?.main_text ||
                            p.description}
                        </span>
                        {p.structured_formatting?.secondary_text && (
                          <span className="mt-0.5 block text-[12px] text-ash">
                            {p.structured_formatting.secondary_text}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 px-1 font-body text-[12px] text-frost">
              {placeLabel}
            </p>
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={center}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onClick={onMapClick}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  fullscreenControl: true,
                  styles: [
                    {
                      elementType: "geometry",
                      stylers: [{ color: "#1e1e1e" }],
                    },
                    {
                      elementType: "labels.text.stroke",
                      stylers: [{ color: "#1e1e1e" }],
                    },
                    {
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#8a8a8a" }],
                    },
                    {
                      featureType: "road",
                      elementType: "geometry",
                      stylers: [{ color: "#2c2c2c" }],
                    },
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#0e0e0e" }],
                    },
                  ],
                }}
              >
                <MarkerF position={searchPin} title="Search center" />
                {mapMarkers.map(({ booking, coords }) => (
                  <MarkerF
                    key={booking._id}
                    position={coords}
                    title={
                      booking.pickupLocation?.label ||
                      booking.pickupLocation?.name ||
                      "Pickup"
                    }
                    onClick={() => {
                      setSelectedId(booking._id);
                      setCenter(coords);
                    }}
                  />
                ))}
              </GoogleMap>
            ) : (
              <div className="flex h-full items-center justify-center bg-obsidian">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <aside className="flex w-full flex-col lg:w-[380px] lg:shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-body text-[17px] font-medium text-paper">
              Nearby rides
            </h2>
            <span className="font-body text-[13px] text-ash">
              {loading ? "…" : `${bookings.length} found`}
            </span>
          </div>

          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-12rem)]">
            {loading && bookings.length === 0 ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-2xl border border-fleet-border bg-obsidian px-5 py-10 text-center">
                <p className="font-body text-[14px] text-ash">
                  No rides here yet. Move the pin or search another area.
                </p>
              </div>
            ) : (
              bookings.map((b) => (
                <AvailableRow
                  key={b._id}
                  booking={b}
                  selected={selectedId === b._id}
                  onSelect={(booking) => {
                    setSelectedId(booking._id);
                    const coords = pickupCoords(booking);
                    if (coords) {
                      setCenter(coords);
                      mapRef.current?.panTo(coords);
                    }
                  }}
                  onAssign={setAssignModal}
                  onDecline={handleDecline}
                  declining={declining}
                />
              ))
            )}
          </div>

          {selectedBooking && (
            <p className="mt-3 font-body text-[12px] text-ash">
              Selected:{" "}
              <span className="text-frost">
                {selectedBooking.pickupLocation?.label ||
                  selectedBooking.pickupLocation?.name ||
                  "Pickup"}
              </span>
            </p>
          )}
        </aside>
      </div>

      {assignModal && (
        <AssignBookingModal
          booking={assignModal}
          drivers={drivers}
          onAssign={handleAssign}
          onClose={() => setAssignModal(null)}
          assigning={assigning}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 font-body text-[14px] shadow-xl ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-paper text-fleet-on-paper"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
