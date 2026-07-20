import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../lib/auth";
import { connectMongoDB } from "../../../../lib/mongodb";
import Booking from "../../../../lib/models/booking.model";
import { advanceFleetAssignment } from "../../../../lib/utils/fleetScoring";

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

/**
 * Lazily advances any bookings whose exclusive fleet window has expired.
 * Runs at most on 10 expired bookings per call to keep latency low.
 */
async function advanceExpiredAssignments() {
  const now = new Date();
  const expired = await Booking.find({
    status: "requested",
    assignedFleet: { $ne: null },
    assignedFleetExpiry: { $lt: now },
  }).limit(10);

  for (const booking of expired) {
    booking.fleetAssignmentHistory.push({
      fleet: booking.assignedFleet,
      assignedAt: booking.updatedAt || booking.createdAt,
      expiredAt: booking.assignedFleetExpiry,
      reason: "timeout",
    });

    advanceFleetAssignment(booking);
    await booking.save();
  }
}

/** GET /api/fleet/bookings?lat=&lng=
 *  Returns "requested" future bookings that this fleet is allowed to see:
 *    • Their exclusive priority window is still open, OR
 *    • The booking has been opened to all fleets (queue exhausted / never assigned).
 *  Also lazily advances any timed-out assignments before querying. */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  await connectMongoDB();

  // Advance timed-out assignments before building this fleet's visible list.
  await advanceExpiredAssignments();

  const fleetId = session.user?.fleetId || session.user?.id;
  let fleetOid;
  try {
    fleetOid = new mongoose.Types.ObjectId(fleetId);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid fleet ID" }, { status: 400 });
  }

  const now = new Date();

  // A fleet can see a booking if:
  //  (a) it is currently assigned to them with an active window, OR
  //  (b) no fleet holds it (opened to all / never queued).
  const raw = await Booking.find({
    status: "requested",
    $or: [
      { assignedFleet: fleetOid, assignedFleetExpiry: { $gt: now } },
      { assignedFleet: null },
      { assignedFleet: { $exists: false } },
    ],
  })
    .select(
      "status time pickupLocation dropoffLocation stopoverLocation selectedCar price phoneNumber email notes createdAt assignedFleet assignedFleetExpiry"
    )
    .lean();

  const nowMs = Date.now();
  const bookings = raw.filter((b) => new Date(b.time) > nowMs);

  const hasCoords = !isNaN(lat) && !isNaN(lng);

  bookings.forEach((b) => {
    const pLat = b.pickupLocation?.lat;
    const pLng = b.pickupLocation?.lng;
    b.distanceFromUser =
      hasCoords && pLat != null && pLng != null
        ? Math.round(haversineMeters(lat, lng, pLat, pLng))
        : null;
    b._msUntil = Math.max(0, new Date(b.time) - nowMs);

    // Indicate whether this fleet has an exclusive window on this booking.
    b.isExclusive = !!(
      b.assignedFleet &&
      b.assignedFleet.toString() === fleetId &&
      b.assignedFleetExpiry &&
      new Date(b.assignedFleetExpiry) > now
    );
    // Expose the expiry time to the client for the countdown UI.
    b.windowExpiresAt = b.isExclusive ? b.assignedFleetExpiry : null;

    // Don't leak other fleets' assignment data.
    delete b.assignedFleet;
    delete b.assignedFleetExpiry;
  });

  if (hasCoords) {
    const maxDist = Math.max(...bookings.map((b) => b.distanceFromUser ?? 0), 1);
    const maxMs   = Math.max(...bookings.map((b) => b._msUntil), 1);
    bookings.forEach((b) => {
      const dScore = 1 - (b.distanceFromUser ?? 0) / maxDist;
      const uScore = 1 - b._msUntil / maxMs;
      // Exclusive bookings get a visual boost to float to the top.
      b._score = 0.4 * dScore + 0.6 * uScore + (b.isExclusive ? 1 : 0);
    });
    bookings.sort((a, b) => b._score - a._score);
  } else {
    // Exclusive bookings first, then by ride time.
    bookings.sort((a, b) => {
      if (a.isExclusive !== b.isExclusive) return a.isExclusive ? -1 : 1;
      return new Date(a.time) - new Date(b.time);
    });
  }

  bookings.forEach((b) => {
    delete b._msUntil;
    delete b._score;
  });

  return NextResponse.json({ success: true, bookings });
}
