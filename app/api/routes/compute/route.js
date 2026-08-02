import { NextResponse } from "next/server";

function isPlace(place) {
  return (
    place &&
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const source = body?.source;
    const destination = body?.destination;
    const stopover = Array.isArray(body?.stopover) ? body.stopover : [];

    if (!isPlace(source) || !isPlace(destination)) {
      return NextResponse.json(
        { message: "Pickup and dropoff locations are required." },
        { status: 400 }
      );
    }

    if (stopover.some((stop) => !isPlace(stop))) {
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
      const origin = allStops[i];
      const next = allStops[i + 1];

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
                latLng: {
                  latitude: origin.lat,
                  longitude: origin.lng,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: next.lat,
                  longitude: next.lng,
                },
              },
            },
            travelMode: "DRIVE",
            extraComputations: ["TOLLS"],
            routeModifiers: {
              vehicleInfo: {
                emissionType: "GASOLINE",
              },
            },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Routes API error:", data);
        return NextResponse.json(
          {
            message:
              data?.error?.message ||
              "Could not calculate that route. Try different locations.",
          },
          { status: 502 }
        );
      }

      const route = data.routes?.[0];
      if (!route) {
        return NextResponse.json(
          { message: "No driving route found between those locations." },
          { status: 404 }
        );
      }

      totalDistanceKm += (route.distanceMeters || 0) / 1000;
      if (route.duration) {
        duration = route.duration;
      }

      const estimated =
        route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units;
      if (estimated != null && estimated !== "") {
        const parsed = parseInt(estimated, 10);
        if (!Number.isNaN(parsed)) totalToll += parsed;
      }
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
      { message: "Failed to calculate route." },
      { status: 500 }
    );
  }
}
