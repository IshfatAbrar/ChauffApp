import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat == null || lng == null) {
      return NextResponse.json(
        { message: "lat and lng are required." },
        { status: 400 }
      );
    }

    const key =
      process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key) {
      return NextResponse.json({
        place: {
          lat: Number(lat),
          lng: Number(lng),
          name: "Current location",
          label: "Current location",
        },
      });
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${lng}&key=${key}`;

    const res = await fetch(url);
    const data = await res.json();
    const first = data.results?.[0];
    const label = first?.formatted_address || "Current location";

    return NextResponse.json({
      place: {
        lat: Number(lat),
        lng: Number(lng),
        name: first?.address_components?.[0]?.long_name || label,
        label,
      },
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { message: "Failed to reverse geocode." },
      { status: 500 }
    );
  }
}
