export const hasPlace = (place) => {
  if (!place || typeof place !== "object") return false;
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

export const normalizePlace = (place) => {
  if (!hasPlace(place)) return null;
  return {
    ...place,
    lat: Number(place.lat),
    lng: Number(place.lng),
  };
};

function computeViaDirectionsService(source, destination, stopover) {
  return new Promise((resolve, reject) => {
    if (typeof google === "undefined" || !google?.maps?.DirectionsService) {
      reject(new Error("Maps is not ready yet. Try again in a moment."));
      return;
    }

    const origin = normalizePlace(source);
    const dest = normalizePlace(destination);
    if (!origin || !dest) {
      reject(new Error("Select a pickup and dropoff location."));
      return;
    }

    const service = new google.maps.DirectionsService();
    const waypoints = (stopover || [])
      .map(normalizePlace)
      .filter(Boolean)
      .map((stop) => ({
        location: { lat: stop.lat, lng: stop.lng },
        stopover: true,
      }));

    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.[0]) {
          reject(
            new Error(
              status === "ZERO_RESULTS"
                ? "No driving route found between those locations."
                : `Could not calculate that route (${status}).`
            )
          );
          return;
        }

        let meters = 0;
        let seconds = 0;
        result.routes[0].legs.forEach((leg) => {
          meters += leg.distance?.value || 0;
          seconds += leg.duration?.value || 0;
        });

        if (meters <= 0) {
          reject(new Error("No driving route found between those locations."));
          return;
        }

        resolve({
          distanceKm: meters / 1000,
          duration: `${seconds}s`,
          toll: 0,
        });
      }
    );
  });
}

async function computeViaServer(source, destination, stopover) {
  const res = await fetch("/api/routes/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: normalizePlace(source),
      destination: normalizePlace(destination),
      stopover: (stopover || []).map(normalizePlace).filter(Boolean),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not calculate that route.");
  }
  return {
    distanceKm: Number(data.distanceKm),
    duration: data.duration,
    toll: Number(data.toll) || 0,
  };
}

/**
 * Prefer server route API (reliable on mobile / restricted keys),
 * then fall back to JS DirectionsService.
 */
export async function computeRoute(source, destination, stopover = []) {
  if (!hasPlace(source) || !hasPlace(destination)) {
    throw new Error("Select a pickup and dropoff location.");
  }
  if (Array.isArray(stopover) && stopover.some((s) => !hasPlace(s))) {
    throw new Error("Finish or remove any incomplete stopovers.");
  }

  const errors = [];

  try {
    return await computeViaServer(source, destination, stopover);
  } catch (err) {
    errors.push(err?.message || String(err));
  }

  try {
    return await computeViaDirectionsService(source, destination, stopover);
  } catch (err) {
    errors.push(err?.message || String(err));
  }

  throw new Error(
    errors.filter(Boolean).slice(-1)[0] ||
      "Couldn't calculate that route. Check your locations and try again."
  );
}
