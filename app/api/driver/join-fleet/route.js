import { NextResponse } from "next/server";
import { joinFleet } from "../../../../lib/controllers/driver.fleet.controller";

export async function POST(req) {
  try {
    const { driverId, fleetId } = await req.json();
    
    if (!driverId || !fleetId) {
        return NextResponse.json({ message: "Missing driverId or fleetId" }, { status: 400 });
    }

    const result = await joinFleet(driverId, fleetId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

