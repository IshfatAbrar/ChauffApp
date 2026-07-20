const BASE = "/api/fleet/bookings";

async function apiFetch(path, method, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  return res.json();
}

export const bookingService = {
  /** Available (requested) bookings near a location, sorted by composite score. */
  getAvailable: (longitude, latitude) =>
    apiFetch(`?lat=${latitude}&lng=${longitude}`, "GET"),

  /** All accepted bookings for the fleet. Pass driverID to filter by driver. */
  getAccepted: (driverID) =>
    apiFetch(driverID ? `/accepted?driverId=${driverID}` : "/accepted", "GET"),

  /** All completed bookings for the fleet. Pass driverID to filter by driver. */
  getCompleted: (driverID) =>
    apiFetch(driverID ? `/completed?driverId=${driverID}` : "/completed", "GET"),

  /** Fetch the current timeline for a booking. */
  getTimeline: (bookingID) =>
    apiFetch(`/${bookingID}/timeline`, "GET"),

  /** Assign a driver to a booking (requested → accepted). */
  accept: (driverID, bookingID) =>
    apiFetch(`/${bookingID}/accept`, "PUT", { driverID }),

  /** Release a booking back to the pool (accepted → requested). */
  cancel: (driverID, bookingID) =>
    apiFetch(`/${bookingID}/release`, "PUT", { driverID }),

  /** Mark a booking as completed. */
  complete: (driverID, bookingID) =>
    apiFetch(`/${bookingID}/complete`, "POST", { driverID }),

  /** Merge timeline fields. Pass timeline: {} to reset. */
  updateTimeline: (bookingID, timeline) =>
    apiFetch(`/${bookingID}/timeline`, "PUT", { timeline }),

  /** Decline an exclusive window — booking is immediately passed to the next fleet. */
  decline: (bookingID) =>
    apiFetch(`/${bookingID}/decline`, "POST"),
};
