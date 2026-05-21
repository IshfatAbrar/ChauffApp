import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { connectMongoDB } from "../../../../../../lib/mongodb";
import Booking from "../../../../../../lib/models/booking.model";
import Driver from "../../../../../../lib/models/driver.model";

async function getFleetDriverIds(fleetOid) {
  const drivers = await Driver.find({ fleet: fleetOid }).select("_id").lean();
  return drivers.map((d) => d._id.toString());
}

/** GET /api/fleet/bookings/[id]/timeline — fetch current timeline */
export async function GET(req, { params }) {
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

  const driverIds = await getFleetDriverIds(fleetOid);

  const booking = await Booking.findById(bookingOid).select("chauffeur timeline").lean();
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  }

  if (!driverIds.includes(booking.chauffeur?.toString())) {
    return NextResponse.json({ success: false, message: "Not authorized for this booking" }, { status: 403 });
  }

  return NextResponse.json({ success: true, timeline: booking.timeline || {} });
}

/** PUT /api/fleet/bookings/[id]/timeline
 *  Body: { timeline }
 *  Merges the provided timeline fields into the existing timeline.
 *  Send timeline: {} to reset. */
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const bookingId = (await params).id;
  const { timeline } = await req.json();

  if (timeline === undefined) {
    return NextResponse.json({ success: false, message: "timeline field is required" }, { status: 400 });
  }

  await connectMongoDB();

  let fleetOid, bookingOid;
  try {
    fleetOid   = new mongoose.Types.ObjectId(fleetId);
    bookingOid = new mongoose.Types.ObjectId(bookingId);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
  }

  const driverIds = await getFleetDriverIds(fleetOid);

  const booking = await Booking.findById(bookingOid);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  }

  if (!driverIds.includes(booking.chauffeur?.toString())) {
    return NextResponse.json({ success: false, message: "Not authorized for this booking" }, { status: 403 });
  }

  const isReset = Object.keys(timeline).length === 0;

  if (!isReset) {
    if (timeline.start && !timeline.arrive && !booking.timeline?.arrive) {
      return NextResponse.json(
        { success: false, message: "Please mark arrive before starting the ride" },
        { status: 400 }
      );
    }
    booking.timeline = { ...((booking.timeline || {})), ...timeline };
  } else {
    booking.timeline = {};
  }

  booking.markModified("timeline");
  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Timeline updated successfully",
    result: booking.toObject(),
  });
}
