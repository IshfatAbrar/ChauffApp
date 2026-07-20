import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../../../lib/auth";
import { connectMongoDB } from "../../../../../../lib/mongodb";
import Booking from "../../../../../../lib/models/booking.model";
import { advanceFleetAssignment } from "../../../../../../lib/utils/fleetScoring";

/** POST /api/fleet/bookings/[id]/decline
 *  Lets the currently-assigned fleet explicitly pass on a booking.
 *  The booking is immediately escalated to the next fleet in the queue,
 *  or opened to all fleets if the queue is exhausted. */
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const bookingId = (await params).id;

  await connectMongoDB();

  let fleetOid, bookingOid;
  try {
    fleetOid   = new mongoose.Types.ObjectId(fleetId);
    bookingOid = new mongoose.Types.ObjectId(bookingId);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
  }

  const booking = await Booking.findById(bookingOid);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "requested") {
    return NextResponse.json(
      { success: false, message: "Booking is no longer available to decline" },
      { status: 409 }
    );
  }

  // Only the fleet currently holding the exclusive window can decline.
  if (!booking.assignedFleet || !booking.assignedFleet.equals(fleetOid)) {
    return NextResponse.json(
      { success: false, message: "This booking is not currently assigned to your fleet" },
      { status: 403 }
    );
  }

  // Record the decline in the assignment audit log.
  booking.fleetAssignmentHistory.push({
    fleet: fleetOid,
    assignedAt: booking.updatedAt || booking.createdAt,
    expiredAt: new Date(),
    reason: "declined",
  });

  // Immediately advance to the next fleet.
  advanceFleetAssignment(booking);
  await booking.save();

  const openToAll = !booking.assignedFleet;
  return NextResponse.json({
    success: true,
    message: openToAll
      ? "Booking declined and opened to all fleets."
      : "Booking declined and passed to the next fleet.",
    openToAll,
  });
}
