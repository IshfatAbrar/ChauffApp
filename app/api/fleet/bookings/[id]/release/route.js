import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { connectMongoDB } from "../../../../../../lib/mongodb";
import Booking from "../../../../../../lib/models/booking.model";
import Driver from "../../../../../../lib/models/driver.model";

/** PUT /api/fleet/bookings/[id]/release
 *  Body: { driverID }
 *  Removes the driver assignment and reverts the booking to "requested".
 *  Only works if the booking is currently assigned to that driver. */
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const bookingId = (await params).id;
  const { driverID } = await req.json();

  if (!driverID) {
    return NextResponse.json({ success: false, message: "driverID is required" }, { status: 400 });
  }

  await connectMongoDB();

  let fleetOid, driverOid, bookingOid;
  try {
    fleetOid   = new mongoose.Types.ObjectId(fleetId);
    driverOid  = new mongoose.Types.ObjectId(driverID);
    bookingOid = new mongoose.Types.ObjectId(bookingId);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
  }

  const driver = await Driver.findOne({ _id: driverOid, fleet: fleetOid }).lean();
  if (!driver) {
    return NextResponse.json({ success: false, message: "Driver not found in your fleet" }, { status: 403 });
  }

  const booking = await Booking.findById(bookingOid);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  }

  if (!booking.chauffeur || booking.chauffeur.toString() !== driverOid.toString()) {
    return NextResponse.json(
      { success: false, message: "Could not cancel ride — driver is not assigned to this booking" },
      { status: 409 }
    );
  }

  booking.statusHistory.push({ status: booking.status, timestamp: new Date(), updatedBy: "fleet" });
  booking.chauffeur = undefined;
  booking.status = "requested";
  booking.timeline = {};
  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Removed from your timeline",
    result: booking.toObject(),
  });
}
