import { NextResponse } from "next/server";
import { listFleets } from "../../../../lib/controllers/driver.fleet.controller";

export async function GET() {
  try {
    const result = await listFleets();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

