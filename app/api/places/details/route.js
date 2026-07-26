import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("place_id");
    const sessionToken = searchParams.get("sessiontoken") || "";

    if (!placeId) {
      return NextResponse.json(
        { message: "place_id is required." },
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

    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=geometry,formatted_address,name` +
      `&key=${key}` +
      (sessionToken ? `&sessiontoken=${sessionToken}` : "");

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json(
        { message: data.error_message || "Place not found." },
        { status: 404 }
      );
    }

    const result = data.result;
    return NextResponse.json({
      place: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        name: result.name || result.formatted_address,
        label: result.formatted_address || result.name,
      },
    });
  } catch (error) {
    console.error("Places details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch place details." },
      { status: 500 }
    );
  }
}
