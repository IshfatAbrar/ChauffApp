import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizePlace(place) {
  if (!place || typeof place !== "object") return null;
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { ...place, lat, lng };
}

async function computeSegmentRoutesApi(origin, next, key) {
  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: next.lat, longitude: next.lng },
          },
        },
        travelMode: "DRIVE",
        extraComputations: ["TOLLS"],
        routeModifiers: {
          vehicleInfo: { emissionType: "GASOLINE" },
        },
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.routes?.[0]) {
    const message =
      data?.error?.message || data?.message || "Routes API failed";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  const route = data.routes[0];
  const estimated =
    route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units;
  let toll = 0;
  if (estimated != null && estimated !== "") {
    const parsed = parseInt(estimated, 10);
    if (!Number.isNaN(parsed)) toll = parsed;
  }

  return {
    distanceKm: (route.distanceMeters || 0) / 1000,
    duration: route.duration || null,
    toll,
  };
}

async function computeSegmentDirectionsApi(origin, next, key) {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}` +
    `&destination=${encodeURIComponent(`${next.lat},${next.lng}`)}` +
    `&mode=driving` +
    `&key=${encodeURIComponent(key)}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (data.status !== "OK" || !data.routes?.[0]?.legs?.length) {
    throw new Error(
      data.error_message ||
        (data.status === "ZERO_RESULTS"
          ? "No driving route found between those locations."
          : `Directions API failed (${data.status || res.status}).`)
    );
  }

  let meters = 0;
  let seconds = 0;
  data.routes[0].legs.forEach((leg) => {
    meters += leg.distance?.value || 0;
    seconds += leg.duration?.value || 0;
  });

  return {
    distanceKm: meters / 1000,
    duration: `${seconds}s`,
    toll: 0,
  };
}

async function computeSegment(origin, next, key) {
  try {
    return await computeSegmentRoutesApi(origin, next, key);
  } catch (routesErr) {
    console.warn("Routes API v2 failed, trying Directions API:", routesErr);
    return computeSegmentDirectionsApi(origin, next, key);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const source = normalizePlace(body?.source);
    const destination = normalizePlace(body?.destination);
    const stopover = Array.isArray(body?.stopover)
      ? body.stopover.map(normalizePlace)
      : [];

    if (!source || !destination) {
      return NextResponse.json(
        { message: "Pickup and dropoff locations are required." },
        { status: 400 }
      );
    }

    if (stopover.some((stop) => !stop)) {
      return NextResponse.json(
        { message: "Finish or remove incomplete stopovers." },
        { status: 400 }
      );
    }

    const key =
      process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key) {
      return NextResponse.json(
        { message: "Google API key not configured." },
        { status: 500 }
      );
    }

    const allStops = [source, ...stopover, destination];
    let totalDistanceKm = 0;
    let totalToll = 0;
    let duration = null;

    for (let i = 0; i < allStops.length - 1; i++) {
      const segment = await computeSegment(allStops[i], allStops[i + 1], key);
      totalDistanceKm += segment.distanceKm;
      totalToll += segment.toll || 0;
      if (segment.duration) duration = segment.duration;
    }

    if (totalDistanceKm <= 0) {
      return NextResponse.json(
        { message: "No driving route found between those locations." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      distanceKm: totalDistanceKm,
      duration,
      toll: totalToll,
    });
  } catch (error) {
    console.error("Route compute error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to calculate route." },
      { status: 500 }
    );
  }
}
