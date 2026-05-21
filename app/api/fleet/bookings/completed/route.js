import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectMongoDB } from "../../../../../lib/mongodb";
import Booking from "../../../../../lib/models/booking.model";
import Driver from "../../../../../lib/models/driver.model";

/** GET /api/fleet/bookings/completed?driverId=<optional>
 *  Returns all completed bookings for this fleet's drivers, sorted by pickup time desc. */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const { searchParams } = new URL(req.url);
  const driverIdParam = searchParams.get("driverId");

  await connectMongoDB();

  let fleetOid;
  try { fleetOid = new mongoose.Types.ObjectId(fleetId); }
  catch { return NextResponse.json({ success: false, message: "Invalid fleet ID" }, { status: 400 }); }

  const driverFilter = { fleet: fleetOid };
  if (driverIdParam) {
    try { driverFilter._id = new mongoose.Types.ObjectId(driverIdParam); }
    catch { /* ignore */ }
  }

  const drivers = await Driver.find(driverFilter).select("_id").lean();
  const driverIds = drivers.map((d) => d._id);

  if (driverIds.length === 0) {
    return NextResponse.json({ success: true, bookings: [] });
  }

  const bookings = await Booking.find({
    chauffeur: { $in: driverIds },
    status: { $in: ["completed", "complete"] },
  })
    .populate("chauffeur", "name email")
    .sort({ time: -1 })
    .lean();

  return NextResponse.json({ success: true, bookings });
}
