import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getFleetDrivers } from "../../../../lib/controllers/fleet.driver.controller";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "fleet") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get fleet ID from session (could be in id or fleetId depending on setup)
    const fleetId = session.user?.fleetId || session.user?.id;
    
    if (!fleetId) {
      return NextResponse.json(
        { message: "Fleet ID not found in session" },
        { status: 400 }
      );
    }

    const result = await getFleetDrivers(fleetId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/fleet/drivers:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

