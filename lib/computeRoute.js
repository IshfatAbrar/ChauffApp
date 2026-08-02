const hasPlace = (place) =>
  place &&
  typeof place.lat === "number" &&
  typeof place.lng === "number" &&
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng);

async function computeViaServer(source, destination, stopover) {
  const res = await fetch("/api/routes/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, destination, stopover }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not calculate that route.");
  }
  return {
    distanceKm: data.distanceKm,
    duration: data.duration,
    toll: data.toll || 0,
  };
}

function computeViaDirectionsService(source, destination, stopover) {
  return new Promise((resolve, reject) => {
    if (typeof google === "undefined" || !google?.maps?.DirectionsService) {
      reject(new Error("Maps is not ready yet. Try again in a moment."));
      return;
    }

    const service = new google.maps.DirectionsService();
    const waypoints = (stopover || [])
      .filter(hasPlace)
      .map((stop) => ({
        location: { lat: stop.lat, lng: stop.lng },
        stopover: true,
      }));

    service.route(
      {
        origin: { lat: source.lat, lng: source.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.[0]) {
          reject(new Error("No driving route found between those locations."));
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

/**
 * Prefer server Routes API (tolls + no CORS). Fall back to JS DirectionsService.
 */
export async function computeRoute(source, destination, stopover = []) {
  if (!hasPlace(source) || !hasPlace(destination)) {
    throw new Error("Select a pickup and dropoff location.");
  }
  if (Array.isArray(stopover) && stopover.some((s) => !hasPlace(s))) {
    throw new Error("Finish or remove any incomplete stopovers.");
  }

  try {
    return await computeViaServer(source, destination, stopover);
  } catch (serverError) {
    console.warn("Server route compute failed, trying DirectionsService:", serverError);
    try {
      return await computeViaDirectionsService(source, destination, stopover);
    } catch (clientError) {
      throw serverError?.message
        ? serverError
        : clientError;
    }
  }
}

export { hasPlace };
