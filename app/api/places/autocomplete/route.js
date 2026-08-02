import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input");
    const sessionToken = searchParams.get("sessiontoken") || "";
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "50000";

    if (!input?.trim()) {
      return NextResponse.json({ predictions: [] });
    }

    const key =
      process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key) {
      return NextResponse.json(
        { message: "Google API key not configured." },
        { status: 500 }
      );
    }

    let url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(input)}` +
      `&key=${key}`;

    if (sessionToken) {
      url += `&sessiontoken=${sessionToken}`;
    }

    // Bias results toward pickup / current location
    if (lat != null && lng != null && lat !== "" && lng !== "") {
      url +=
        `&location=${encodeURIComponent(`${lat},${lng}`)}` +
        `&radius=${encodeURIComponent(radius)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    return NextResponse.json({
      predictions: data.predictions || [],
      status: data.status,
    });
  } catch (error) {
    console.error("Places autocomplete error:", error);
    return NextResponse.json(
      { message: "Failed to search places." },
      { status: 500 }
    );
  }
}
