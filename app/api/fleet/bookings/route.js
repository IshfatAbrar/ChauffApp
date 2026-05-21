import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectMongoDB } from "../../../../lib/mongodb";
import Booking from "../../../../lib/models/booking.model";

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GET /api/fleet/bookings?lat=&lng=
 *  Returns all "requested" future bookings sorted by composite score
 *  (40% distance proximity + 60% urgency). */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  await connectMongoDB();

  const raw = await Booking.find({ status: "requested" })
    .select(
      "status time pickupLocation dropoffLocation stopoverLocation selectedCar price phoneNumber email notes createdAt"
    )
    .lean();

  const now = Date.now();
  const bookings = raw.filter((b) => new Date(b.time) > now);

  const hasCoords = !isNaN(lat) && !isNaN(lng);

  bookings.forEach((b) => {
    const pLat = b.pickupLocation?.lat;
    const pLng = b.pickupLocation?.lng;
    b.distanceFromUser =
      hasCoords && pLat != null && pLng != null
        ? Math.round(haversineMeters(lat, lng, pLat, pLng))
        : null;
    b._msUntil = Math.max(0, new Date(b.time) - now);
  });

  if (hasCoords) {
    const maxDist = Math.max(...bookings.map((b) => b.distanceFromUser ?? 0), 1);
    const maxMs   = Math.max(...bookings.map((b) => b._msUntil), 1);
    bookings.forEach((b) => {
      const dScore = 1 - (b.distanceFromUser ?? 0) / maxDist;
      const uScore = 1 - b._msUntil / maxMs;
      b._score = 0.4 * dScore + 0.6 * uScore;
    });
    bookings.sort((a, b) => b._score - a._score);
  } else {
    bookings.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  bookings.forEach((b) => {
    delete b._msUntil;
    delete b._score;
  });

  return NextResponse.json({ success: true, bookings });
}
