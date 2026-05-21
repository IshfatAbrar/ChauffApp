import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../../lib/auth";
import { connectMongoDB } from "../../../../../lib/mongodb";
import Fleet from "../../../../../lib/models/fleet.model";

const ALLOWED_KEYS = ["driversCanAccept", "driversCanCancel"];

/** GET /api/fleet/bookings/settings
 *  Returns the fleet's current bookingSettings. */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;

  await connectMongoDB();

  let fleetOid;
  try { fleetOid = new mongoose.Types.ObjectId(fleetId); }
  catch { return NextResponse.json({ success: false, message: "Invalid fleet ID" }, { status: 400 }); }

  const fleet = await Fleet.findById(fleetOid).select("bookingSettings").lean();
  if (!fleet) {
    return NextResponse.json({ success: false, message: "Fleet not found" }, { status: 404 });
  }

  const settings = {
    driversCanAccept: fleet.bookingSettings?.driversCanAccept ?? true,
    driversCanCancel: fleet.bookingSettings?.driversCanCancel ?? true,
  };

  return NextResponse.json({ success: true, settings });
}

/** PATCH /api/fleet/bookings/settings
 *  Body: one or more of { driversCanAccept, driversCanCancel, driversCanComplete }
 *  Merges the provided fields into bookingSettings. */
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "fleet") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const body = await req.json();

  const updates = {};
  for (const key of ALLOWED_KEYS) {
    if (typeof body[key] === "boolean") {
      updates[`bookingSettings.${key}`] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, message: "No valid settings provided. Allowed fields: " + ALLOWED_KEYS.join(", ") },
      { status: 400 }
    );
  }

  await connectMongoDB();

  let fleetOid;
  try { fleetOid = new mongoose.Types.ObjectId(fleetId); }
  catch { return NextResponse.json({ success: false, message: "Invalid fleet ID" }, { status: 400 }); }

  const fleet = await Fleet.findByIdAndUpdate(
    fleetOid,
    { $set: updates },
    { new: true, select: "bookingSettings" }
  );

  if (!fleet) {
    return NextResponse.json({ success: false, message: "Fleet not found" }, { status: 404 });
  }

  const settings = {
    driversCanAccept: fleet.bookingSettings?.driversCanAccept ?? true,
    driversCanCancel: fleet.bookingSettings?.driversCanCancel ?? true,
  };

  return NextResponse.json({ success: true, message: "Settings updated", settings });
}
